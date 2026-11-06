<?php
require_once __DIR__.'/config.php';

$uri=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
// Strip prefix up to /api/
$api_pos=strpos($uri,'/api/');
$path='';if($api_pos!==false){$path=substr($uri,$api_pos+5);}
$path=trim($path,'/');
$parts=explode('/',$path);
$resource=$parts[0]??'';
$id=$parts[1]??null;
$sub=$parts[2]??null;
$method=$_SERVER['REQUEST_METHOD'];
$db=db();
$body=body();

function log_action($action,$detail=''){
  global $db;$uid=$_SESSION['user_id']??null;
  if($uid){$db->prepare("INSERT INTO activity_log(user_id,action,detail) VALUES(?,?,?)")->execute([$uid,$action,$detail]);}
}

function settings_all(){global $db;$rows=$db->query("SELECT k,v FROM site_settings")->fetchAll();$out=[];foreach($rows as $r)$out[$r['k']]=$r['v'];return $out;}
function setting($k,$def=''){global $db;$s=$db->prepare("SELECT v FROM site_settings WHERE k=?");$s->execute([$k]);$r=$s->fetch();return$r?$r['v']:$def;}

// ==================== AUTH ====================
if($resource==='auth'&&$method==='POST'&&$id==='login'){
  $u=$body['username']??$_POST['username']??'';
  $p=$body['password']??$_POST['password']??'';
  $stmt=$db->prepare("SELECT * FROM users WHERE (username=? OR email=?) AND status='active' LIMIT 1");
  $stmt->execute([$u,$u]);$user=$stmt->fetch();
  if(!$user||!password_verify($p,$user['password_hash'])){json(['error'=>'Invalid credentials'],401);}
  $token=bin2hex(random_bytes(32));
  $exp=date('Y-m-d H:i:s',strtotime('+7 days'));
  $db->prepare("INSERT INTO user_tokens(user_id,token,expires_at) VALUES(?,?,?)")->execute([$user['id'],$token,$exp]);
  $_SESSION['user_id']=$user['id'];
  $user['perms']=json_decode($user['perms']??'{}',true);
  unset($user['password_hash']);
  log_action('login','User logged in');
  json(['token'=>$token,'user'=>$user,'expires'=>$exp]);
}
if($resource==='auth'&&$id==='me'){
  $u=is_logged_in();if(!$u)json(['error'=>'Unauthorized'],401);
  $u['perms']=json_decode($u['perms']??'{}',true);unset($u['password_hash']);json($u);
}
if($resource==='auth'&&$id==='logout'&&$method==='POST'){
  $h=getallheaders();$tok=str_replace('Bearer ','',$h['Authorization']??'');
  if($tok){$db->prepare("DELETE FROM user_tokens WHERE token=?")->execute([$tok]);}
  session_destroy();json(['ok'=>1]);
}
if($resource==='auth'&&$id==='password'&&$method==='POST'){
  $u=require_auth();
  $cur=$body['current']??'';$nw=$body['password']??'';
  if(!password_verify($cur,$u['password_hash']))json(['error'=>'Current password incorrect'],400);
  if(strlen($nw)<6)json(['error'=>'Password too short (min 6)'],400);
  $hash=password_hash($nw,PASSWORD_BCRYPT);
  $db->prepare("UPDATE users SET password_hash=? WHERE id=?")->execute([$hash,$u['id']]);
  log_action('password_change','Changed own password');
  json(['ok'=>1]);
}

// Public: submit contact form, donation, membership application
if($resource==='public'){
  if($id==='contact'&&$method==='POST'){
    $stmt=$db->prepare("INSERT INTO messages(name,email,subject,message,source) VALUES(?,?,?,?,?)");
    $stmt->execute([$body['name']??'',$body['email']??'',$body['subject']??'',$body['message']??'','contact']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if($id==='donate'&&$method==='POST'){
    $anon=!empty($body['anonymous'])?1:0;
    $stmt=$db->prepare("INSERT INTO donations(donor,email,amount,campaign,method,anonymous,note,status) VALUES(?,?,?,?,?,?,?,?)");
    $stmt->execute([$body['name']??'Anonymous',$body['email']??'',$body['amount']??0,$body['campaign']??'General',$body['method']??'Bank Transfer',$anon,$body['note']??'','pending']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if($id==='membership'&&$method==='POST'){
    $stmt=$db->prepare("INSERT INTO members(name,email,phone,state,tier,status,joined) VALUES(?,?,?,?,?,?,CURDATE())");
    $stmt->execute([$body['name']??'',$body['email']??'',$body['phone']??'',$body['state']??'','Applicant','pending']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
}

// Public API for frontend: pull all dynamic content
if($resource==='content'&&$method==='GET'){
  $out=['site'=>settings_all()];
  $out['hero']=[
    'headline'=>setting('hero_headline'),'subhead'=>setting('hero_subhead'),
    'visionquote'=>setting('hero_visionquote'),'body'=>setting('hero_body'),
    'ctaPrimary'=>setting('hero_cta1'),'ctaSecondary'=>setting('hero_cta2'),
    'slides'=>$db->query("SELECT id,type,url,alt_text as alt,caption FROM hero_slides ORDER BY position ASC")->fetchAll()
  ];
  $out['programs']=$db->query("SELECT * FROM programs WHERE published=1 ORDER BY id ASC")->fetchAll();
  foreach($out['programs'] as &$p)$p['published']=(bool)$p['published'];
  $events=$db->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();
  foreach($events as &$e){$em=$db->prepare("SELECT type,url FROM event_media WHERE event_id=? ORDER BY position ASC");$em->execute([$e['id']]);$e['media']=$em->fetchAll();}
  $out['events']=$events;
  $out['nec']=$db->query("SELECT * FROM nec_members WHERE published=1 ORDER BY position ASC")->fetchAll();
  foreach($out['nec'] as &$n)$n['published']=(bool)$n['published'];
  $out['partners']=[]; // static for now
  $out['stats']=[
    'donations_total'=>(float)$db->query("SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='verified'")->fetchColumn(),
    'members_active'=>(int)$db->query("SELECT COUNT(*) FROM members WHERE status='active'")->fetchColumn(),
    'events_upcoming'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='upcoming'")->fetchColumn(),
    'donations_count'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='verified'")->fetchColumn()
  ];
  // Settings
  $out['settings']=['currency'=>setting('currency','NGN'),'currencySymbol'=>setting('currencySymbol','₦'),'maintenanceMode'=>(bool)setting('maintenanceMode')];
  json($out);
}

// ==================== UPLOADS (protected) ====================
if($resource==='upload'&&$method==='POST'){
  require_perm('photos');
  $sub=$_POST['subdir']??'images';
  if(!in_array($sub,['images','videos','events']))$sub='images';
  try{$m=handle_upload('file',$sub);
    $db->prepare("INSERT INTO media_library(title,category,type,url,uploaded_by) VALUES(?,?,?,?,?)")->execute([$_POST['title']??'Uploaded media',$_POST['category']??'General',$m['type'],$m['url'],$GLOBALS['CURRENT_USER_ID']??null]);
    log_action('upload','Uploaded '.$m['type'].' '.$m['url']);
    json(['ok'=>1,'media'=>$m]);
  }catch(Exception $e){json(['error'=>$e->getMessage()],400);}
}

// ==================== USERS ====================
if($resource==='users'){
  require_perm('users');
  if($method==='GET'){
    $users=$db->query("SELECT id,name,email,username,role,perms,status,created_at FROM users ORDER BY id ASC")->fetchAll();
    foreach($users as &$u)$u['perms']=json_decode($u['perms']??'{}',true);
    json($users);
  }
  if($method==='POST'){
    $un=strtolower(preg_replace('/\s+/','_',$body['username']??''));
    $name=$body['name']??($body['username']??'');
    $email=$body['email']??null;$role=$body['role']??'staff';$status=$body['status']??'active';
    $pass=$body['password']??'';
    if(!$un)json(['error'=>'Username required'],400);
    if(!$id&&!$pass)json(['error'=>'Password required'],400);
    $perms_in=$body['perms']??null; if(is_string($perms_in)){$perms_in=json_decode($perms_in,true);} $perms=$role==='admin'?json_encode(['dashboard'=>1,'hero'=>1,'site'=>1,'programs'=>1,'events'=>1,'donations'=>1,'photos'=>1,'nec'=>1,'members'=>1,'messages'=>1,'users'=>1,'reports'=>1,'settings'=>1]):json_encode($perms_in?:new stdClass);
    if($id){
      $q="UPDATE users SET name=?,email=?,username=?,role=?,perms=?,status=? WHERE id=?";
      $args=[$name,$email,$un,$role,$perms,$status,$id];
      if($pass){$q="UPDATE users SET name=?,email=?,username=?,role=?,perms=?,status=?,password_hash=? WHERE id=?";$args=[$name,$email,$un,$role,$perms,$status,password_hash($pass,PASSWORD_BCRYPT),$id];}
      $db->prepare($q)->execute($args);
      log_action('user_edit','Updated user id='.$id);
    }else{
      $chk=$db->prepare("SELECT id FROM users WHERE username=?");$chk->execute([$un]);
      if($chk->fetch())json(['error'=>'Username exists'],400);
      $db->prepare("INSERT INTO users(name,email,username,password_hash,role,perms,status) VALUES(?,?,?,?,?,?,?)")->execute([$name,$email,$un,password_hash($pass,PASSWORD_BCRYPT),$role,$perms,$status]);
      log_action('user_create','Created user '.$un);
    }
    json(['ok'=>1]);
  }
  if($method==='DELETE'&&$id){
    $u=require_auth();
    if($u['id']==$id)json(['error'=>'Cannot delete yourself'],400);
    $db->prepare("DELETE FROM users WHERE id=?")->execute([$id]);
    log_action('user_delete','Deleted user id='.$id);
    json(['ok'=>1]);
  }
}

// ==================== SITE SETTINGS ====================
if($resource==='site'){
  if($method==='GET'){json(settings_all());}
  if($method==='POST'){require_perm('site');
    foreach($body as $k=>$v){
      $chk=$db->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
      if($chk->fetch())$db->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$v,$k]);
      else $db->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);
    }
    log_action('site_edit','Updated site settings');
    json(['ok'=>1]);
  }
}

// ==================== HERO ====================
if($resource==='hero'){
  if($method==='GET'){$slides=$db->query("SELECT * FROM hero_slides ORDER BY position ASC")->fetchAll();json(['text'=>['headline'=>setting('hero_headline'),'subhead'=>setting('hero_subhead'),'visionquote'=>setting('hero_visionquote'),'body'=>setting('hero_body'),'ctaPrimary'=>setting('hero_cta1'),'ctaSecondary'=>setting('hero_cta2')],'slides'=>$slides]);}
  if($method==='POST'){require_perm('hero');
    // Update text
    foreach(['hero_headline','hero_subhead','hero_visionquote','hero_body','hero_cta1','hero_cta2'] as$k){
      if(isset($body[str_replace('hero_','',$k)])){
        $key=$k;$val=$body[str_replace('hero_','',$k)];
        $db->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$val,$key]);
      }
    }
    log_action('hero_text','Updated hero text');
    json(['ok'=>1]);
  }
  if($id==='slides'&&$method==='POST'){require_perm('hero');
    $type=$body['type']??'image';$url=$body['url']??'';$alt=$body['alt']??'';$cap=$body['caption']??'';
    if(!$url)json(['error'=>'URL required'],400);
    $pos=(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM hero_slides")->fetchColumn();
    $db->prepare("INSERT INTO hero_slides(type,url,alt_text,caption,position) VALUES(?,?,?,?,?)")->execute([$type,$url,$alt,$cap,$pos]);
    log_action('hero_slide','Added slide');
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if(is_numeric($id)&&$method==='PUT'){require_perm('hero');
    $type=$body['type']??'image';$url=$body['url']??'';$alt=$body['alt']??'';$cap=$body['caption']??'';
    $db->prepare("UPDATE hero_slides SET type=?,url=?,alt_text=?,caption=? WHERE id=?")->execute([$type,$url,$alt,$cap,$id]);
    log_action('hero_slide','Updated slide '.$id);
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('hero');
    $db->prepare("DELETE FROM hero_slides WHERE id=?")->execute([$id]);
    // Reorder
    $rows=$db->query("SELECT id FROM hero_slides ORDER BY position ASC")->fetchAll();
    $s=$db->prepare("UPDATE hero_slides SET position=? WHERE id=?");
    foreach($rows as$i=>$r)$s->execute([$i,$r['id']]);
    log_action('hero_slide','Deleted slide '.$id);
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$sub==='move'){require_perm('hero');
    $dir=(int)($body['dir']??0);
    $r=$db->prepare("SELECT * FROM hero_slides WHERE id=?");$r->execute([$id]);$cur=$r->fetch();if(!$cur)json(['error'=>'not found'],404);
    $newPos=$cur['position']+$dir;
    $r2=$db->prepare("SELECT * FROM hero_slides WHERE position=? LIMIT 1");$r2->execute([$newPos]);$other=$r2->fetch();
    if($other){$db->prepare("UPDATE hero_slides SET position=? WHERE id=?")->execute([$cur['position'],$other['id']]);}
    $db->prepare("UPDATE hero_slides SET position=? WHERE id=?")->execute([$newPos,$id]);
    json(['ok'=>1]);
  }
}

// ==================== PROGRAMS ====================
if($resource==='programs'){
  if($method==='GET'){json($db->query("SELECT * FROM programs ORDER BY id ASC")->fetchAll());}
  if($method==='POST'){require_perm('programs');
    $f=($_FILES['cover']??null);$cover=$body['cover']??null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('cover','images');$cover=$m['url'];}catch(Exception $e){}}
    $slug=$body['slug']??strtolower(preg_replace('/[^a-z0-9]+/','-',strtolower($body['title']??'')));
    if($id){
      $db->prepare("UPDATE programs SET title=?,slug=?,tag=?,tag_color=?,icon=?,cover=COALESCE(NULLIF(?,''),cover),short_desc=?,full_desc=?,published=? WHERE id=?")
        ->execute([$body['title'],$slug,$body['tag']??'',$body['tagColor']??'#1a37b8',$body['icon']??'fa-star',$cover,$body['short']??'',$body['full']??'',!empty($body['published'])?1:0,$id]);
      log_action('program_edit','Updated program id='.$id);
    }else{
      $db->prepare("INSERT INTO programs(title,slug,tag,tag_color,icon,cover,short_desc,full_desc,published) VALUES(?,?,?,?,?,?,?,?,?)")
        ->execute([$body['title'],$slug,$body['tag']??'',$body['tagColor']??'#1a37b8',$body['icon']??'fa-star',$cover,$body['short']??'',$body['full']??'',!empty($body['published'])?1:0]);
      log_action('program_create','Created program '.$body['title']);
    }
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('programs');
    $db->prepare("DELETE FROM programs WHERE id=?")->execute([$id]);log_action('program_delete','Deleted program id='.$id);json(['ok'=>1]);}
}

// ==================== EVENTS ====================
if($resource==='events'){
  if($method==='GET'){
    $events=$db->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();
    foreach($events as &$e){$em=$db->prepare("SELECT id,type,url,position FROM event_media WHERE event_id=? ORDER BY position ASC");$em->execute([$e['id']]);$e['media']=$em->fetchAll();}
    json($events);
  }
  if($method==='POST'){require_perm('events');
    $title=$body['title']??'';
    $date=$body['event_date']??$body['date']??null;
    $time=$body['event_time']??$body['time']??null;
    $loc=$body['location']??'';
    $status=$body['status']??'upcoming';
    $desc=$body['description']??'';
    $excerpt=$body['excerpt']??($desc?(function_exists('mb_substr')?mb_substr($desc,0,160):substr($desc,0,160)):'');
    $feat=$body['featured_image']??null;
    $slug=$body['slug']??null;
    if(!$title)json(['error'=>'Title required'],400);
    if($id){
      $db->prepare("UPDATE events SET title=?,event_date=?,event_time=?,location=?,status=?,description=?,excerpt=?,featured_image=?,slug=? WHERE id=?")->execute([$title,$date,$time,$loc,$status,$desc,$excerpt,$feat,$slug,$id]);
    }else{
      $db->prepare("INSERT INTO events(title,event_date,event_time,location,status,description,excerpt,featured_image,slug) VALUES(?,?,?,?,?,?,?,?,?)")->execute([$title,$date,$time,$loc,$status,$desc,$excerpt,$feat,$slug]);
      $id=$db->lastInsertId();
    }
    // Handle new media items in body.media
    $media=$body['media']??[];
    if(is_array($media)){
      // Replace (simpler for save)
      $db->prepare("DELETE FROM event_media WHERE event_id=?")->execute([$id]);
      $ins=$db->prepare("INSERT INTO event_media(event_id,type,url,position) VALUES(?,?,?,?)");
      foreach($media as$i=>$m){$ins->execute([$id,$m['type']??'image',$m['url']??'',$i]);}
    }
    log_action('event_'.($id?'edit':'create'),'Event id='.$id.' title='.$title);
    json(['ok'=>1,'id'=>$id]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('events');
    $db->prepare("DELETE FROM events WHERE id=?")->execute([$id]);log_action('event_delete','Deleted event id='.$id);json(['ok'=>1]);}
  if(is_numeric($id)&&$sub==='media'&&$method==='POST'){require_perm('events');
    $f=$_FILES['file']??null;$m=null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('file','events');}catch(Exception $e){json(['error'=>$e->getMessage()],400);}}
    if(!$m){$url=$body['url']??'';$type=$body['type']??(preg_match('/\.(mp4|webm|mov)/i',$url)?'video':'image');$m=['type'=>$type,'url'=>$url];}
    $pos=(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM event_media WHERE event_id=$id")->fetchColumn();
    $db->prepare("INSERT INTO event_media(event_id,type,url,position) VALUES(?,?,?,?)")->execute([$id,$m['type'],$m['url'],$pos]);
    log_action('event_media','Added media to event '.$id);
    json(['ok'=>1,'media'=>$m,'id'=>$db->lastInsertId()]);
  }
  if($id==='media'&&is_numeric($sub)&&$method==='DELETE'){require_perm('events');
    $db->prepare("DELETE FROM event_media WHERE id=?")->execute([$sub]);json(['ok'=>1]);}
}

// ==================== MEDIA LIBRARY ====================
if($resource==='media'){
  if($method==='GET'){json($db->query("SELECT * FROM media_library ORDER BY created_at DESC")->fetchAll());}
  if($method==='POST'){require_perm('photos');
    $f=$_FILES['file']??null;$m=null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('file',$_POST['subdir']??'images');}catch(Exception $e){json(['error'=>$e->getMessage()],400);}}
    if(!$m){$url=$body['url']??'';if(!$url)json(['error'=>'No file or URL'],400);$type=$body['type']??(preg_match('/\.(mp4|webm|mov)/i',$url)?'video':'image');$m=['type'=>$type,'url'=>$url];}
    $u=is_logged_in();
    $db->prepare("INSERT INTO media_library(title,category,type,url,uploaded_by) VALUES(?,?,?,?,?)")->execute([$body['title']??'Uploaded',$_POST['category']??$body['category']??'General',$m['type'],$m['url'],$u['id']??null]);
    log_action('media_upload','Uploaded '.$m['type']);
    json(['ok'=>1,'id'=>$db->lastInsertId(),'media'=>$m]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('photos');
    $db->prepare("DELETE FROM media_library WHERE id=?")->execute([$id]);log_action('media_delete','Deleted media '.$id);json(['ok'=>1]);}
}

// ==================== NEC ====================
if($resource==='nec'){
  if($method==='GET'){json($db->query("SELECT * FROM nec_members ORDER BY position ASC")->fetchAll());}
  if($method==='POST'){require_perm('nec');
    $f=$_FILES['photo']??null;$photo=$body['photo']??null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('photo','images');$photo=$m['url'];}catch(Exception $e){}}
    $role=$body['role_title']??$body['role']??'';
    if($id){
      $db->prepare("UPDATE nec_members SET role_title=?,name=?,gradient=?,icon=?,duty=?,published=?".($photo?",photo=?":"")." WHERE id=?")
        ->execute(array_merge([$role,$body['name']??'',$body['gradient']??'from-azure-500 to-azure-700',$body['icon']??'fa-star',$body['duty']??'',!empty($body['published'])?1:0],$photo?[$photo]:[],[$id]));
      log_action('nec_edit','Updated NEC id='.$id);
    }else{
      $pos=(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM nec_members")->fetchColumn();
      $db->prepare("INSERT INTO nec_members(role_title,name,photo,gradient,icon,duty,position,published) VALUES(?,?,?,?,?,?,?,?)")
        ->execute([$role,$body['name']??'',$photo,$body['gradient']??'from-azure-500 to-azure-700',$body['icon']??'fa-star',$body['duty']??'',$pos,!empty($body['published'])?1:0]);
      log_action('nec_create','Added NEC '.$role);
    }
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('nec');$db->prepare("DELETE FROM nec_members WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// ==================== DONATIONS ====================
if($resource==='donations'){
  if(!can('donations')){require_perm('donations');}
  if($method==='GET'){json($db->query("SELECT * FROM donations ORDER BY created_at DESC")->fetchAll());}
  // POST /donations/:id        -> update status (accepts {status:'verified'|...})
  // POST /donations/:id/verify -> legacy alias
  if(is_numeric($id)&&($sub==='verify'||$sub==='')&&$method==='POST'){
    $status=$body['status']??'verified';
    if(!in_array($status,['pending','verified','rejected']))json(['error'=>'Invalid status'],400);
    $db->prepare("UPDATE donations SET status=? WHERE id=?")->execute([$status,$id]);
    log_action('donation_verify',"Set donation $id to $status");json(['ok'=>1]);}
  if(is_numeric($id)&&$method==='DELETE'){$db->prepare("DELETE FROM donations WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// ==================== MEMBERS ====================
if($resource==='members'){
  if($method==='GET'){json($db->query("SELECT * FROM members ORDER BY created_at DESC")->fetchAll());}
  if($method==='POST'){require_perm('members');
    $name=$body['name']??'';
    if($id){
      // Fetch existing record so partial updates work
      $ex=$db->prepare("SELECT * FROM members WHERE id=?");$ex->execute([$id]);$m=$ex->fetch();
      if(!$m)json(['error'=>'Not found'],404);
      if(!$name)$name=$m['name'];
      $db->prepare("UPDATE members SET name=?,email=?,phone=?,state=?,tier=?,status=? WHERE id=?")->execute([
        $name,$body['email']??$m['email'],$body['phone']??$m['phone'],$body['state']??$m['state'],
        $body['tier']??$m['tier'],$body['status']??$m['status'],$id]);
    }else{
      if(!$name)json(['error'=>'Name required'],400);
      $db->prepare("INSERT INTO members(name,email,phone,state,tier,status,joined) VALUES(?,?,?,?,?,?,CURDATE())")->execute([$name,$body['email']??'',$body['phone']??'',$body['state']??'',$body['tier']??'Applicant',$body['status']??'pending']);
    }
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('members');$db->prepare("DELETE FROM members WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// ==================== MESSAGES ====================
if($resource==='messages'){
  if($method==='GET'){json($db->query("SELECT * FROM messages ORDER BY created_at DESC")->fetchAll());}
  // POST /messages/:id/read  OR  POST /messages/:id  {is_read:1}  OR  POST /messages/:id/read
  if(is_numeric($id)&&$method==='POST'){
    $read=$body['is_read']??1;
    $db->prepare("UPDATE messages SET is_read=? WHERE id=?")->execute([$read?1:0,$id]);
    log_action('message_read','Toggled message '.$id.' read='.$read);json(['ok'=>1]);}
  if(is_numeric($id)&&$method==='DELETE'){require_perm('messages');$db->prepare("DELETE FROM messages WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// ==================== DASHBOARD STATS ====================
if($resource==='stats'){
  $u=require_auth();
  json([
    'donations_total'=>(float)$db->query("SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='verified'")->fetchColumn(),
    'donations_pending'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='pending'")->fetchColumn(),
    'donations_count'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='verified'")->fetchColumn(),
    'members_active'=>(int)$db->query("SELECT COUNT(*) FROM members WHERE status='active'")->fetchColumn(),
    'events_upcoming'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='upcoming'")->fetchColumn(),
    'events_completed'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='completed'")->fetchColumn(),
    'messages_unread'=>(int)$db->query("SELECT COUNT(*) FROM messages WHERE is_read=0")->fetchColumn(),
    'programs_published'=>(int)$db->query("SELECT COUNT(*) FROM programs WHERE published=1")->fetchColumn(),
    'media_count'=>(int)$db->query("SELECT COUNT(*) FROM media_library")->fetchColumn(),
    'monthly_donations'=>array_map(function($r){return ['month'=>$r['m'],'total'=>(float)$r['total']];},$db->query("SELECT DATE_FORMAT(created_at,'%Y-%m')as m,COALESCE(SUM(amount),0)as total FROM donations WHERE status='verified' AND created_at>DATE_SUB(NOW(),INTERVAL 12 MONTH) GROUP BY m ORDER BY m ASC")->fetchAll()),
    'by_campaign'=>$db->query("SELECT campaign,COALESCE(SUM(amount),0)as total FROM donations WHERE status='verified' GROUP BY campaign")->fetchAll(),
    'by_method'=>$db->query("SELECT method,COALESCE(SUM(amount),0)as total FROM donations WHERE status='verified' GROUP BY method")->fetchAll(),
    'activity'=>$db->query("SELECT a.*,u.name as user_name FROM activity_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 10")->fetchAll()
  ]);
}

// ==================== SETTINGS ====================
if($resource==='settings'&&$method==='POST'){
  require_perm('settings');
  foreach($body as$k=>$v){
    $chk=$db->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
    if($chk->fetch())$db->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$v,$k]);
    else $db->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);
  }
  log_action('settings','Updated settings');json(['ok'=>1]);
}

// Setup
if($resource==='setup'&&$method==='GET'){
  // Run setup via HTTP to initialize
  include __DIR__.'/setup.php';exit;
}

json(['error'=>'Not found: '.$resource.'/'.$id,'path'=>$path],404);
