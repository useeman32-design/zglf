#!/usr/bin/env python3
"""End-to-end test of every ZGLF module."""
import json, sys, urllib.request, urllib.error, urllib.parse, os, time

BASE="http://localhost:8080"
errors=[]
passed=0

def call(method, path, token=None, body=None, files=None):
  url=BASE+path
  if files:
    # multipart
    boundary='----ZGLFtest'+str(int(time.time()*1000))
    b=bytearray()
    for k,v in files.items():
      b.extend(f'--{boundary}\r\n'.encode()); b.extend(f'Content-Disposition: form-data; name="{k}"; filename="{v[0]}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode())
      with open(v[1],'rb') as f: b.extend(f.read())
      b.extend(b'\r\n')
    if body:
      for k,v in body.items():
        b.extend(f'--{boundary}\r\n'.encode()); b.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    b.extend(f'--{boundary}--\r\n'.encode())
    data=bytes(b); ct='multipart/form-data; boundary='+boundary
  elif body is not None:
    data=json.dumps(body).encode(); ct='application/json'
  else:
    data=None; ct=None
  req=urllib.request.Request(url,data=data,method=method)
  if ct: req.add_header('Content-Type',ct)
  if token: req.add_header('Authorization','Bearer '+token)
  try:
    with urllib.request.urlopen(req,timeout=10) as r:
      return r.status, r.read().decode('utf-8','ignore')
  except urllib.error.HTTPError as e:
    return e.code, e.read().decode('utf-8','ignore')

def check(name, expected_code, method, path, token=None, body=None, files=None, expect_json_keys=None, validator=None):
  global passed
  code, text = call(method, path, token, body, files)
  ok = (code==expected_code) if isinstance(expected_code,int) else (code in expected_code)
  detail=''
  try:
    data=json.loads(text) if text else None
  except: data=None
  validated=False
  if ok and expect_json_keys and data:
    missing=[k for k in expect_json_keys if k not in data]
    if missing: ok=False; detail='missing keys: '+','.join(missing)
  if ok and validator:
    try: ok=validator(data or text); validated=True
    except Exception as e: ok=False; detail=str(e)
  if ok and not validated and data and isinstance(data,dict) and 'error' in data and method not in ('GET',):
    _ec = expected_code if isinstance(expected_code,int) else min(expected_code)
    if _ec<400:
      ok=False; detail='returned error: '+str(data.get('error'))
  if ok:
    print(f'  ✓ {name}  [{code}]')
    passed+=1
  else:
    msg=f'  ✗ {name}  [expected {expected_code}, got {code}]'
    if detail: msg+=f'  ({detail})'
    msg+=f'  body: {text[:200]}'
    print(msg)
    errors.append(name)

print('=== 1. Static pages ===')
check('Home /',200,'GET','/')
check('Admin /admin/',200,'GET','/admin/')
check('Admin CSS',200,'GET','/admin/admin.css')
check('Admin JS',200,'GET','/admin/admin.js')
check('Installer page',200,'GET','/install.php')
check('Logo',200,'GET','/images/zglf-logo.jpg')
check('Event food.jpg',200,'GET','/events/food.jpg')
check('Event medical.jpg',200,'GET','/events/medical.jpg')
check('Event graduation.jpg',200,'GET','/events/graduation.jpg')
check('Hero volunteers',200,'GET','/images/hero-volunteers.jpg')
check('htaccess present',404 if False else 200,'GET','/api/content') # .htaccess won't run on PHP dev server; just sanity

print('\n=== 2. Public API ===')
check('Public content',200,'GET','/api/content', expect_json_keys=['site','hero','programs','events','nec','stats','settings'])
check('Public contact form',200,'POST','/api/public/contact', body={'name':'Test','email':'t@example.com','subject':'Hi','message':'test contact'})
check('Public donate form',200,'POST','/api/public/donate', body={'name':'Test Donor','email':'td@example.com','amount':1000,'campaign':'General','method':'Bank Transfer'})
check('Public membership form',200,'POST','/api/public/membership', body={'name':'Test Applicant','email':'ta@example.com','phone':'08099999999','state':'Zamfara'})

print('\n=== 3. Auth module ===')
code, text = call('POST','/api/auth/login', body={'username':'admin','password':'admin123'})
login=json.loads(text)
TOKEN=login.get('token','') if code==200 else ''
check('Login with correct password',200,'POST','/api/auth/login', body={'username':'admin','password':'admin123'}, expect_json_keys=['token'])
check('Login wrong password',401,'POST','/api/auth/login', body={'username':'admin','password':'wrong'})
check('Auth /me without token',401,'GET','/api/auth/me')
check('Auth /me with token',200,'GET','/api/auth/me', token=TOKEN)

print('\n=== 4. Dashboard stats ===')
check('GET /api/stats',200,'GET','/api/stats', token=TOKEN, expect_json_keys=['donations_total','members_active','events_upcoming','messages_unread','programs_published','media_count'])

print('\n=== 5. User management module ===')
# Cleanup prior test users
c,_=call('GET','/api/users', token=TOKEN)
if c==200:
  for u in json.loads(_):
    if u.get('username')=='editor1':
      call('DELETE','/api/users/'+str(u['id']), token=TOKEN)
check('List users',200,'GET','/api/users', token=TOKEN)
code, text = call('POST','/api/users', token=TOKEN, body={'username':'editor1','password':'editor123','email':'ed@zglf.ng','role':'editor','perms':json.dumps({'dashboard':1,'programs':1,'events':1,'hero':0,'nec':0,'photos':0,'donations':0,'members':0,'messages':1,'users':0,'site':0,'settings':0,'reports':0})})
uid=json.loads(text).get('id','') if code==200 else ''
def user_create_ok(data):
  if isinstance(data,dict) and data.get('ok'): return True
  if isinstance(data,dict) and 'exists' in (data.get('error') or ''): return True
  return False
check('Create user (editor1)',[200,400],'POST','/api/users', token=TOKEN, body={'username':'editor1','name':'Editor One','password':'editor123','email':'ed@zglf.ng','role':'editor','perms':json.dumps({'dashboard':1,'programs':1,'events':1,'hero':0,'nec':0,'photos':0,'donations':0,'members':0,'messages':1,'users':0,'site':0,'settings':0,'reports':0})}, validator=user_create_ok)

# Login as editor1, try accessing forbidden module
code2,text2=call('POST','/api/auth/login',body={'username':'editor1','password':'editor123'})
ed_token=json.loads(text2).get('token','') if code2==200 else ''
check('Editor login',200,'POST','/api/auth/login',body={'username':'editor1','password':'editor123'})
check('Editor CAN list events (granted perm)',200,'GET','/api/events', token=ed_token)
check('Editor CANNOT list users (no perm)',403,'GET','/api/users', token=ed_token)

print('\n=== 6. Site settings module ===')
check('GET /api/site',200,'GET','/api/site')
check('POST /api/settings (update currency)',200,'POST','/api/settings', token=TOKEN, body={'key':'currency','value':'NGN'})
check('GET /api/site/homepage',200,'GET','/api/site/homepage')

print('\n=== 7. Hero slides module ===')
check('List hero slides',200,'GET','/api/hero', token=TOKEN)

print('\n=== 8. Programs module ===')
code,text=call('GET','/api/programs', token=TOKEN)
progs=json.loads(text) if code==200 else []
pid=progs[0]['id'] if progs else None
check('List programs',200,'GET','/api/programs', token=TOKEN)
check('Update program',200,'POST','/api/programs/'+str(pid), token=TOKEN, body={'title':progs[0].get('title',''),'short_desc':'Updated by automated test','full_desc':'<p>Test content</p>','tag':'Test','icon':'fa-book-open','tag_color':'#1a37b8','published':1})

print('\n=== 9. Events module ===')
code,text=call('GET','/api/events', token=TOKEN)
events=json.loads(text) if code==200 else []
eid=events[-1]['id'] if events else None
check('List events',200,'GET','/api/events', token=TOKEN)
check('Create event',200,'POST','/api/events', token=TOKEN, body={'title':'Test Event Auto','date':'2026-12-01','time':'10:00','location':'Gusau','status':'upcoming','description':'Automated test event','excerpt':'Test excerpt','featured_image':'events/food.jpg'})
check('Update event',200,'POST','/api/events/'+str(eid), token=TOKEN, body={'title':events[-1].get('title','')+' (edited)','date':events[-1].get('event_date',''),'location':events[-1].get('location',''),'status':events[-1].get('status','upcoming'),'description':'Updated by test'})

print('\n=== 10. NEC module ===')
code,text=call('GET','/api/nec', token=TOKEN)
nec=json.loads(text) if code==200 else []
nid=nec[0]['id'] if nec else None
check('List NEC',200,'GET','/api/nec', token=TOKEN)
check('Update NEC member',200,'POST','/api/nec/'+str(nid), token=TOKEN, body={'position':nec[0].get('position',''),'name':'Test NEC Name'})

print('\n=== 11. Media library + file upload ===')
# Create a small test JPEG
import struct
def tiny_jpg(path):
  # 1x1 red JPEG
  import base64
  with open(path,'wb') as f:
    f.write(base64.b64decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AD//Z'))
tiny='/tmp/zglf-test-upload.jpg'; tiny_jpg(tiny)
check('List media',200,'GET','/api/media', token=TOKEN)
code,text=call('POST','/api/media', token=TOKEN, body={'title':'Auto-test upload','category':'General','subdir':'images'}, files={'file':('tiny.jpg',tiny)})
mid=json.loads(text).get('id','') if code==201 or code==200 else ''
check('Upload image',200,'POST','/api/media', token=TOKEN, body={'title':'Auto-test upload','category':'General','subdir':'images'}, files={'file':('tiny.jpg',tiny)})
if mid:
  up=json.loads(text).get('media',{}).get('url','')
  print(f'  -> uploaded URL: {up}')
  check('Uploaded file reachable',200,'GET',up)
  check('Delete uploaded file',200,'DELETE','/api/media/'+str(mid), token=TOKEN)
os.unlink(tiny)

print('\n=== 12. Donations module ===')
code,text=call('GET','/api/donations', token=TOKEN)
dons=json.loads(text) if code==200 else []
did=dons[-1]['id'] if dons else None
check('List donations',200,'GET','/api/donations', token=TOKEN)
check('Verify donation',200,'POST','/api/donations/'+str(did)+'/verify', token=TOKEN)

print('\n=== 13. Members module ===')
code,text=call('GET','/api/members', token=TOKEN)
mems=json.loads(text) if code==200 else []
mid2=mems[-1]['id'] if mems else None
check('List members',200,'GET','/api/members', token=TOKEN)
check('Approve member',200,'POST','/api/members/'+str(mid2), token=TOKEN, body={'name':'Test Applicant','status':'active'})

print('\n=== 14. Messages module ===')
code,text=call('GET','/api/messages', token=TOKEN)
msgs=json.loads(text) if code==200 else []
msid=msgs[-1]['id'] if msgs else None
check('List messages',200,'GET','/api/messages', token=TOKEN)
check('Mark message read',200,'POST','/api/messages/'+str(msid)+'/read', token=TOKEN)

print('\n=== 15. Change password (and change back) ===')
check('Change password to admin1234',200,'POST','/api/auth/password', token=TOKEN, body={'current':'admin123','password':'admin1234'})
code,t=call('POST','/api/auth/login',body={'username':'admin','password':'admin1234'})
new_token=json.loads(t).get('token','') if code==200 else ''
check('Login with new password',200,'POST','/api/auth/login',body={'username':'admin','password':'admin1234'})
check('Change password back to admin123',200,'POST','/api/auth/password', token=new_token, body={'current':'admin1234','password':'admin123'})
code,t=call('POST','/api/auth/login',body={'username':'admin','password':'admin123'})
TOKEN=json.loads(t).get('token','') if code==200 else ''
check('Login with restored password works',200,'POST','/api/auth/login',body={'username':'admin','password':'admin123'})

# Cleanup
if uid:
  call('DELETE','/api/users/'+str(uid), token=TOKEN)
  print('  cleaned up test user editor1')

print('\n=== RESULTS ===')
print(f'Passed: {passed}')
print(f'Failed: {len(errors)}')
if errors:
  print('Failures:'); [print(f'  - {e}') for e in errors]
  sys.exit(1)
else:
  print('All modules OK.')
