/* ============================================================
   ZGLF Admin — connects to PHP backend at /api/
============================================================ */
/* From admin/ page, ../ goes to the site root (whether that's / or /zglf/).
   Use relative paths everywhere so we don't need to detect install folder. */
const REL='../';
const API=REL+'api/';
function resolveAsset(url){
  if(!url)return '';
  if(url.startsWith('http://')||url.startsWith('https://')||url.startsWith('data:'))return url;
  // already relative ../
  if(url.startsWith('../'))return url;
  // strip leading slash to avoid server-root absolute
  url=url.replace(/^\/+/,'');
  return REL+url;
}
const FALLBACK_LOGO=REL+'images/zglf-logo.jpg';
const DEFAULT_NEC_PHOTO=REL+'images/nec-pro.jpg';
const DEFAULT_PROG_COVER=REL+'images/team-community.jpg';
const DEFAULT_EVENT_COVER=REL+'images/hero-volunteers.jpg';
const NEC_PHOTO_MAP={
  'National President':'images/nec-president.jpg',
  'Vice President':'images/nec-vice.jpg',
  'National Secretary':'images/nec-secretary.jpg',
  'Deputy National Secretary':'images/nec-assistant.jpg',
  'National Treasurer':'images/nec-treasurer.jpg',
  'Financial Secretary':'images/nec-pro.jpg',
  'National Publicity Secretary':'images/nec-pro.jpg',
  'National Welfare Officer':'images/nec-auditor.jpg'
};
function necDefaultPhoto(role){return resolveAsset(NEC_PHOTO_MAP[role]||'images/nec-pro.jpg');}
function progDefaultCover(title){
  if(!title)return DEFAULT_PROG_COVER;
  const t=title.toLowerCase();
  if(/health|medical/i.test(t))return REL+'images/medical-outreach.jpg';
  if(/food|relief|humanitarian/i.test(t))return REL+'images/humanitarian-food.jpg';
  if(/education|literacy|scholar/i.test(t))return REL+'images/education-scholarship.jpg';
  if(/empower|skill|microgrant|entrepreneur/i.test(t))return REL+'images/youth-empowerment.jpg';
  return DEFAULT_PROG_COVER;
}
let TOKEN=localStorage.getItem('zglf_token')||'';
let USER=JSON.parse(localStorage.getItem('zglf_user')||'null');
let DATA={};
let CURRENT_PAGE='dashboard';

/* ---------- API helper ---------- */
async function api(endpoint,opts={}){
  const o={method:opts.method||'GET',headers:{'Content-Type':'application/json'}};
  if(TOKEN)o.headers['Authorization']='Bearer '+TOKEN;
  if(opts.body)o.body=typeof opts.body==='string'?opts.body:JSON.stringify(opts.body);
  if(opts.form){
    const fd=new FormData();
    for(const k in opts.form)if(opts.form[k]!==null&&opts.form[k]!==undefined)fd.append(k,opts.form[k]);
    delete o.headers['Content-Type'];o.body=fd;o.method='POST';
  }
  const r=await fetch(API+endpoint,o);
  if(r.status===401){TOKEN='';USER=null;localStorage.removeItem('zglf_token');localStorage.removeItem('zglf_user');location.hash='#/login';throw new Error('Unauthorized');}
  const ct=r.headers.get('content-type')||'';
  const data=ct.includes('application/json')?await r.json():await r.text();
  if(!r.ok){if(data.error)toast(data.error,'error');throw new Error(data.error||'Request failed');}
  return data;
}
let opps; // typo guard

/* ---------- Auth ---------- */
document.getElementById('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const u=document.getElementById('loginEmail').value.trim();
  const p=document.getElementById('loginPass').value;
  try{
    const r=await api('auth/login',{body:{username:u,password:p},method:'POST'});
    TOKEN=r.token;USER=r.user;
    localStorage.setItem('zglf_token',TOKEN);localStorage.setItem('zglf_user',JSON.stringify(USER));
    location.hash='#/dashboard';render();
  }catch(err){document.getElementById('loginError').style.display='flex';document.querySelector('#loginError span').textContent='Invalid username or password.';}
});
async function logout(){
  // Force logout immediately regardless of server response
  try{
    if(TOKEN){const r=await fetch(API+'auth/logout',{method:'POST',headers:{'Authorization':'Bearer '+TOKEN},keepalive:true});}
  }catch(e){}
  TOKEN='';USER=null;
  localStorage.removeItem('zglf_token');
  localStorage.removeItem('zglf_user');
  sessionStorage.clear();
  location.hash='#/login';
  // Hide app, show login forcibly
  const lv=document.getElementById('loginView');const av=document.getElementById('appView');
  if(lv)lv.style.display='flex';if(av)av.style.display='none';
  // Hard reload to guarantee clean state (clears any JS memory issues)
  setTimeout(()=>{location.reload();},150);
}
function can(p){if(!USER)return false;if(USER.role==='admin')return true;return!!(USER.perms&&USER.perms[p]);}

/* ---------- Utilities ---------- */
function $(s,r=document){return r.querySelector(s);}
function $$(s,r=document){return [...r.querySelectorAll(s)];}
function money(n){const sym=DATA.settings?.currencySymbol||'₦';return sym+Number(n||0).toLocaleString();}
function dateFmt(d){try{return new Date(d).toLocaleDateString('en-NG',{year:'numeric',month:'short',day:'numeric'});}catch(e){return d;}}
function dateFmtShort(d){try{const dt=new Date(d);return{day:dt.getDate(),month:dt.toLocaleString('en-US',{month:'short'})};}catch(e){return{day:'?',month:'?'};}}
function initials(n){return(n||'').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';}
function esc(s){if(s===null||s===undefined)return'';return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(msg,type='success'){const t=$('#toast');t.className='toast '+type;t.innerHTML=`<i class="fa-solid ${type==='error'?'fa-circle-xmark':'fa-circle-check'}"></i>${msg}`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}
function openModal(html,xl=false){const m=$('#modal'),i=$('#modalInner');i.className='modal'+(xl?' xl':'');i.innerHTML=html;m.classList.add('open');i.scrollTop=0;}
function closeModal(){$('#modal').classList.remove('open');}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
function toggleSidebar(){$('#sidebar').classList.toggle('open');$('#mobileOverlay').classList.toggle('open');}
let op;// unused

/* ---------- Menu ---------- */
const MENU=[
  {section:"Overview",items:[{key:"dashboard",label:"Dashboard",icon:"fa-gauge-high",perm:"dashboard"}]},
  {section:"Homepage Builder",items:[
    {key:"hero",label:"Hero Section",icon:"fa-panorama",perm:"hero"},
    {key:"nec",label:"NEC / Leadership",icon:"fa-user-tie",perm:"nec"},
    {key:"site",label:"Site Info",icon:"fa-building",perm:"site"},
    {key:"media",label:"Media Library",icon:"fa-images",perm:"photos"}]},
  {section:"Content",items:[
    {key:"programs",label:"Programs",icon:"fa-diagram-project",perm:"programs"},
    {key:"events",label:"Events",icon:"fa-calendar-days",perm:"events"}]},
  {section:"Operations",items:[
    {key:"donations",label:"Donations",icon:"fa-hand-holding-dollar",perm:"donations"},
    {key:"members",label:"Members",icon:"fa-users",perm:"members"},
    {key:"messages",label:"Messages",icon:"fa-envelope",perm:"messages",badge:true}]},
  {section:"Administration",items:[
    {key:"users",label:"Users & Roles",icon:"fa-user-shield",perm:"users"},
    {key:"reports",label:"Reports",icon:"fa-chart-line",perm:"reports"},
    {key:"settings",label:"Settings",icon:"fa-cog",perm:"settings"}]}
];
const PERM_LABEL={dashboard:"Dashboard",hero:"Hero",nec:"NEC/Leadership",site:"Site Info",programs:"Programs",events:"Events",donations:"Donations",photos:"Media",members:"Members",messages:"Messages",users:"Users",reports:"Reports",settings:"Settings"};
const PERM_ICON={dashboard:"fa-gauge-high",hero:"fa-panorama",nec:"fa-user-tie",site:"fa-building",programs:"fa-diagram-project",events:"fa-calendar-days",donations:"fa-hand-holding-dollar",photos:"fa-images",members:"fa-users",messages:"fa-envelope",users:"fa-user-shield",reports:"fa-chart-line",settings:"fa-cog"};

function buildSidebar(){
  const nav=$('#sidebarNav');const unread=(DATA.messages||[]).filter(m=>!m.is_read||!m.read).length;
  nav.innerHTML=MENU.map(sec=>{
    const visible=sec.items.filter(it=>it.perm==="dashboard"||can(it.perm));
    if(!visible.length)return'';
    return `<div class="nav-section">${sec.section}</div>`+visible.map(it=>{
      const badge=(it.key==='messages'&&unread)?`<span class="nav-badge">${unread}</span>`:'';
      return `<div class="nav-item" data-route="${it.key}" onclick="navigate('${it.key}')"><i class="fa-solid ${it.icon}"></i>${it.label}${badge}</div>`;
    }).join('');
  }).join('');
}

/* ---------- Router ---------- */
function navigate(k){location.hash='#/'+k;}
function setActive(k){$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.route===k));}

const TITLES={dashboard:["Dashboard","Overview"],hero:["Hero Section","Slides, headline & CTAs"],nec:["NEC Leadership","Ranks, bios & photos"],programs:["Programs","Initiatives"],events:["Events","With photos & videos"],media:["Media Library","Photos & videos"],site:["Site Info","Organization details"],donations:["Donations","Track & verify"],members:["Members","Members & applicants"],messages:["Messages","Inbox"],users:["Users & Roles","Staff accounts"],reports:["Reports","Analytics & export"],settings:["Settings","Preferences"]};

/* Media uploader */
function mediaUploader(initial,inputId,hint){
  const m=initial||null;
  return `<div id="${inputId}-wrap">
    <div class="upload-zone" onclick="document.getElementById('${inputId}-file').click()"><i class="fa-solid fa-cloud-arrow-up"></i><p><strong>Click to upload</strong></p><small>${hint||'Image or video'}</small><input type="file" id="${inputId}-file" accept="image/*,video/*" style="display:none" onchange="handleMediaUpload(event,'${inputId}')"></div>
    <div class="url-input-row"><span>or URL:</span><input class="form-input" id="${inputId}-url" placeholder="https://..." value="${m?esc(m.url):''}"><button type="button" class="btn btn-sm btn-outline" onclick="applyMediaUrl('${inputId}')">Use</button></div>
    <div class="media-preview" id="${inputId}-preview" style="${m?'':'display:none'}"><div class="media-thumb" id="${inputId}-thumb"></div></div>
    <input type="hidden" id="${inputId}-data" value="${m?esc(JSON.stringify(m)):''}">
  </div>`;
}
function showMediaThumb(id,data){
  const wrap=$('#'+id+'-preview');const thumb=$('#'+id+'-thumb');
  if(!wrap||!thumb)return;
  wrap.style.display='flex';
  const url=resolveAsset(data.url);
  const errFallback=`<i class="fa-solid fa-image" style="font-size:28px;color:var(--gray-400);margin-top:20px"></i><span style="font-size:11px;color:var(--gray-400);padding:6px">Image not found</span>`;
  thumb.innerHTML=(data.type==='video'?`<video src="${url}" muted style="width:100%;height:100px;object-fit:cover"></video>`:`<img src="${url}" style="width:100%;height:100px;object-fit:cover" onerror="this.outerHTML='${errFallback.replace(/'/g,"\\'")}'">`)+`<span class="media-type">${data.type==='video'?'Video':'Image'}</span><button type="button" class="remove-btn" onclick="clearMedia('${id}')"><i class="fa-solid fa-xmark"></i></button>`;
  wrap.classList.add('has');
}
function handleMediaUpload(e,id){
  const f=e.target.files[0];if(!f)return;
  if(f.type.startsWith('video/')&&f.size>25*1024*1024){toast('Video >25MB. Use a URL instead.','error');return;}
  const r=new FileReader();r.onload=ev=>{
    const data={type:f.type.startsWith('video/')?'video':'image',url:ev.target.result,name:f.name,_file:f};
    $('#'+id+'-data').value=JSON.stringify(data).replace(/"/g,'&quot;').replace(/'/g,"&#39;");// for form only
    showMediaThumb(id,data);
    // Actually we need to store the File reference for upload
    window['__mu_'+id]=data;
  };r.readAsDataURL(f);
}
function applyMediaUrl(id){
  const url=$('#'+id+'-url').value.trim();if(!url)return;
  const isVideo=/\.(mp4|webm|mov)(\?|$)/i.test(url);
  const data={type:isVideo?'video':'image',url:url};
  $('#'+id+'-data').value=JSON.stringify(data);
  showMediaThumb(id,data);window['__mu_'+id]=data;
}
function clearMedia(id){$('#'+id+'-data').value='';const u=$('#'+id+'-url');if(u){u.value='';}$('#'+id+'-preview').style.display='none';$('#'+id+'-preview').classList.remove('has');$('#'+id+'-file').value='';window['__mu_'+id]=null;}
function getMediaVal(id){
  const v=$('#'+id+'-data').value;if(!v)return null;
  try{return JSON.parse(v.replace(/&quot;/g,'"').replace(/&#39;/g,"'"));}catch(e){return null;}
}
// Async: upload if file, else return the url
async function resolveMedia(id,subdir='images'){
  const d=window['__mu_'+id];if(!d)return null;
  if(d._file){return await _doUpload(d._file,subdir);}
  return d;
}

/* Multi-media */
let mmItems={};
function mmInit(id,containerId,hiddenId,existing){
  mmItems[id]=existing?[...existing]:[];
  mmRender(id,containerId,hiddenId);
}
function mmRender(id,cid,hid){
  const h=$(hid);const c=$('#'+cid);
  if(!h||!c)return setTimeout(()=>mmRender(id,cid,hid),30);
  h.value=JSON.stringify(mmItems[id]||[]);
  c.innerHTML=(mmItems[id]||[]).map((m,i)=>`
    <div class="media-thumb">
      ${m.type==='video'?`<video src="${resolveAsset(m.url)}" muted style="width:100%;height:100px;object-fit:cover"></video>`:`<img src="${resolveAsset(m.url)}" style="width:100%;height:100px;object-fit:cover" onerror="this.style.opacity=0.3">`}
      <span class="media-type">${m.type}</span>
      <button type="button" class="remove-btn" onclick="mmRemove('${id}','${cid}','${hid}',${i})"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}
function mmAdd(id,cid,hid,data){mmItems[id].push(data);mmRender(id,cid,hid);}
function mmRemove(id,cid,hid,i){mmItems[id].splice(i,1);mmRender(id,cid,hid);}
async function mmAddFiles(id,cid,hid,files,subdir){
  for(const f of files){
    if(f.type.startsWith('video/')&&f.size>50*1024*1024){toast(`Skipping ${f.name} (too large)`,'error');continue;}
    try{const m=await _doUpload(f,subdir||'images');if(m)mmItems[id].push({type:m.type,url:m.url});}
    catch(e){toast('Upload failed: '+e.message,'error');}
  }
  mmRender(id,cid,hid);
}

/* ---------- Router / Render ---------- */
const PAGES={dashboard:renderDashboard,hero:renderHero,nec:renderNEC,programs:renderPrograms,events:renderEvents,media:renderMedia,site:renderSite,donations:renderDonations,members:renderMembers,messages:renderMessages,users:renderUsers,reports:renderReports,settings:renderSettings};

async function render(){
  if(!TOKEN||!USER){
    try{const me=await api('auth/me');USER=me;localStorage.setItem('zglf_user',JSON.stringify(USER));}catch(e){$('#loginView').style.display='flex';$('#appView').style.display='none';return;}
  }
  const hash=location.hash.replace('#/','')||'dashboard';
  let page=hash;if(!PAGES[page])page='dashboard';
  const mi=MENU.flatMap(s=>s.items).find(i=>i.key===page);
  if(mi&&mi.perm!=="dashboard"&&!can(mi.perm)){page='dashboard';toast('Permission denied','error');}
  CURRENT_PAGE=page;
  $('#loginView').style.display='none';$('#appView').style.display='block';
  $('#userName').textContent=USER.name;
  $('#userRole').textContent=USER.role==='admin'?'Administrator':'Staff';
  $('#userAvatar').textContent=initials(USER.name);

  // Load dynamic data needed for chrome
  try{
    const[p1,p2,p3]=await Promise.all([
      api('stats'),api('site'),api('messages')
    ]);
    DATA.stats=p1;DATA.site=p2;DATA.messages=p3;
  }catch(e){}
  buildSidebar();setActive(page);
  const t=TITLES[page];$('#pageTitle').textContent=t[0];$('#pageSubtitle').textContent=t[1];
  const unread=(DATA.messages||[]).filter(m=>m.is_read==0||m.read==0).length;
  const b=$('#msgBadge');b.textContent=unread;b.style.display=unread?'flex':'none';
  try{await PAGES[page]();}catch(e){console.error(e);$('#pageContent').innerHTML='<div class="card"><div class="card-body" style="text-align:center;padding:60px;color:var(--gray-400)"><i class="fa-solid fa-triangle-exclamation" style="font-size:42px;display:block;margin-bottom:12px"></i><p>Error loading page.</p></div></div>';}
}
window.addEventListener('hashchange',render);

/* ---------- DASHBOARD ---------- */
async function renderDashboard(){
  const s=DATA.stats||await api('stats');
  const don=s.donations_total;pending=s.donations_pending||0;members=s.members_active;upcoming=s.events_upcoming;unread=s.messages_unread;media=s.media_count;
  const videos=0;
  $('#pageContent').innerHTML=`
    <div class="stats-grid">
      <div class="stat-card gold"><div class="stat-top"><div class="stat-icon gold"><i class="fa-solid fa-hand-holding-dollar"></i></div></div><div class="stat-label">Total Raised</div><div class="stat-value">${money(don)}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div></div><div class="stat-label">Active Members</div><div class="stat-value">${members}</div></div>
      <div class="stat-card green"><div class="stat-top"><div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div></div><div class="stat-label">Upcoming Events</div><div class="stat-value">${upcoming}</div></div>
      <div class="stat-card red"><div class="stat-top"><div class="stat-icon red"><i class="fa-solid fa-envelope"></i></div></div><div class="stat-label">Unread Messages</div><div class="stat-value">${unread}</div></div>
      <div class="stat-card purple"><div class="stat-top"><div class="stat-icon purple"><i class="fa-solid fa-photo-film"></i></div></div><div class="stat-label">Media Items</div><div class="stat-value">${media}</div></div>
    </div>
    <div class="quick-actions">
      ${can('hero')?`<button class="quick-action" onclick="navigate('hero')"><i class="fa-solid fa-panorama"></i><h4>Edit Hero</h4><p>Slides & headline</p></button>`:''}
      ${can('programs')?`<button class="quick-action" onclick="navigate('programs');setTimeout(()=>openProgramModal(),200)"><i class="fa-solid fa-plus"></i><h4>New Program</h4><p>Add initiative</p></button>`:''}
      ${can('events')?`<button class="quick-action" onclick="navigate('events');setTimeout(()=>openEventModal(),200)"><i class="fa-solid fa-calendar-plus"></i><h4>Create Event</h4><p>Photos/videos</p></button>`:''}
      ${can('nec')?`<button class="quick-action" onclick="navigate('nec');setTimeout(()=>openNecModal(),200)"><i class="fa-solid fa-user-plus"></i><h4>Add NEC</h4><p>Leadership member</p></button>`:''}
      ${can('donations')&&pending?`<button class="quick-action" onclick="navigate('donations')"><i class="fa-solid fa-circle-check"></i><h4>${pending} pending</h4><p>Verify donations</p></button>`:''}
    </div>
    <div class="charts-grid">
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-chart-column"></i>Donations (12 months)</h3></div><div class="card-body"><div class="chart-box"><canvas id="c1"></canvas></div></div></div>
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-chart-pie"></i>By Campaign</h3></div><div class="card-body"><div class="chart-box"><canvas id="c2"></canvas></div></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="db2">
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left"></i>Recent Activity</h3></div><div class="card-body" id="af"></div></div>
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-calendar-days"></i>Upcoming Events</h3>${can('events')?`<button class="btn btn-sm btn-gold" onclick="openEventModal()"><i class="fa-solid fa-plus"></i>New</button>`:''}</div><div class="card-body p-sm" id="ue"></div></div>
    </div>
    <style>@media(max-width:900px){.db2{grid-template-columns:1fr!important}}</style>
  `;
  // Charts (destroy previous instances if any to avoid "Canvas is already in use")
  setTimeout(()=>{
    ['c1','c2'].forEach(id=>{const c=Chart.getChart($('#'+id));if(c)c.destroy();});
    const md=s.monthly_donations||[];
    const labels=md.map(x=>x.m);const data=md.map(x=>x.total/1000);
    new Chart($('#c1'),{type:'bar',data:{labels,datasets:[{label:'₦ (thousands)',data,backgroundColor:'rgba(26,55,184,0.8)',borderRadius:8,maxBarThickness:36}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'}},x:{grid:{display:false}}}}});
    const pc=s.by_campaign||[];
    new Chart($('#c2'),{type:'doughnut',data:{labels:pc.map(x=>x.campaign),datasets:[{data:pc.map(x=>Number(x.total)),backgroundColor:['#1a37b8','#f5c842','#10b981','#ef4444','#8b5cf6','#ef6c00'],borderWidth:0}]},options:{cutout:'65%',responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:12,font:{size:11},usePointStyle:true}}}}});
    // Activity
    const acts=s.activity||[];
    $('#af').innerHTML=acts.length?acts.map(a=>`<div class="activity-item"><div class="activity-icon" style="background:var(--azure-50);color:var(--azure-700)"><i class="fa-solid fa-circle-check"></i></div><div class="activity-body"><p><strong>${esc(a.user_name||'System')}</strong> ${esc(a.action)}</p><div class="activity-time">${dateFmt(a.created_at)}</div></div></div>`).join(''):'<p style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">No activity yet.</p>';
  },50);
  // Upcoming events
  try{const evs=await api('events');const up=evs.filter(e=>e.status==='upcoming').slice(0,4);
    $('#ue').innerHTML=up.length?up.map(e=>{const d=dateFmtShort(e.event_date);const cover=e.media&&e.media[0]?e.media[0]:null;
      return`<div class="activity-item"><div class="activity-icon" style="background:var(--gold-50);color:var(--gold-600);border-radius:10px;width:48px;height:48px;font-size:11px;flex-direction:column;text-align:center;"><strong style="font-size:15px;line-height:1">${d.day}</strong><span style="font-size:8px;text-transform:uppercase;font-weight:700">${d.month}</span></div><div class="activity-body"><p><strong>${esc(e.title)}</strong></p><div class="activity-time"><i class="fa-solid fa-location-dot"></i> ${esc(e.location||'TBA')} · ${e.event_time||''} ${e.media&&e.media.some(m=>m.type==='video')?'<i class="fa-solid fa-video" style="color:var(--rose);margin-left:8px"></i>':''}</div></div></div>`;}).join(''):'<p style="color:var(--gray-400);font-size:13px;text-align:center;padding:16px">No upcoming events.</p>';
  }catch(e){}
}

/* ---------- HERO ---------- */
let HERO=null;
async function renderHero(){
  if(!can('hero'))return;
  HERO=await api('hero');
  $('#pageContent').innerHTML=`
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-pen-to-square"></i>Hero Text & CTAs</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="full"><label class="form-label">Headline <span class="req">*</span></label><textarea class="form-input" id="h-hl" rows="3">${esc(HERO.text.headline)}</textarea><p class="form-help">Use &lt;em&gt;word&lt;/em&gt; to highlight words in gold italics.</p></div>
        <div class="full"><label class="form-label">Top badge</label><input class="form-input" id="h-sub" value="${esc(HERO.text.subhead)}"></div>
        <div class="full"><label class="form-label">Vision quote</label><textarea class="form-input" id="h-vq" rows="2">${esc(HERO.text.visionquote)}</textarea></div>
        <div class="full"><label class="form-label">Body paragraph</label><textarea class="form-input" id="h-bd" rows="3">${esc(HERO.text.body)}</textarea></div>
        <div><label class="form-label">Primary button</label><input class="form-input" id="h-c1" value="${esc(HERO.text.ctaPrimary)}"></div>
        <div><label class="form-label">Secondary button</label><input class="form-input" id="h-c2" value="${esc(HERO.text.ctaSecondary)}"></div>
      </div>
      <div style="margin-top:18px;display:flex;justify-content:flex-end"><button class="btn btn-primary" style="width:auto" onclick="saveHeroText()"><i class="fa-solid fa-save"></i>Save Text</button></div>
    </div></div>
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-images"></i>Carousel Slides</h3>
      <div><span class="tag gold">${HERO.slides.length} slides</span> <button class="btn btn-sm btn-gold" onclick="openSlideModal()"><i class="fa-solid fa-plus"></i>Add Slide</button></div></div>
      <div class="card-body"><div id="slidesGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px"></div></div>
    </div>`;
  renderSlides();
}
function renderSlides(){
  $('#slidesGrid').innerHTML=HERO.slides.map((s,i)=>{
    const total=HERO.slides.length;
    return`<div class="hero-slide-preview ${i===0?'active':''}">
      <div class="thumb" style="${s.type==='image'?`background-image:url('${resolveAsset(s.url)}')`:''}">
        ${s.type==='video'?`<video src="${resolveAsset(s.url)}" muted style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`:''}
        <span class="media-type" style="position:absolute;top:10px;right:10px">${s.type}</span>
        <div class="thumb-info"><h5>${esc(s.alt||'Slide '+(i+1))}</h5><small>${esc(s.caption||'')}</small></div>
      </div>
      <div class="hero-slide-actions">
        <div class="left">
          <button class="icon-btn" ${i===0?'disabled style="opacity:.3"':''} onclick="moveSlide(${i},-1)"><i class="fa-solid fa-chevron-up"></i></button>
          <button class="icon-btn" ${i===total-1?'disabled style="opacity:.3"':''} onclick="moveSlide(${i},1)"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        <div><button class="icon-btn edit" onclick="openSlideModal(${s.id})"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete" onclick="deleteSlide(${s.id})"><i class="fa-solid fa-trash"></i></button></div>
      </div></div>`;}).join('');
}
async function saveHeroText(){
  await api('hero',{body:{headline:$('#h-hl').value,subhead:$('#h-sub').value,visionquote:$('#h-vq').value,body:$('#h-bd').value,cta1:$('#h-c1').value,cta2:$('#h-c2').value},method:'POST'});
  toast('Hero text saved.');HERO=await api('hero');
}
function openSlideModal(id){
  const s=id?HERO.slides.find(x=>x.id==id):{type:'image',url:'',alt:'',caption:''};
  openModal(`<div class="modal-header"><h3>${id?'Edit':'Add'} Slide</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="full"><label class="form-label">Image / Video</label>${mediaUploader(s,'sl','For hero carousel — landscape recommended')}</div>
      <div><label class="form-label">Alt text</label><input class="form-input" id="sl-alt" value="${esc(s.alt||'')}"></div>
      <div><label class="form-label">Caption (optional)</label><input class="form-input" id="sl-cap" value="${esc(s.caption||'')}"></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveSlide(${id||0})"><i class="fa-solid fa-save"></i>${id?'Save':'Add'}</button></div>`,true);
}
async function saveSlide(id){
  let m=getMediaVal('sl');
  if(m&&m._file){const up=await api('media',{form:{file:m._file,subdir:'images',category:'Hero',title:'Hero slide'}});m={type:up.media.type,url:up.media.url};}
  if(!m){toast('Add an image or video','error');return;}
  const alt=$('#sl-alt').value,cap=$('#sl-cap').value;
  if(id)await api('hero/slides/'+id,{body:{type:m.type,url:m.url,alt,caption},method:'PUT'});
  else await api('hero/slides',{body:{type:m.type,url:m.url,alt,caption},method:'POST'});
  toast(id?'Slide updated':'Slide added');closeModal();HERO=await api('hero');renderSlides();
}
async function moveSlide(i,dir){const s=HERO.slides[i];await api('hero/'+s.id+'/move',{body:{dir},method:'PUT'});HERO=await api('hero');renderSlides();}
async function deleteSlide(id){if(!confirm('Delete this slide?'))return;await api('hero/'+id,{method:'DELETE'});toast('Slide deleted');HERO=await api('hero');renderSlides();}

/* ---------- NEC ---------- */
let NEC=[];
async function renderNEC(){
  if(!can('nec'))return;
  NEC=await api('nec');
  $('#pageContent').innerHTML=`
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-user-tie"></i>NEC Leadership Ranks</h3>
      <p style="font-size:12px;color:var(--gray-500);margin:0">Manage ranks/positions, names, photos, colors and duty descriptions.</p>
      <button class="btn btn-sm btn-gold" onclick="openNecModal()"><i class="fa-solid fa-plus"></i>Add Position</button></div>
      <div class="card-body p-sm"><div class="table-wrap"><table>
        <thead><tr><th>Photo</th><th>Rank / Role</th><th>Name</th><th>Duty</th><th>Theme</th><th style="width:100px">Actions</th></tr></thead>
        <tbody>${NEC.map(n=>`<tr>
          <td><div style="width:50px;height:50px;border-radius:10px;background-size:cover;background-position:center;border:2px solid var(--gray-100);background-image:url('${n.photo?resolveAsset(n.photo):necDefaultPhoto(n.role_title)}');box-shadow:0 2px 8px rgba(0,0,0,0.08)"></div></td>
          <td style="font-weight:700;color:var(--gray-900)">${esc(n.role_title)}</td>
          <td style="color:${n.name?'var(--gray-800)':'var(--gray-400)'};font-style:${n.name?'normal':'italic'}">${esc(n.name)||'Position vacant'}</td>
          <td style="font-size:12px;color:var(--gray-600);max-width:320px">${esc((n.duty||'').substring(0,100))}${(n.duty||'').length>100?'...':''}</td>
          <td><span class="tag" style="background:linear-gradient(135deg,var(--${n.gradient?.includes('gold')?'gold-400':'azure-500'}),var(--${n.gradient?.includes('gold')?'gold-600':'azure-700'}));color:white">${esc(n.icon||'')}</span></td>
          <td class="row-actions"><button class="icon-btn edit" onclick="openNecModal(${n.id})"><i class="fa-solid fa-pen"></i></button>${NEC.length>1?`<button class="icon-btn delete" onclick="deleteNec(${n.id})"><i class="fa-solid fa-trash"></i></button>`:''}</td>
        </tr>`).join('')}</tbody></table></div></div>
    </div>`;
}
function openNecModal(id){
  const n=id?NEC.find(x=>x.id==id):{role_title:'',name:'',photo:'',gradient:'from-azure-500 to-azure-700',icon:'fa-star',duty:'',published:1};
  const gradients=[
    ['from-gold-400 to-gold-600','Gold (President/Patron)'],
    ['from-azure-500 to-azure-700','Azure (Officers)'],
    ['from-emerald-500 to-emerald-700','Emerald (Finance)'],
    ['from-violet-500 to-violet-700','Violet (PRO)'],
    ['from-rose-500 to-rose-700','Rose (Auditor)']
  ];
  openModal(`<div class="modal-header"><h3>${id?'Edit':'Add'} NEC Position</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div><label class="form-label">Rank / Role Title <span class="req">*</span></label><input class="form-input" id="n-role" value="${esc(n.role_title)}" placeholder="e.g. President"></div>
      <div><label class="form-label">Officeholder Name</label><input class="form-input" id="n-name" value="${esc(n.name)}" placeholder="Leave blank if vacant"></div>
      <div><label class="form-label">Color Theme</label><select class="form-input" id="n-grad">${gradients.map(g=>`<option value="${g[0]}" ${n.gradient===g[0]?'selected':''}>${g[1]}</option>`).join('')}</select></div>
      <div><label class="form-label">Icon (Font Awesome)</label><input class="form-input" id="n-icon" value="${esc(n.icon)}" placeholder="fa-crown"></div>
      <div class="full"><label class="form-label">Photo</label>${mediaUploader(n.photo?{type:'image',url:n.photo}:null,'n-photo','Portrait photo (square works best)')}</div>
      <div class="full"><label class="form-label">Duties / Description</label><textarea class="form-input" id="n-duty" rows="4" placeholder="Describe the role...">${esc(n.duty||'')}</textarea></div>
      <div class="full"><label class="form-check"><input type="checkbox" id="n-pub" ${n.published?'checked':''}><label>Published on website</label></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveNec(${id||0})"><i class="fa-solid fa-save"></i>${id?'Save':'Add Position'}</button></div>`,true);
}
async function saveNec(id){
  let ph=getMediaVal('n-photo');
  if(ph&&ph._file){const up=await api('media',{form:{file:ph._file,subdir:'images',category:'NEC',title:'NEC photo'}});ph={url:up.media.url};}
  const body={role_title:$('#n-role').value,name:$('#n-name').value,gradient:$('#n-grad').value,icon:$('#n-icon').value,duty:$('#n-duty').value,published:$('#n-pub').checked?1:0};
  if(ph)body.photo=ph.url;
  await api('nec'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'Position updated':'Position added');closeModal();renderNEC();
}
async function deleteNec(id){if(!confirm('Delete this position?'))return;await api('nec/'+id,{method:'DELETE'});toast('Deleted');renderNEC();}

/* ---------- PROGRAMS ---------- */
let PROGRAMS=[];
async function renderPrograms(){
  if(!can('programs'))return;
  PROGRAMS=await api('programs');
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-diagram-project"></i>Programs & Initiatives</h3><button class="btn btn-sm btn-gold" onclick="openProgramModal()"><i class="fa-solid fa-plus"></i>New Program</button></div>
    <div class="card-body p-sm"><div class="table-wrap"><table><thead><tr><th>Cover</th><th>Program</th><th>Pillar</th><th>Short Description</th><th>Status</th><th style="width:110px">Actions</th></tr></thead>
      <tbody>${PROGRAMS.map(p=>`<tr>
        <td><div style="width:60px;height:44px;border-radius:8px;background-size:cover;background-position:center;border:1px solid var(--gray-200);background-image:url('${p.cover?resolveAsset(p.cover):progDefaultCover(p.title)}')"></div></td>
        <td style="font-weight:700;color:var(--gray-900)"><i class="fa-solid ${p.icon}" style="color:${p.tag_color};margin-right:8px"></i>${esc(p.title)}</td>
        <td><span class="tag" style="background:${p.tag_color}20;color:${p.tag_color}">${esc(p.tag)}</span></td>
        <td style="max-width:320px;font-size:12px;color:var(--gray-600)">${esc(p.short_desc||'')}</td>
        <td>${p.published?'<span class="tag green">Published</span>':'<span class="tag gray">Draft</span>'}</td>
        <td class="row-actions"><button class="icon-btn edit" onclick="openProgramModal(${p.id})"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete" onclick="deleteProgram(${p.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`).join('')}</tbody></table></div></div></div>`;
}
function openProgramModal(id){
  const p=id?PROGRAMS.find(x=>x.id==id):{title:'',slug:'',tag:'',tag_color:'#1a37b8',icon:'fa-star',cover:'',short_desc:'',full_desc:'',published:0};
  openModal(`<div class="modal-header"><h3>${id?'Edit':'New'} Program</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="full"><label class="form-label">Title <span class="req">*</span></label><input class="form-input" id="p-title" value="${esc(p.title)}"></div>
      <div><label class="form-label">Pillar/Tag</label><input class="form-input" id="p-tag" value="${esc(p.tag)}"></div>
      <div><label class="form-label">Tag color</label><input type="color" class="form-input" id="p-color" value="${p.tag_color}" style="height:44px;padding:4px"></div>
      <div><label class="form-label">Icon</label><input class="form-input" id="p-icon" value="${esc(p.icon)}"></div>
      <div><label class="form-label">Slug (URL)</label><input class="form-input" id="p-slug" value="${esc(p.slug)}"></div>
      <div class="full"><label class="form-label">Short description</label><input class="form-input" id="p-short" value="${esc(p.short_desc||'')}"></div>
      <div class="full"><label class="form-label">Cover Image</label>${mediaUploader(p.cover?{type:'image',url:p.cover}:null,'p-cover','Landscape 16:9')}</div>
      <div class="full"><label class="form-label">Full description (HTML: h4, p, ul)</label><textarea class="form-input" id="p-full" rows="8">${esc(p.full_desc||'')}</textarea></div>
      <div class="full"><label class="form-check"><input type="checkbox" id="p-pub" ${p.published?'checked':''}><label>Published</label></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveProgram(${id||0})"><i class="fa-solid fa-save"></i>${id?'Save':'Create'}</button></div>`,true);
}
async function saveProgram(id){
  let cov=getMediaVal('p-cover');
  if(cov&&cov._file){const up=await api('media',{form:{file:cov._file,subdir:'images',category:'Programs'}});cov={url:up.media.url};}
  const title=$('#p-title').value.trim();if(!title){toast('Title required','error');return;}
  let slug=$('#p-slug').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!slug)slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const body={title,slug,tag:$('#p-tag').value,tag_color:$('#p-color').value,icon:$('#p-icon').value||'fa-star',short:$('#p-short').value,full:$('#p-full').value,published:$('#p-pub').checked?1:0};
  if(cov)body.cover=cov.url;
  await api('programs'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'Program updated':'Program created');closeModal();renderPrograms();
}
async function deleteProgram(id){if(!confirm('Delete?'))return;await api('programs/'+id,{method:'DELETE'});toast('Deleted');renderPrograms();}

/* ---------- EVENTS ---------- */
let EVENTS=[];
async function renderEvents(){
  if(!can('events'))return;
  EVENTS=await api('events');
  const up=EVENTS.filter(e=>e.status==='upcoming').sort((a,b)=>new Date(a.event_date)-new Date(b.event_date));
  const past=EVENTS.filter(e=>e.status!=='upcoming').sort((a,b)=>new Date(b.event_date)-new Date(a.event_date));
  $('#pageContent').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:16px;font-weight:700;color:var(--gray-900)">Upcoming Events</h2><p style="font-size:12px;color:var(--gray-500)">Add photos and videos to each event.</p></div>
      <button class="btn btn-sm btn-gold" onclick="openEventModal()"><i class="fa-solid fa-plus"></i>Create Event</button>
    </div>
    <div class="event-grid" style="margin-bottom:32px">${up.length?up.map(evCard).join(''):'<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-calendar"></i><p>No upcoming events.</p></div>'}</div>
    <h2 style="font-size:16px;font-weight:700;color:var(--gray-900);margin-bottom:18px">Past Events</h2>
    <div class="event-grid">${past.length?past.map(evCard).join(''):'<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-folder-open"></i><p>No past events.</p></div>'}</div>`;
}
function evCard(e){
  const d=dateFmtShort(e.event_date);
  let cover=null;
  if(e.featured_image)cover={type:'image',url:e.featured_image};
  else if(e.media&&e.media[0])cover=e.media[0];
  const hasVideo=cover&&cover.type==='video';
  return`<div class="event-card ${hasVideo?'has-video':''}">
    <div class="event-card-media">
      ${cover?(cover.type==='video'?`<video src="${resolveAsset(cover.url)}" muted style="width:100%;height:100%;object-fit:cover"></video>`:`<img src="${resolveAsset(cover.url)}" alt="${esc(e.title)}" onerror="this.src='${DEFAULT_EVENT_COVER}'">`):`<img src="${DEFAULT_EVENT_COVER}" alt="" style="width:100%;height:100%;object-fit:cover;opacity:.5">`}
      <div class="event-card-date"><div class="day">${d.day}</div><div class="month">${d.month}</div></div>
      ${hasVideo?'<div class="video-play"><i class="fa-solid fa-play" style="margin-left:3px"></i></div>':''}
      <span class="tag" style="position:absolute;top:12px;right:12px;background:${e.status==='upcoming'?'rgba(16,185,129,.95)':'rgba(148,163,184,.95)'};color:white">${e.status}</span>
    </div>
    <div class="event-card-body"><h4>${esc(e.title)}</h4><p>${esc(e.description||'')}</p>
      <div class="event-card-meta"><span><i class="fa-regular fa-clock"></i>${e.event_time||'TBA'}</span><span><i class="fa-solid fa-location-dot"></i>${esc(e.location||'TBA')}</span>${e.media?`<span><i class="fa-solid fa-photo-film"></i>${e.media.length}</span>`:''}</div></div>
    <div class="event-card-actions"><button class="btn btn-ghost btn-sm" onclick="openEventModal(${e.id})"><i class="fa-solid fa-pen"></i>Edit</button><button class="btn btn-ghost btn-sm" style="color:var(--rose)" onclick="deleteEvent(${e.id})"><i class="fa-solid fa-trash"></i></button></div>
  </div>`;
}
function openEventModal(id){
  const e=id?EVENTS.find(x=>x.id==id):{title:'',event_date:new Date().toISOString().split('T')[0],event_time:'',location:'',status:'upcoming',description:'',media:[]};
  openModal(`<div class="modal-header"><h3>${id?'Edit':'New'} Event</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="full"><label class="form-label">Title <span class="req">*</span></label><input class="form-input" id="e-title" value="${esc(e.title)}"></div>
      <div><label class="form-label">Date</label><input type="date" class="form-input" id="e-date" value="${e.event_date||''}"></div>
      <div><label class="form-label">Time</label><input type="time" class="form-input" id="e-time" value="${e.event_time||''}"></div>
      <div class="full"><label class="form-label">Location</label><input class="form-input" id="e-loc" value="${esc(e.location||'')}"></div>
      <div><label class="form-label">Status</label><select class="form-input" id="e-status"><option value="upcoming"${e.status==='upcoming'?' selected':''}>Upcoming</option><option value="completed"${e.status==='completed'?' selected':''}>Completed</option><option value="draft"${e.status==='draft'?' selected':''}>Draft</option></select></div>
      <div class="full"><label class="form-label">Description</label><textarea class="form-input" id="e-desc" rows="3">${esc(e.description||'')}</textarea></div>
      <div class="full"><label class="form-label">Photos & Videos</label>
        <p class="form-help">Upload multiple photos and/or videos. First item becomes the cover.</p>
        <input type="hidden" id="e-mm" value="[]">
        <div class="upload-zone" onclick="document.getElementById('e-file').click()"><i class="fa-solid fa-cloud-arrow-up"></i><p><strong>Click to add files</strong></p><small>Images or MP4/WebM videos</small><input type="file" id="e-file" accept="image/*,video/*" multiple style="display:none"></div>
        <div class="media-preview" id="e-mp"></div>
        <div style="margin-top:8px;display:flex;gap:8px"><input class="form-input" id="e-url" placeholder="...or paste URL, then Add" style="flex:1"><button type="button" class="btn btn-sm btn-outline" onclick="evAddUrl()"><i class="fa-solid fa-plus"></i>Add</button></div>
      </div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveEvent(${id||0})"><i class="fa-solid fa-save"></i>${id?'Save':'Create'}</button></div>`,true);
  mmInit('ev','e-mp','e-mm',(e.media||[]).map(m=>({type:m.type,url:m.url})));
  $('#e-file').addEventListener('change',async ev=>{await mmAddFiles('ev','e-mp','e-mm',[...ev.target.files],'events');ev.target.value='';});
}
function evAddUrl(){
  const url=$('#e-url').value.trim();if(!url)return;
  const isVideo=/\.(mp4|webm|mov)($|\?)/i.test(url);
  mmAdd('ev','e-mp','e-mm',{type:isVideo?'video':'image',url:url});
  $('#e-url').value='';
}
async function saveEvent(id){
  const media=JSON.parse($('#e-mm').value||'[]');
  const body={title:$('#e-title').value.trim(),event_date:$('#e-date').value,date:$('#e-date').value,event_time:$('#e-time').value,time:$('#e-time').value,location:$('#e-loc').value,status:$('#e-status').value,description:$('#e-desc').value,excerpt:($('#e-desc').value||'').substring(0,160),media};
  if(!body.title){toast('Title required','error');return;}
  // Files have already been uploaded via mmAddFiles → body.media already holds {type,url} from server
  // Strip any temporary _file fields / data: URLs that may remain
  const clean=[];
  for(const m of body.media){
    if(!m||!m.url)continue;
    if(m.url.startsWith('data:')){// pasted or dragged image not yet uploaded — skip to avoid crash
      toast('Some media not uploaded; please re-add.','error');return;
    }
    if(m._file)continue;
    clean.push({type:m.type,url:m.url});
  }
  body.media=clean;
  if(!body.date)body.date=body.event_date;
  await api('events'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'Event updated':'Event created');closeModal();renderEvents();
}
async function deleteEvent(id){if(!confirm('Delete event?'))return;await api('events/'+id,{method:'DELETE'});toast('Deleted');renderEvents();}

/* ---------- MEDIA LIBRARY ---------- */
let MEDIA=[];let mCat='All';
async function renderMedia(){
  if(!can('photos'))return;
  MEDIA=await api('media');
  const cats=['All',...new Set(MEDIA.map(m=>m.category))];
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-images"></i>Media Library</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="form-input" style="width:auto;padding:8px 12px;font-size:13px" id="mcat" onchange="mCat=this.value;renderMediaGrid()">${cats.map(c=>`<option ${c===mCat?'selected':''}>${c}</option>`).join('')}</select>
    <button class="btn btn-sm btn-gold" onclick="openMediaModal()"><i class="fa-solid fa-cloud-arrow-up"></i>Upload</button></div></div>
    <div class="card-body"><div class="photo-grid" id="mgrid"></div></div></div>`;
  renderMediaGrid();
}
function renderMediaGrid(){
  const list=mCat==='All'?MEDIA:MEDIA.filter(m=>m.category===mCat);
  $('#mgrid').innerHTML=list.length?list.map(m=>`<div class="photo-card"><div class="thumb">
    ${m.type==='video'?`<video src="${resolveAsset(m.url)}" muted style="width:100%;height:100%;object-fit:cover"></video><span class="media-badge"><i class="fa-solid fa-video"></i> Video</span>`:`<img src="${resolveAsset(m.url)}" onerror="this.src='${DEFAULT_PROG_COVER}';this.style.objectFit='contain';this.style.padding='10px'"><span class="media-badge"><i class="fa-solid fa-image"></i> Photo</span>`}
    <div class="photo-card-actions"><button onclick="deleteMedia(${m.id})"><i class="fa-solid fa-trash"></i></button></div>
    </div><div class="photo-card-meta"><h5>${esc(m.title||'Untitled')}</h5><p>${esc(m.category)}</p></div></div>`).join(''):'<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-images"></i><p>No media here.</p></div>';
}
function openMediaModal(){
  openModal(`<div class="modal-header"><h3>Upload Media</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="full"><label class="form-label">Title</label><input class="form-input" id="m-title" placeholder="Descriptive title"></div>
      <div><label class="form-label">Category</label><input class="form-input" id="m-cat" placeholder="Hero, Events, etc."></div>
      <div class="full"><label class="form-label">File</label><input type="file" id="m-file" class="form-input" accept="image/*,video/*" style="padding:8px">
      <p class="form-help">or paste URL:</p><input class="form-input" id="m-url" placeholder="https://..."></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="uploadMedia()"><i class="fa-solid fa-cloud-arrow-up"></i>Upload</button></div>`);
}
async function uploadMedia(){
  const title=$('#m-title').value||'Uploaded';const cat=$('#m-cat').value||'General';
  const f=$('#m-file').files[0];const url=$('#m-url').value.trim();
  if(f){
    const subdir=f.type.startsWith('video/')?'videos':'images';
    const m=await _doUpload(f,subdir);
    // Also register in media_library
    await api('media',{body:{title,category:cat,type:m.type,url:m.url},method:'POST'});
  }else if(url){
    const type=/\.(mp4|webm|mov)($|\?)/i.test(url)?'video':'image';
    await api('media',{body:{title,category:cat,type,url},method:'POST'});
  }else{toast('Pick a file or paste URL','error');return;}
  toast('Uploaded');closeModal();renderMedia();
}
async function deleteMedia(id){if(!confirm('Delete?'))return;await api('media/'+id,{method:'DELETE'});toast('Deleted');renderMedia();}

/* ---------- SITE INFO ---------- */
async function renderSite(){
  if(!can('site'))return;
  const s=DATA.site||await api('site');
  const fields=[['orgName','Organization Name'],['shortName','Abbreviation'],['motto','Motto'],['tagline','Tagline'],['vision','Vision'],['mission','Mission'],['address','Address'],['phone','Phone'],['email','Email'],['hours','Working Hours'],['facebook','Facebook URL'],['twitter','Twitter/X'],['instagram','Instagram'],['whatsapp','WhatsApp']];
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-building"></i>Organization Information</h3></div>
    <div class="card-body"><div class="form-grid">${fields.map(f=>{const isLong=['vision','mission','address'].includes(f[0]);const type=f[0]==='email'?'email':'text';
    return`<div class="${isLong?'full':''}"><label class="form-label">${f[1]}</label>${isLong?`<textarea class="form-input" id="s-${f[0]}" rows="${f[0]==='vision'||f[0]==='mission'?2:2}">${esc(s[f[0]]||'')}</textarea>`:`<input type="${type}" class="form-input" id="s-${f[0]}" value="${esc(s[f[0]]||'')}">`}</div>`;}).join('')}</div>
    <div style="margin-top:20px;display:flex;justify-content:flex-end"><button class="btn btn-primary" style="width:auto" onclick="saveSite()"><i class="fa-solid fa-save"></i>Save</button></div></div></div>`;
}
async function saveSite(){
  const body={};['orgName','shortName','motto','tagline','vision','mission','address','phone','email','hours','facebook','twitter','instagram','whatsapp'].forEach(k=>body[k]=$('#s-'+k).value);
  await api('site',{body,method:'POST'});toast('Saved');DATA.site=await api('site');
}

/* ---------- DONATIONS ---------- */
async function renderDonations(){
  if(!can('donations'))return;
  const d=await api('donations');
  const tot=d.filter(x=>x.status==='verified').reduce((a,b)=>a+Number(b.amount),0);
  const pend=d.filter(x=>x.status==='pending').length;
  $('#pageContent').innerHTML=`
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card green"><div class="stat-top"><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div><div class="stat-label">Verified Total</div><div class="stat-value">${money(tot)}</div></div>
      <div class="stat-card red"><div class="stat-top"><div class="stat-icon red"><i class="fa-solid fa-clock"></i></div></div><div class="stat-label">Pending</div><div class="stat-value">${pend}</div></div>
      <div class="stat-card gold"><div class="stat-top"><div class="stat-icon gold"><i class="fa-solid fa-gift"></i></div></div><div class="stat-label">Total Donations</div><div class="stat-value">${d.length}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-hand-holding-dollar"></i>All Donations</h3></div>
    <div class="card-body p-sm"><div class="table-wrap"><table><thead><tr><th>Donor</th><th>Amount</th><th>Campaign</th><th>Method</th><th>Date</th><th>Status</th><th style="width:120px">Actions</th></tr></thead>
      <tbody>${d.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(x=>`<tr>
        <td><div class="donor-cell"><div class="donor-avatar">${x.anonymous?'A':initials(x.donor)}</div><div><div style="font-weight:600;font-size:13px">${x.anonymous?'Anonymous':esc(x.donor)}</div><div style="font-size:11px;color:var(--gray-400)">${x.anonymous?'':esc(x.email||'')}</div></div></div></td>
        <td class="donation-amount">${money(x.amount)}</td><td><span class="tag blue">${esc(x.campaign)}</span></td><td style="font-size:12px">${esc(x.method)}</td><td style="font-size:12px">${dateFmt(x.created_at)}</td>
        <td>${x.status==='verified'?'<span class="tag green"><i class="fa-solid fa-check"></i>Verified</span>':x.status==='pending'?'<span class="tag gold"><i class="fa-solid fa-clock"></i>Pending</span>':'<span class="tag red">Rejected</span>'}</td>
        <td class="row-actions">${x.status==='pending'?`<button class="icon-btn edit" onclick="verifyDon(${x.id})" title="Verify"><i class="fa-solid fa-check"></i></button>`:''}<button class="icon-btn delete" onclick="delDon(${x.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`).join('')}</tbody></table></div></div></div>`;
}
async function verifyDon(id){await api('donations/'+id+'/verify',{method:'POST'});toast('Verified');renderDonations();}
async function delDon(id){if(!confirm('Delete?'))return;await api('donations/'+id,{method:'DELETE'});toast('Deleted');renderDonations();}

/* ---------- MEMBERS ---------- */
async function renderMembers(){
  if(!can('members'))return;
  const m=await api('members');
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-users"></i>Members</h3><button class="btn btn-sm btn-gold" onclick="openMemberModal()"><i class="fa-solid fa-user-plus"></i>Add</button></div>
    <div class="card-body p-sm"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>State</th><th>Tier</th><th>Joined</th><th>Status</th><th style="width:110px">Actions</th></tr></thead>
      <tbody>${m.map(x=>`<tr><td style="font-weight:600"><div class="donor-cell"><div class="donor-avatar">${initials(x.name)}</div>${esc(x.name)}</div></td><td style="font-size:12px">${esc(x.email||'')}</td><td style="font-size:12px">${esc(x.phone||'')}</td><td>${esc(x.state||'')}</td><td><span class="tag blue">${esc(x.tier)}</span></td><td style="font-size:12px">${dateFmt(x.joined)}</td><td>${x.status==='active'?'<span class="tag green">Active</span>':'<span class="tag gold">Pending</span>'}</td><td class="row-actions"><button class="icon-btn edit" onclick="openMemberModal(${x.id})"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete" onclick="delMember(${x.id})"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div></div></div>`;
}
function openMemberModal(id){
  const m=id?(DATA.members.find(x=>x.id==id)||{name:'',email:'',phone:'',state:'',tier:'Full Member',status:'active'}):{name:'',email:'',phone:'',state:'',tier:'Full Member',status:'active'};
  openModal(`<div class="modal-header"><h3>${id?'Edit':'Add'} Member</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="full"><label class="form-label">Name <span class="req">*</span></label><input class="form-input" id="mb-name" value="${esc(m.name)}"></div>
      <div><label class="form-label">Email</label><input class="form-input" id="mb-email" value="${esc(m.email||'')}"></div>
      <div><label class="form-label">Phone</label><input class="form-input" id="mb-phone" value="${esc(m.phone||'')}"></div>
      <div><label class="form-label">State</label><input class="form-input" id="mb-state" value="${esc(m.state||'')}"></div>
      <div><label class="form-label">Tier</label><select class="form-input" id="mb-tier"><option ${m.tier==='Full Member'?'selected':''}>Full Member</option><option ${m.tier==='Applicant'?'selected':''}>Applicant</option><option ${m.tier==='Volunteer'?'selected':''}>Volunteer</option><option ${m.tier==='Patron/Matron'?'selected':''}>Patron/Matron</option></select></div>
      <div><label class="form-label">Status</label><select class="form-input" id="mb-status"><option value="active"${m.status==='active'?' selected':''}>Active</option><option value="pending"${m.status==='pending'?' selected':''}>Pending</option><option value="inactive"${m.status==='inactive'?' selected':''}>Inactive</option></select></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveMember(${id||0})">${id?'Save':'Add'}</button></div>`);
}
async function saveMember(id){const body={name:$('#mb-name').value,email:$('#mb-email').value,phone:$('#mb-phone').value,state:$('#mb-state').value,tier:$('#mb-tier').value,status:$('#mb-status').value};if(!body.name){toast('Name required','error');return}await api('members'+(id?'/'+id:''),{body,method:'POST'});toast('Saved');closeModal();renderMembers();}
async function delMember(id){if(!confirm('Remove?'))return;await api('members/'+id,{method:'DELETE'});toast('Removed');renderMembers();}

/* ---------- MESSAGES ---------- */
async function renderMessages(){
  if(!can('messages'))return;
  const msgs=await api('messages');msgs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-envelope"></i>Inbox</h3><span class="tag gold">${msgs.filter(m=>!m.is_read).length} unread</span></div>
    <div class="card-body p-sm">${msgs.length?msgs.map(m=>`<div class="activity-item" style="padding:18px;border-bottom:1px solid var(--gray-100);${!m.is_read?'background:var(--azure-50);margin:0 -24px;padding-left:24px;padding-right:24px':''}">
      <div class="activity-icon" style="background:${m.is_read?'var(--gray-100)':'var(--azure-700)'};color:${m.is_read?'var(--gray-500)':'white'}"><i class="fa-solid fa-envelope${m.is_read?'-open':''}"></i></div>
      <div class="activity-body"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div><p style="font-weight:700;font-size:14px;color:var(--gray-900)">${esc(m.name)} ${!m.is_read?'<span class="tag blue" style="margin-left:8px">New</span>':''} <span style="font-size:11px;color:var(--gray-400);font-weight:400">${esc(m.source||'contact')}</span></p><p style="font-size:12px;color:var(--gray-500)">${esc(m.email)} · ${dateFmt(m.created_at)}</p></div>
        <div class="row-actions">${!m.is_read?`<button class="icon-btn edit" onclick="markRead(${m.id})"><i class="fa-solid fa-check"></i></button>`:''}<button class="icon-btn delete" onclick="delMsg(${m.id})"><i class="fa-solid fa-trash"></i></button></div></div>
        <p style="font-weight:600;font-size:14px;margin-top:8px">${esc(m.subject)}</p><p style="font-size:13px;color:var(--gray-600);margin-top:6px;line-height:1.6">${esc(m.message)}</p></div></div>`).join(''):'<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>No messages.</p></div>'}</div></div>`;
}
async function markRead(id){await api('messages/'+id+'/read',{method:'POST'});toast('Marked read');renderMessages();}
async function delMsg(id){if(!confirm('Delete?'))return;await api('messages/'+id,{method:'DELETE'});toast('Deleted');renderMessages();}

/* ---------- USERS ---------- */
let USERS=[];
async function renderUsers(){
  if(!can('users'))return;
  USERS=await api('users');
  $('#pageContent').innerHTML=`<div class="card"><div class="card-header"><h3><i class="fa-solid fa-user-shield"></i>Users & Roles</h3><button class="btn btn-sm btn-gold" onclick="openUserModal()"><i class="fa-solid fa-user-plus"></i>Add User</button></div>
    <div class="card-body p-sm"><div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Permissions</th><th>Status</th><th style="width:110px">Actions</th></tr></thead>
      <tbody>${USERS.map(u=>`<tr><td style="font-weight:600"><div class="donor-cell"><div class="donor-avatar">${initials(u.name)}</div><div><div>${esc(u.name)}</div><div style="font-size:11px;color:var(--gray-400)">@${esc(u.username)}</div></div></div></td>
      <td style="font-size:12px">${esc(u.email||'')}</td>
      <td>${u.role==='admin'?'<span class="tag gold"><i class="fa-solid fa-crown"></i>Admin</span>':'<span class="tag blue"><i class="fa-solid fa-user"></i>Staff</span>'}</td>
      <td style="font-size:11px">${u.role==='admin'?'<span class="tag gray">All</span>':Object.keys(u.perms||{}).filter(k=>u.perms[k]).map(k=>`<span class="tag gray" style="margin:1px">${PERM_LABEL[k]||k}</span>`).join(' ')}</td>
      <td>${u.status==='active'?'<span class="tag green">Active</span>':'<span class="tag red">Disabled</span>'}</td>
      <td class="row-actions"><button class="icon-btn edit" onclick="openUserModal(${u.id})"><i class="fa-solid fa-pen"></i></button>${u.id!==USER.id?`<button class="icon-btn delete" onclick="delUser(${u.id})"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`).join('')}</tbody></table></div></div></div>`;
}
function openUserModal(id){
  const u=id?USERS.find(x=>x.id==id):{name:'',email:'',username:'',role:'staff',perms:{},status:'active'};
  const keys=['dashboard','hero','nec','site','programs','events','donations','photos','members','messages','reports','settings'];
  openModal(`<div class="modal-header"><h3>${id?'Edit':'Add'} User</h3><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div><label class="form-label">Name <span class="req">*</span></label><input class="form-input" id="u-name" value="${esc(u.name)}"></div>
      <div><label class="form-label">Username <span class="req">*</span></label><input class="form-input" id="u-uname" value="${esc(u.username)}"></div>
      <div class="full"><label class="form-label">Email</label><input type="email" class="form-input" id="u-email" value="${esc(u.email||'')}"></div>
      <div><label class="form-label">${id?'New Password (blank=keep)':'Password <span class=req>*</span>'}</label><input type="password" class="form-input" id="u-pass"></div>
      <div><label class="form-label">Role</label><select class="form-input" id="u-role" onchange="document.getElementById('perm-block').style.display=this.value==='admin'?'none':'block'"><option value="staff"${u.role==='staff'?' selected':''}>Staff</option><option value="admin"${u.role==='admin'?' selected':''}>Administrator</option></select></div>
      <div><label class="form-label">Status</label><select class="form-input" id="u-status"><option value="active"${u.status==='active'?' selected':''}>Active</option><option value="disabled"${u.status==='disabled'?' selected':''}>Disabled</option></select></div>
      <div class="full" id="perm-block" style="${u.role==='admin'?'display:none':''}"><label class="form-label">Permissions</label>
        <div class="perm-grid">${keys.filter(k=>k!=='users'||USER.role==='admin').map(k=>`<label class="form-check"><input type="checkbox" class="perm-cb" data-p="${k}" ${u.perms&&u.perms[k]?'checked':''}><label><i class="fa-solid ${PERM_ICON[k]}" style="color:var(--gray-400);margin-right:6px;font-size:11px"></i>${PERM_LABEL[k]}</label></label>`).join('')}</div></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="width:auto" onclick="saveUser(${id||0})"><i class="fa-solid fa-save"></i>${id?'Save':'Create'}</button></div>`,true);
}
async function saveUser(id){
  const perms={};document.querySelectorAll('.perm-cb').forEach(cb=>{if(cb.checked)perms[cb.dataset.p]=1;});
  const body={name:$('#u-name').value,username:$('#u-uname').value.toLowerCase().replace(/\s+/g,'_'),email:$('#u-email').value,role:$('#u-role').value,status:$('#u-status').value,perms};
  const pw=$('#u-pass').value;if(pw)body.password=pw;
  if(!body.name||!body.username){toast('Name and username required','error');return;}
  if(!id&&!pw){toast('Password required','error');return;}
  await api('users'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'User updated':'User created');closeModal();
  if(id==USER.id){USER=await api('auth/me');localStorage.setItem('zglf_user',JSON.stringify(USER));}
  renderUsers();
}
async function delUser(id){if(id===USER.id){toast("Cannot delete yourself",'error');return;}if(!confirm('Delete user?'))return;await api('users/'+id,{method:'DELETE'});toast('Deleted');renderUsers();}

/* ---------- REPORTS ---------- */
async function renderReports(){
  if(!can('reports'))return;
  const s=DATA.stats||await api('stats');
  $('#pageContent').innerHTML=`
    <div class="stats-grid">
      <div class="stat-card green"><div class="stat-top"><div class="stat-icon green"><i class="fa-solid fa-sack-dollar"></i></div></div><div class="stat-label">Total Raised</div><div class="stat-value">${money(s.donations_total)}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon blue"><i class="fa-solid fa-hand-holding-dollar"></i></div></div><div class="stat-label">Donors</div><div class="stat-value">${s.donations_count}</div></div>
      <div class="stat-card gold"><div class="stat-top"><div class="stat-icon gold"><i class="fa-solid fa-users"></i></div></div><div class="stat-label">Active Members</div><div class="stat-value">${s.members_active}</div></div>
      <div class="stat-card purple"><div class="stat-top"><div class="stat-icon purple"><i class="fa-solid fa-calendar"></i></div></div><div class="stat-label">Events Held</div><div class="stat-value">${s.events_completed}</div></div>
    </div>
    <div class="charts-grid">
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-chart-pie"></i>By Campaign</h3></div><div class="card-body"><div class="chart-box"><canvas id="r1"></canvas></div></div></div>
      <div class="card"><div class="card-header"><h3><i class="fa-solid fa-chart-column"></i>By Method</h3></div><div class="card-body"><div class="chart-box"><canvas id="r2"></canvas></div></div></div>
    </div>
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-file-export"></i>Export Data</h3></div>
      <div class="card-body"><p style="font-size:13px;color:var(--gray-600);margin-bottom:16px">Download CSV reports for board meetings, accounting, or records.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="exportCSV('donations')"><i class="fa-solid fa-file-csv"></i>Donations</button>
        <button class="btn btn-outline" onclick="exportCSV('members')"><i class="fa-solid fa-file-csv"></i>Members</button>
        <button class="btn btn-outline" onclick="exportCSV('events')"><i class="fa-solid fa-file-csv"></i>Events</button>
      </div></div></div>`;
  setTimeout(()=>{
    const pc=s.by_campaign||[];new Chart($('#r1'),{type:'doughnut',data:{labels:pc.map(x=>x.campaign),datasets:[{data:pc.map(x=>Number(x.total)),backgroundColor:['#1a37b8','#f5c842','#10b981','#ef4444','#8b5cf6','#ef6c00'],borderWidth:0}]},options:{cutout:'65%',responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:12,usePointStyle:true}}}}});
    const pm=s.by_method||[];new Chart($('#r2'),{type:'bar',data:{labels:pm.map(x=>x.method),datasets:[{label:'Amount',data:pm.map(x=>Number(x.total)),backgroundColor:'rgba(26,55,184,0.8)',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'}},x:{grid:{display:false}}}}});
  },50);
}
function download(fn,content,type='text/csv'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fn;a.click();URL.revokeObjectURL(url);}
function csv(v){return'"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
async function exportCSV(type){
  let rows=[];let fn='zglf-'+type+'.csv';
  if(type==='donations'){const d=await api('donations');rows=[['Donor','Email','Amount','Campaign','Method','Date','Status','Anonymous','Note']];d.forEach(x=>rows.push([x.donor,x.email,x.amount,x.campaign,x.method,x.created_at,x.status,x.anonymous?'Yes':'No',x.note||'']));}
  else if(type==='members'){const m=await api('members');rows=[['Name','Email','Phone','State','Tier','Joined','Status']];m.forEach(x=>rows.push([x.name,x.email,x.phone,x.state,x.tier,x.joined,x.status]));}
  else if(type==='events'){const e=await api('events');rows=[['Title','Date','Time','Location','Status','Media count']];e.forEach(x=>rows.push([x.title,x.event_date,x.event_time,x.location,x.status,(x.media||[]).length]));}
  download(fn,rows.map(r=>r.map(csv).join(',')).join('\n'));toast('Exported');
}

/* ---------- SETTINGS ---------- */
async function renderSettings(){
  if(!can('settings'))return;
  const s=DATA.site||await api('site');
  $('#pageContent').innerHTML=`
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-cog"></i>Preferences</h3></div>
      <div class="card-body"><div class="form-grid">
        <div><label class="form-label">Currency</label><select class="form-input" id="set-cur"><option value="NGN"${s.currency==='NGN'?' selected':''}>Nigerian Naira (₦)</option><option value="USD"${s.currency==='USD'?' selected':''}>US Dollar ($)</option><option value="EUR"${s.currency==='EUR'?' selected':''}>Euro (€)</option><option value="GBP"${s.currency==='GBP'?' selected':''}>British Pound (£)</option></select></div>
        <div><label class="form-label">Contact Email</label><input class="form-input" id="set-email" value="${esc(s.contactEmail||s.email||'')}"></div>
        <div class="full"><label class="form-check"><input type="checkbox" id="set-maint" ${s.maintenanceMode=='1'?'checked':''}><label>Maintenance mode</label></div>
      </div><div style="margin-top:20px;display:flex;justify-content:flex-end"><button class="btn btn-primary" style="width:auto" onclick="saveSettings()"><i class="fa-solid fa-save"></i>Save</button></div></div></div>
    <div class="card"><div class="card-header"><h3><i class="fa-solid fa-key"></i>Change Password</h3></div>
      <div class="card-body"><div class="form-grid" style="max-width:400px">
        <div class="full"><label class="form-label">Current password</label><input type="password" class="form-input" id="pw-cur"></div>
        <div class="full"><label class="form-label">New password (min 6)</label><input type="password" class="form-input" id="pw-new"></div>
        <div><button class="btn btn-primary" style="width:auto" onclick="changePw()"><i class="fa-solid fa-key"></i>Update</button></div>
      </div></div></div>`;
}
async function saveSettings(){await api('settings',{body:{currency:$('#set-cur').value,contactEmail:$('#set-email').value,maintenanceMode:$('#set-maint').checked?'1':'0'},method:'POST'});toast('Settings saved');DATA.site=await api('site');}
async function changePw(){const c=$('#pw-cur').value,n=$('#pw-new').value;if(n.length<6){toast('Min 6 characters','error');return;}try{await api('auth/password',{body:{current:c,password:n},method:'POST'});toast('Password changed');$('#pw-cur').value='';$('#pw-new').value='';}catch(e){}}

/* ---------- Login button on public site is already added by link in footer; wire login redirect ---------- */
render();

/* =============================================================
   CORRECTED PATCHES — v2
   Fixes from client feedback:
   1. WYSIWYG on hero/program/event/site textareas, no raw <em> tag hints
   2. showMediaThumb called on initial render for existing media (previews show)
   3. Media upload: hit /upload directly for single-field uploads; /api/media for media library
   4. Icon picker on NEC + Programs
   5. Footer page + Payment Settings page populated correctly
   6. Event modal: hidden #e-mm input added, saveEvent no longer fails
   7. Footer edit page renders form correctly
   8. URL input row hidden
   ============================================================= */

const faIcons=['fa-crown','fa-hands-helping','fa-hand-holding-heart','fa-pen-fancy','fa-file-alt','fa-coins','fa-calculator','fa-bullhorn','fa-heart','fa-star','fa-user-tie','fa-user','fa-users','fa-user-shield','fa-user-check','fa-user-graduate','fa-graduation-cap','fa-book','fa-book-open','fa-school','fa-heartbeat','fa-stethoscope','fa-notes-medical','fa-pills','fa-hospital','fa-hand-holding-medical','fa-hand-holding-dollar','fa-money-bill-wave','fa-sack-dollar','fa-piggy-bank','fa-briefcase','fa-tools','fa-seedling','fa-tractor','fa-truck','fa-tint','fa-home','fa-utensils','fa-hands','fa-dove','fa-globe','fa-flag','fa-award','fa-trophy','fa-medal','fa-gem','fa-newspaper','fa-microphone','fa-camera','fa-video','fa-share-alt','fa-envelope','fa-phone','fa-location-dot','fa-paper-plane','fa-gift','fa-donate','fa-pray','fa-leaf','fa-tree','fa-sun','fa-balance-scale','fa-gavel','fa-landmark','fa-shield-halved','fa-key','fa-lock','fa-cog','fa-sliders','fa-wrench','fa-chart-line','fa-chart-bar','fa-chart-pie','fa-list-check','fa-clipboard-list','fa-calendar-check','fa-clock','fa-compass','fa-rocket','fa-lightbulb','fa-eye','fa-smile','fa-handshake','fa-link','fa-futbol','fa-palette','fa-music','fa-masks-theater','fa-people-group','fa-children','fa-earth-africa','fa-droplet','fa-bowl-rice','fa-hand-holding-droplet','fa-plate-wheat','fa-hands-holding-child','fa-people-carry-box'];

/* ---- WYSIWYG ---- */
function makeWysiwyg(textarea){
  if(!textarea||textarea._wysiwygInit)return;
  const val=textarea.value||'';
  const wrap=document.createElement('div');wrap.className='wysiwyg-wrap';
  wrap.innerHTML=`<div class="wysiwyg-toolbar">
    <button type="button" data-c="bold" title="Bold"><i class="fas fa-bold"></i></button>
    <button type="button" data-c="italic" title="Italic"><i class="fas fa-italic"></i></button>
    <button type="button" data-c="underline" title="Underline"><i class="fas fa-underline"></i></button>
    <span class="tb-sep"></span>
    <button type="button" data-c="formatBlock" data-v="h4" title="Heading">H</button>
    <button type="button" data-c="formatBlock" data-v="p" title="Paragraph">P</button>
    <span class="tb-sep"></span>
    <button type="button" data-c="insertUnorderedList" title="Bullet list"><i class="fas fa-list-ul"></i></button>
    <button type="button" data-c="insertOrderedList" title="Numbered list"><i class="fas fa-list-ol"></i></button>
    <span class="tb-sep"></span>
    <button type="button" data-c="justifyLeft" title="Align left"><i class="fas fa-align-left"></i></button>
    <button type="button" data-c="justifyCenter" title="Align center"><i class="fas fa-align-center"></i></button>
    <span class="tb-sep"></span>
    <button type="button" data-c="createLink" title="Link"><i class="fas fa-link"></i></button>
    <button type="button" data-c="removeFormat" title="Clear"><i class="fas fa-eraser"></i></button>
  </div><div class="wysiwyg-area" contenteditable="true"></div>`;
  const area=wrap.querySelector('.wysiwyg-area');area.innerHTML=val;
  wrap.querySelectorAll('.wysiwyg-toolbar button').forEach(b=>{
    b.addEventListener('mousedown',e=>e.preventDefault());
    b.addEventListener('click',e=>{e.preventDefault();const c=b.dataset.c,v=b.dataset.v||null;
      if(c==='createLink'){const u=prompt('Enter URL:','https://');if(u)document.execCommand('createLink',false,u);}
      else document.execCommand(c,false,v);
      area.focus();textarea.value=area.innerHTML;
    });
  });
  area.addEventListener('input',()=>{textarea.value=area.innerHTML;});
  area.addEventListener('blur',()=>{textarea.value=area.innerHTML;});
  textarea._wysiwygArea=area;textarea._wysiwygInit=true;
  textarea.style.display='none';
  textarea.parentNode.insertBefore(wrap,textarea);
}
function syncWysiwyg(textarea){if(textarea&&textarea._wysiwygArea)textarea.value=textarea._wysiwygArea.innerHTML;}

/* ---- Icon picker ---- */
function makeIconPicker(input){
  if(!input||input._iconInit)return;input._iconInit=true;
  const cur=input.value.trim()||'fa-star';
  const wrap=document.createElement('div');wrap.className='icon-picker';
  wrap.innerHTML=`<div class="ipick-sel"><i class="fas ${cur}"></i> <span>${cur}</span></div>
    <div class="ipick-grid">${faIcons.map(ic=>`<button type="button" class="ipick ${ic===cur?'sel':''}" data-icon="${ic}" title="${ic}"><i class="fas ${ic}"></i></button>`).join('')}</div>`;
  const selBtn=wrap.querySelector('.ipick-sel');const grid=wrap.querySelector('.ipick-grid');
  selBtn.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.ipick-grid.open').forEach(g=>{if(g!==grid)g.classList.remove('open');});grid.classList.toggle('open');});
  grid.querySelectorAll('.ipick').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();grid.querySelectorAll('.ipick.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');
    const ic=b.dataset.icon;input.value=ic;selBtn.innerHTML=`<i class="fas ${ic}"></i> <span>${ic}</span>`;grid.classList.remove('open');
  }));
  document.addEventListener('click',()=>grid.classList.remove('open'));
  input.style.display='none';input.parentNode.insertBefore(wrap,input);
}

/* ---- Fix media upload to use /api/upload directly AND show existing thumb ---- */
async function _doUpload(file,subdir){
  if(!file)return null;
  const fd=new FormData();fd.append('file',file);fd.append('subdir',subdir||'images');
  const r=await api('upload',{form:fd});
  return r.media;
}

/* Wrap the original handleMediaUpload to use direct /upload */
const _origHMU=handleMediaUpload;
handleMediaUpload=async function(e,id){
  const f=e.target.files[0];if(!f)return;
  const wrap=document.getElementById(id+'-wrap');if(!wrap)return;
  let status=wrap.querySelector('.mu-status');if(!status){status=document.createElement('div');status.className='mu-status';wrap.appendChild(status);}
  status.style.color='';status.textContent='Uploading…';
  try{
    const subdir=f.type.startsWith('video/')?'events':'images';
    const m=await _doUpload(f,subdir);
    const data={type:m.type,url:m.url};
    document.getElementById(id+'-data').value=JSON.stringify(data);
    showMediaThumb(id,data);
    window['__mu_'+id]=data;
    status.textContent='Uploaded ✓';setTimeout(()=>status.remove(),2000);
  }catch(err){status.style.color='var(--rose)';status.textContent='Upload failed: '+err.message;}
};

/* Override mediaUploader to hide URL row + show existing thumb */
const _origMU=mediaUploader;
mediaUploader=function(initial,inputId,hint){
  const html=_origMU.call(this,initial,inputId,hint||'Image (upload local file)');
  setTimeout(()=>{
    // Hide URL row
    const urlRow=document.getElementById(inputId+'-url');
    if(urlRow){const row=urlRow.closest('.url-input-row');if(row)row.style.display='none';urlRow.disabled=true;urlRow.value='';urlRow.placeholder='URL upload disabled; use local file';}
    // Show initial thumb if present
    if(initial){try{showMediaThumb(inputId,typeof initial==='string'?{type:'image',url:initial}:initial);}catch(e){}}
  },0);
  return html;
};

/* ---- Add menu entries for new pages BEFORE PAGES is used ---- */
MENU[1].items.push({key:'footer',label:'Footer Content',icon:'fa-shoe-prints',perm:'site'});
MENU[2].items.push({key:'banks',label:'Payment Settings',icon:'fa-credit-card',perm:'donations'});
TITLES.footer=['Footer Content','Edit the footer shown on every page'];
TITLES.banks=['Donation & Payment Settings','Bank accounts & Paystack gateway'];
PAGES.footer=renderFooterPage;
PAGES.banks=renderBanksPage;

/* ---- Wire WYSIWYG + icon pickers + previews to existing openXxxModals ---- */
const _origOpenNec=openNecModal;
openNecModal=function(id){
  _origOpenNec(id);
  setTimeout(()=>{
    const icon=document.getElementById('n-icon');if(icon)makeIconPicker(icon);
    const duty=document.getElementById('n-duty');if(duty)makeWysiwyg(duty);
  },60);
};
const _origSaveNec=saveNec;
saveNec=async function(id){
  syncWysiwyg(document.getElementById('n-duty'));
  // Properly upload file if present
  const ph=await resolveMedia('n-photo','nec');
  const body={role_title:$('#n-role').value,name:$('#n-name').value,gradient:$('#n-grad').value,icon:$('#n-icon').value,duty:$('#n-duty').value,published:$('#n-pub').checked?1:0};
  if(ph)body.photo=ph.url;
  await api('nec'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'Position updated':'Position added');closeModal();renderNEC();
};

const _origOpenProgram=openProgramModal;
openProgramModal=function(id){
  _origOpenProgramModal(id);
  setTimeout(()=>{
    const icon=document.getElementById('p-icon');if(icon)makeIconPicker(icon);
    const full=document.getElementById('p-full');if(full)makeWysiwyg(full);
    const sh=document.getElementById('p-short');if(sh)makeWysiwyg(sh);
  },60);
};
const _origSaveProgram=saveProgram;
saveProgram=async function(id){
  syncWysiwyg(document.getElementById('p-full'));
  syncWysiwyg(document.getElementById('p-short'));
  const cov=await resolveMedia('p-cover','programs');
  const body={slug:$('#p-slug').value,title:$('#p-title').value,tag:$('#p-tag').value,tag_color:$('#p-color').value,icon:$('#p-icon').value,short_desc:$('#p-short').value,full_desc:$('#p-full').value,published:1};
  if(cov)body.cover=cov.url;
  if(!body.slug)body.slug=(body.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  await api('programs'+(id?'/'+id:''),{body,method:'POST'});
  toast(id?'Program updated':'Program added');closeModal();renderPrograms();
};

const _origOpenEvent=openEventModal;
openEventModal=function(id){
  _origOpenEvent(id);
  setTimeout(()=>{
    const desc=document.getElementById('e-desc');if(desc)makeWysiwyg(desc);
    // Re-bind file listener to use _doUpload (single, reliable path)
    const fileInp=document.getElementById('e-file');
    if(fileInp){
      const newInp=fileInp.cloneNode(true);fileInp.parentNode.replaceChild(newInp,fileInp);
      newInp.addEventListener('change',async ev=>{await mmAddFiles('ev','e-mp','e-mm',[...ev.target.files],'events');ev.target.value='';});
    }
  },80);
};

function evAddUrl(){
  const url=document.getElementById('e-url').value.trim();if(!url)return;
  const isVideo=/\.(mp4|webm|mov)($|\?)/i.test(url);
  mmAdd('ev','e-mp','e-mm',{type:isVideo?'video':'image',url:url});
  document.getElementById('e-url').value='';
}

/* Wrap saveEvent to sync wysiwyg before the original runs */
const _origSaveEvent=saveEvent;
saveEvent=async function(id){
  try{
    syncWysiwyg(document.getElementById('e-desc'));
    await _origSaveEvent(id);
  }catch(e){toast(e.message,'error');console.error(e);}
};

/* Hero WYSIWYG on body + remove literal <em> hint */
const _origRenderHero=renderHero;
renderHero=async function(){
  await _origRenderHero();
  setTimeout(()=>{
    const bd=document.getElementById('h-bd');if(bd)makeWysiwyg(bd);
    // Remove the "Use <em>word</em>" help paragraph that shows raw tags
    const help=document.querySelector('p.form-help');if(help&&help.innerHTML.includes('&lt;em&gt;'))help.remove();
  },60);
};
const _origSaveHero=saveHeroText;
saveHeroText=async function(){
  syncWysiwyg(document.getElementById('h-bd'));
  await api('hero',{body:{headline:document.getElementById('h-hl').value,subhead:document.getElementById('h-sub').value,visionquote:document.getElementById('h-vq').value,body:document.getElementById('h-bd').value,cta1:document.getElementById('h-c1').value,cta2:document.getElementById('h-c2').value},method:'POST'});
  toast('Hero text saved.');HERO=await api('hero');
};

/* Site page WYSIWYG on vision/mission */
const _origRenderSite=renderSite;
renderSite=async function(){
  await _origRenderSite();
  setTimeout(()=>{
    ['s-vision','s-mission','s-address'].forEach(id=>{const t=document.getElementById(id);if(t)makeWysiwyg(t);});
  },60);
};

/* Footer page */
async function renderFooterPage(){
  if(!can('site'))return;
  const s=DATA.site||await api('site');
  document.getElementById('pageContent').innerHTML=`
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-shoe-prints"></i>Footer Content</h3>
        <p style="font-size:12px;color:var(--gray-500);margin:0">Edit the footer shown at the bottom of every page.</p></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="full"><label class="form-label">About column (rich text)</label><textarea class="form-input" id="f-about" rows="6">${esc(s.footerAbout||'')}</textarea></div>
          <div class="full"><label class="form-label">Copyright line</label><input class="form-input" id="f-copy" value="${esc(s.footerCopyright||'')}"></div>
        </div>
        <div style="margin-top:20px;display:flex;justify-content:flex-end"><button class="btn btn-primary" style="width:auto" onclick="saveFooter()"><i class="fa-solid fa-save"></i>Save Footer</button></div>
      </div>
    </div>`;
  setTimeout(()=>makeWysiwyg(document.getElementById('f-about')),60);
}
async function saveFooter(){
  syncWysiwyg(document.getElementById('f-about'));
  await api('site',{method:'POST',body:{footerAbout:document.getElementById('f-about').value,footerCopyright:document.getElementById('f-copy').value}});
  toast('Footer saved');DATA.site=await api('site');
}

/* Payment Settings page */
async function renderBanksPage(){
  if(!can('donations'))return;
  const s=DATA.site||await api('site');
  let banks=[];try{banks=JSON.parse(s.bankAccounts||'[]');if(!Array.isArray(banks))banks=[];}catch(e){banks=[];}
  document.getElementById('pageContent').innerHTML=`
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-university"></i>Bank Accounts</h3>
        <p style="font-size:12px;color:var(--gray-500);margin:0">Shown on the public Donate page.</p></div>
      <div class="card-body">
        <div id="bankList"></div>
        <button class="btn btn-outline btn-sm" id="addBank" style="margin-top:8px"><i class="fa-solid fa-plus"></i>Add Bank Account</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-credit-card"></i>Paystack Online Payments</h3></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="full"><label class="form-check"><input type="checkbox" id="ps-en" ${s.paystackEnabled=='1'?'checked':''}><label>Enable Paystack online card payments</label></div>
          <div><label class="form-label">Public Key</label><input class="form-input" id="ps-pub" value="${esc(s.paystackKey||'')}" placeholder="pk_test_..."></div>
          <div><label class="form-label">Secret Key</label><input type="password" class="form-input" id="ps-secret" value="${esc(s.paystackSecret||'')}" placeholder="sk_test_..."></div>
          <div class="full"><label class="form-label">Donate page title</label><input class="form-input" id="dtitle" value="${esc(s.donationTitle||'Support Our Mission')}"></div>
          <div class="full"><label class="form-label">Donate page note (rich text)</label><textarea class="form-input" id="dnote" rows="4">${esc(s.donationNote||'')}</textarea></div>
        </div>
        <div style="margin-top:20px;display:flex;justify-content:flex-end"><button class="btn btn-primary" style="width:auto" onclick="savePaySettings()"><i class="fa-solid fa-save"></i>Save Payment Settings</button></div>
      </div>
    </div>`;
  const bl=document.getElementById('bankList');
  function addBank(b){b=b||{bankName:'',accountName:'',accountNumber:''};
    const row=document.createElement('div');row.className='bank-row';
    row.innerHTML=`<div style="grid-column:1/-1;display:flex;justify-content:space-between;align-items:center"><b style="color:var(--azure-700)"><i class="fa-solid fa-university"></i> Bank Account</b><button type="button" class="icon-btn delete" title="Remove"><i class="fa-solid fa-trash"></i></button></div>
      <div class="form-group"><label class="form-label">Bank Name</label><input class="form-input bn" value="${esc(b.bankName)}" placeholder="e.g. Access Bank"></div>
      <div class="form-group"><label class="form-label">Account Name</label><input class="form-input an" value="${esc(b.accountName)}" placeholder="Zee Glow Link Foundation"></div>
      <div class="form-group"><label class="form-label">Account Number</label><input class="form-input anum" value="${esc(b.accountNumber)}" placeholder="0123456789"></div>`;
    row.querySelector('.delete').onclick=()=>row.remove();
    bl.appendChild(row);
  }
  banks.forEach(addBank);
  document.getElementById('addBank').onclick=()=>addBank();
  setTimeout(()=>makeWysiwyg(document.getElementById('dnote')),60);
}
async function savePaySettings(){
  syncWysiwyg(document.getElementById('dnote'));
  const banks=[...document.querySelectorAll('#bankList .bank-row')].map(r=>({
    bankName:r.querySelector('.bn').value,accountName:r.querySelector('.an').value,accountNumber:r.querySelector('.anum').value
  })).filter(b=>b.bankName||b.accountNumber);
  const payload={bankAccounts:JSON.stringify(banks),
    paystackEnabled:document.getElementById('ps-en').checked?'1':'0',
    paystackKey:document.getElementById('ps-pub').value,
    paystackSecret:document.getElementById('ps-secret').value,
    donationTitle:document.getElementById('dtitle').value,
    donationNote:document.getElementById('dnote').value};
  await api('settings',{method:'POST',body:payload});
  toast('Payment settings saved');DATA.site=await api('site');
}

/* Messages: ensure markRead toggles properly, list is refreshed after */
// (original code already works — kept for reference)

