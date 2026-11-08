<?php
require_once __DIR__.'/config.php';
$db=db();

$method=$_SERVER['REQUEST_METHOD'];
// Support both /api/content (rewrite) and /api/index.php/content (direct — no rewrite needed)
$path='';
if(!empty($_SERVER['PATH_INFO'])){
  $path=ltrim($_SERVER['PATH_INFO'],'/');
}else{
  $uri=strtok($_SERVER['REQUEST_URI'],'?'); // strip query string
  // Try '/api/index.php/...'
  if(($p=strpos($uri,'/api/index.php/'))!==false){$path=substr($uri,$p+15);}
  // Try '/api/...'
  elseif(($p=strpos($uri,'/api/'))!==false){$path=substr($uri,$p+5);}
}
$path=trim($path,'/');
$parts=explode('/',$path);
$resource=$parts[0]??'';
$id=$parts[1]??'';
$sub=$parts[2]??'';
$body=json_decode(file_get_contents('php://input'),true)?:[];

function log_action($action,$detail=''){global $db;$u=is_logged_in();if(!$u)return;$db->prepare("INSERT INTO activity_log(user_id,action,detail,created_at) VALUES(?,?,?,NOW())")->execute([$u['id']??null,$action,$detail]);}

// Public (no auth): site content, form submissions
if($resource==='public'){
  if($id==='contact'&&$method==='POST'){
    $stmt=$db->prepare("INSERT INTO messages(name,email,subject,message,source,is_read,created_at) VALUES(?,?,?,?,?,0,NOW())");
    $stmt->execute([$body['name']??'',$body['email']??'',$body['subject']??'',$body['message']??'','contact']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if($id==='donate'&&$method==='POST'){
    $anon=!empty($body['anonymous'])?1:0;
    $amt=(float)($body['amount']??0);
    if($amt<=0){json(['error'=>'Amount required'],400);}
    $stmt=$db->prepare("INSERT INTO donations(donor,email,amount,campaign,method,anonymous,note,status,created_at) VALUES(?,?,?,?,?,?,?,'pending',NOW())");
    $stmt->execute([$body['name']??'Anonymous',$body['email']??'',$amt,$body['campaign']??'General',$body['method']??'Bank Transfer',$anon,$body['note']??'']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if($id==='membership'&&$method==='POST'){
    $stmt=$db->prepare("INSERT INTO members(name,email,phone,state,tier,status,joined) VALUES(?,?,?,?,?,'pending',CURDATE())");
    $stmt->execute([$body['name']??'',$body['email']??'',$body['phone']??'',$body['state']??'','Applicant']);
    json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
}

if($resource==='content'&&$method==='GET'){
  $out=['site'=>settings_all()];
  $out['hero']=['headline'=>setting('hero_headline'),'subhead'=>setting('hero_subhead'),'visionquote'=>setting('hero_visionquote'),'body'=>setting('hero_body'),'ctaPrimary'=>setting('hero_cta1'),'ctaSecondary'=>setting('hero_cta2'),'slides'=>$db->query("SELECT id,type,url,alt_text as alt,caption FROM hero_slides ORDER BY position ASC")->fetchAll()];
  $out['programs']=$db->query("SELECT * FROM programs WHERE published=1 ORDER BY id ASC")->fetchAll();
  foreach($out['programs'] as &$p)$p['published']=(bool)$p['published'];
  $events=$db->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();
  foreach($events as &$e){$em=$db->prepare("SELECT type,url FROM event_media WHERE event_id=? ORDER BY position ASC");$em->execute([$e['id']]);$e['media']=$em->fetchAll();}
  $out['events']=$events;
  $out['nec']=$db->query("SELECT * FROM nec_members WHERE published=1 ORDER BY position ASC")->fetchAll();
  foreach($out['nec'] as &$n)$n['published']=(bool)$n['published'];
  $out['partners']=[];
  $out['stats']=['donations_total'=>(float)$db->query("SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='verified'")->fetchColumn(),'members_active'=>(int)$db->query("SELECT COUNT(*) FROM members WHERE status='active'")->fetchColumn(),'events_upcoming'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='upcoming'")->fetchColumn(),'events_completed'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='completed'")->fetchColumn(),'messages_unread'=>(int)$db->query("SELECT COUNT(*) FROM messages WHERE is_read=0")->fetchColumn(),'programs_published'=>(int)$db->query("SELECT COUNT(*) FROM programs WHERE published=1")->fetchColumn(),'media_count'=>(int)$db->query("SELECT COUNT(*) FROM media_library")->fetchColumn(),'donations_count'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='verified'")->fetchColumn(),'donations_pending'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='pending'")->fetchColumn(),'monthly_donations'=>$db->query("SELECT DATE_FORMAT(created_at,'%Y-%m') as month,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12")->fetchAll(),'by_campaign'=>$db->query("SELECT campaign,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY campaign")->fetchAll(),'by_method'=>$db->query("SELECT method,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY method")->fetchAll(),'activity'=>$db->query("SELECT al.id,al.user_id,al.action,al.detail,al.created_at,u.name as user_name FROM activity_log al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 20")->fetchAll()];
  $out['settings']=['currency'=>setting('currency','NGN'),'currencySymbol'=>setting('currencySymbol','₦'),'maintenanceMode'=>(bool)setting('maintenanceMode')];
  // Donation / bank info
  $out['donation']=['bankAccounts'=>json_decode(setting('bankAccounts','[]'),true)?:[],'paystackEnabled'=>(bool)setting('paystackEnabled'),'paystackKey'=>setting('paystackKey',''),'paystackSecret'=>setting('paystackSecret',''),'donationNote'=>setting('donationNote',''),'donationTitle'=>setting('donationTitle','Support Our Mission')];
  // Footer
  $out['footer']=['about'=>setting('footerAbout',''),'copyright'=>setting('footerCopyright','© '.date('Y').' Zee Glow Link Foundation. All rights reserved.')];
  json($out);
}

// Auth
if($resource==='auth'&&$id==='login'&&$method==='POST'){
  $u=$body['username']??'';$p=$body['password']??'';
  $st=$db->prepare("SELECT * FROM users WHERE (username=? OR email=?) AND status='active' LIMIT 1");$st->execute([$u,$u]);$user=$st->fetch();
  if(!$user||!password_verify($p,$user['password_hash']))json(['error'=>'Invalid credentials'],401);
  $token=bin2hex(random_bytes(24));
  // Support multiple concurrent sessions per user
  $db->prepare("DELETE FROM user_tokens WHERE user_id=? AND created_at < DATE_SUB(NOW(),INTERVAL 7 DAY)")->execute([$user['id']]);
  $db->prepare("INSERT INTO user_tokens(user_id,token,created_at) VALUES(?,?,NOW())")->execute([$user['id'],$token]);
  unset($user['password_hash']);$user['perms']=json_decode($user['perms']??'{}',true)?:[];
  log_action('login','User logged in');
  json(['token'=>$token,'user'=>$user]);
}
if($resource==='auth'&&$id==='me'){$u=require_auth();unset($u['password_hash']);$u['perms']=json_decode($u['perms']??'{}',true)?:[];json($u);}
if($resource==='auth'&&$id==='logout'&&$method==='POST'){$u=is_logged_in();if($u)$db->prepare("DELETE FROM user_tokens WHERE user_id=?")->execute([$u['id']]);json(['ok'=>1]);}
if($resource==='auth'&&$id==='password'&&$method==='POST'){
  $u=require_auth();$cur=$body['current']??'';$nw=$body['password']??'';
  if(!password_verify($cur,$u['password_hash']))json(['error'=>'Current password incorrect'],400);
  if(strlen($nw)<6)json(['error'=>'Password too short (min 6)'],400);
  $db->prepare("UPDATE users SET password_hash=? WHERE id=?")->execute([password_hash($nw,PASSWORD_BCRYPT),$u['id']]);
  log_action('password_change','Changed own password');json(['ok'=>1]);
}

// Upload (single protected endpoint)
if($resource==='upload'&&$method==='POST'){require_perm('photos');
  if(empty($_FILES['file']))json(['error'=>'No file'],400);
  try{$m=handle_upload('file',$_POST['subdir']??'images');json(['ok'=>1,'media'=>$m]);}catch(Exception $e){json(['error'=>$e->getMessage()],400);}
}

// USERS
if($resource==='users'){
  require_perm('users');
  if($method==='GET'){$users=$db->query("SELECT id,name,email,username,role,perms,status,created_at FROM users ORDER BY id ASC")->fetchAll();foreach($users as &$u)$u['perms']=json_decode($u['perms']??'{}',true)?:[];json($users);}
  if($method==='POST'){
    $un=strtolower(preg_replace('/\s+/','_',$body['username']??''));
    $name=$body['name']??($body['username']??'');
    $email=$body['email']??null;$role=$body['role']??'staff';$status=$body['status']??'active';
    $pass=$body['password']??'';
    if(!$un)json(['error'=>'Username required'],400);
    if(!$id&&!$pass)json(['error'=>'Password required'],400);
    $perms_in=$body['perms']??null;if(is_string($perms_in))$perms_in=json_decode($perms_in,true);
    $perms=$role==='admin'?json_encode(['dashboard'=>1,'hero'=>1,'site'=>1,'footer'=>1,'donations'=>1,'programs'=>1,'events'=>1,'photos'=>1,'nec'=>1,'members'=>1,'messages'=>1,'users'=>1,'reports'=>1,'settings'=>1]):json_encode($perms_in?:new stdClass);
    if($id){
      $q="UPDATE users SET name=?,email=?,username=?,role=?,perms=?,status=? WHERE id=?";$args=[$name,$email,$un,$role,$perms,$status,$id];
      if($pass){$q="UPDATE users SET name=?,email=?,username=?,role=?,perms=?,status=?,password_hash=? WHERE id=?";$args=[$name,$email,$un,$role,$perms,$status,password_hash($pass,PASSWORD_BCRYPT),$id];}
      $db->prepare($q)->execute($args);log_action('user_edit','Updated user id='.$id);
    }else{
      $chk=$db->prepare("SELECT id FROM users WHERE username=?");$chk->execute([$un]);if($chk->fetch())json(['error'=>'Username exists'],400);
      $db->prepare("INSERT INTO users(name,email,username,password_hash,role,perms,status) VALUES(?,?,?,?,?,?,?)")->execute([$name,$email,$un,password_hash($pass,PASSWORD_BCRYPT),$role,$perms,$status]);
      log_action('user_create','Created user '.$un);
    }
    json(['ok'=>1]);
  }
  if($method==='DELETE'&&$id){$u=require_auth();if($u['id']==$id)json(['error'=>'Cannot delete yourself'],400);$db->prepare("DELETE FROM users WHERE id=?")->execute([$id]);log_action('user_delete','Deleted user id='.$id);json(['ok'=>1]);}
}

// SITE
if($resource==='site'){
  if($method==='GET'){json(settings_all());}
  if($method==='POST'){require_perm('site');
    foreach($body as $k=>$v){if(is_array($v)||is_object($v))$v=json_encode($v);
      $chk=$db->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
      if($chk->fetch())$db->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$v,$k]);
      else $db->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);
    }
    log_action('site_edit','Updated site settings');json(['ok'=>1]);
  }
}
if($resource==='site'&&$id==='homepage'&&$method==='GET'){json(settings_all());}

// HERO
if($resource==='hero'){
  require_perm('hero');
  if($method==='GET'){
    $text=['headline'=>setting('hero_headline'),'subhead'=>setting('hero_subhead'),'visionquote'=>setting('hero_visionquote'),'body'=>setting('hero_body'),'cta1'=>setting('hero_cta1','Support Our Mission'),'cta2'=>setting('hero_cta2','Join us')];
    $slides=$db->query("SELECT * FROM hero_slides ORDER BY position ASC")->fetchAll();
    json(['text'=>$text,'slides'=>$slides]);
  }
  if($method==='POST'){
    foreach(['headline','subhead','visionquote','body','cta1','cta2'] as $k){if(isset($body[$k])){save_setting('hero_'.$k,$body[$k]);}}
    log_action('hero_edit','Updated hero text');json(['ok'=>1]);
  }
  if($id==='slides'&&$method==='POST'){
    $t=$body['type']??'image';$url=$body['url']??'';$alt=$body['alt']??'';$cap=$body['caption']??'';
    $pos=(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM hero_slides")->fetchColumn();
    $db->prepare("INSERT INTO hero_slides(position,type,url,alt_text,caption) VALUES(?,?,?,?,?)")->execute([$pos,$t,$url,$alt,$cap]);
    log_action('hero_slide_add','Added hero slide');json(['ok'=>1,'id'=>$db->lastInsertId()]);
  }
  if(is_numeric($id)&&$method==='PUT'){
    $db->prepare("UPDATE hero_slides SET type=?,url=?,alt_text=?,caption=? WHERE id=?")->execute([$body['type']??'image',$body['url']??'',$body['alt']??'',$body['caption']??'',$id]);
    log_action('hero_slide_edit','Updated slide '.$id);json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){$db->prepare("DELETE FROM hero_slides WHERE id=?")->execute([$id]);json(['ok'=>1]);}
  if(is_numeric($id)&&$sub==='move'&&$method==='PUT'){
    $dir=($body['dir']??'down')==='up'?-1:1;$s=$db->query("SELECT * FROM hero_slides WHERE id=$id")->fetch();if(!$s)json(['error'=>'Not found'],404);
    $new=$s['position']+$dir;$other=$db->prepare("SELECT * FROM hero_slides WHERE position=?");$other->execute([$new]);$o=$other->fetch();
    if($o){$db->prepare("UPDATE hero_slides SET position=? WHERE id=?")->execute([$s['position'],$o['id']]);$db->prepare("UPDATE hero_slides SET position=? WHERE id=?")->execute([$new,$id]);}
    json(['ok'=>1]);
  }
}

// PROGRAMS
if($resource==='programs'){
  if($method==='GET'){json($db->query("SELECT * FROM programs ORDER BY id ASC")->fetchAll());}
  if($method==='POST'){require_perm('programs');
    $title=$body['title']??'';if(!$title)json(['error'=>'Title required'],400);
    $slug=$body['slug']??'';if(!$slug)$slug=strtolower(preg_replace('/[^a-z0-9]+/','-',$title));
    $short=$body['short_desc']??$body['short']??'';
    $full=$body['full_desc']??$body['full']??'';
    $cover=$body['cover']??null;
    $tag=$body['tag']??'';$tagColor=$body['tag_color']??'#1a37b8';$icon=$body['icon']??'fa-star';
    $pub=!empty($body['published'])?1:0;
    if($id){
      $ex=$db->prepare("SELECT * FROM programs WHERE id=?");$ex->execute([$id]);$pr=$ex->fetch();if(!$pr)json(['error'=>'Not found'],404);
      if(!$slug)$slug=$pr['slug'];if(!$tag)$tag=$pr['tag'];if(!$tagColor)$tagColor=$pr['tag_color'];if(!$icon)$icon=$pr['icon'];if($cover===null)$cover=$pr['cover'];if($short===null)$short=$pr['short_desc'];if($full===null)$full=$pr['full_desc'];if($pub===null)$pub=$pr['published'];
      $db->prepare("UPDATE programs SET title=?,slug=?,tag=?,tag_color=?,icon=?,cover=?,short_desc=?,full_desc=?,published=? WHERE id=?")->execute([$title,$slug,$tag,$tagColor,$icon,$cover,$short,$full,$pub,$id]);
    }else{
      $db->prepare("INSERT INTO programs(slug,title,tag,tag_color,icon,cover,short_desc,full_desc,published) VALUES(?,?,?,?,?,?,?,?,?)")->execute([$slug,$title,$tag,$tagColor,$icon,$cover,$short,$full,$pub]);
    }
    log_action($id?'program_edit':'program_create','Program: '.$title);json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('programs');$db->prepare("DELETE FROM programs WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// EVENTS
if($resource==='events'){
  if($method==='GET'){$events=$db->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();foreach($events as &$e){$em=$db->prepare("SELECT id,type,url,position FROM event_media WHERE event_id=? ORDER BY position ASC");$em->execute([$e['id']]);$e['media']=$em->fetchAll();}json($events);}
  if($method==='POST'){require_perm('events');
    $title=$body['title']??'';if(!$title)json(['error'=>'Title required'],400);
    $date=$body['event_date']??$body['date']??null;
    $time=$body['event_time']??$body['time']??null;
    $loc=$body['location']??'';$status=$body['status']??'upcoming';$desc=$body['description']??'';
    $feat=$body['featured_image']??null;$slug=$body['slug']??null;
    $excerpt=$body['excerpt']??($desc?(function_exists('mb_substr')?mb_substr($desc,0,160):substr($desc,0,160)):'');
    if($id){
      $ex=$db->prepare("SELECT * FROM events WHERE id=?");$ex->execute([$id]);$ev=$ex->fetch();if(!$ev)json(['error'=>'Not found'],404);
      $db->prepare("UPDATE events SET title=?,event_date=?,event_time=?,location=?,status=?,description=?,excerpt=?,featured_image=?,slug=? WHERE id=?")->execute([$title,$date?:$ev['event_date'],$time?:$ev['event_time'],$loc?:$ev['location'],$status,$desc?:$ev['description'],$excerpt,$feat?:$ev['featured_image'],$slug?:$ev['slug'],$id]);
    }else{
      $db->prepare("INSERT INTO events(title,event_date,event_time,location,status,description,excerpt,featured_image,slug) VALUES(?,?,?,?,?,?,?,?,?)")->execute([$title,$date,$time,$loc,$status,$desc,$excerpt,$feat,$slug]);
      $id=$db->lastInsertId();
    }
    $media=$body['media']??[];if(is_array($media)){
      $db->prepare("DELETE FROM event_media WHERE event_id=?")->execute([$id]);
      $ins=$db->prepare("INSERT INTO event_media(event_id,type,url,position) VALUES(?,?,?,?)");
      foreach($media as $i=>$m){$ins->execute([$id,$m['type']??'image',$m['url']??'',$i]);
        if($i===0){$db->prepare("UPDATE events SET featured_image=? WHERE id=?")->execute([ltrim($m['url'],'/'),$id]);}
      }
    }
    log_action($id?'event_edit':'event_create','Event: '.$title);json(['ok'=>1,'id'=>$id]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('events');$db->prepare("DELETE FROM events WHERE id=?")->execute([$id]);json(['ok'=>1]);}
  if(is_numeric($id)&&$sub==='media'&&$method==='POST'){require_perm('events');
    $f=$_FILES['file']??null;$m=null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('file','events');}catch(Exception $e){json(['error'=>$e->getMessage()],400);}}
    if(!$m){$url=$body['url']??'';$type=$body['type']??(preg_match('/\.(mp4|webm|mov)/i',$url)?'video':'image');$m=['type'=>$type,'url'=>$url];}
    $pos=(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM event_media WHERE event_id=$id")->fetchColumn();
    $db->prepare("INSERT INTO event_media(event_id,type,url,position) VALUES(?,?,?,?)")->execute([$id,$m['type'],$m['url'],$pos]);
    log_action('event_media','Added media to event '.$id);json(['ok'=>1,'media'=>$m,'id'=>$db->lastInsertId()]);
  }
  if($id==='media'&&is_numeric($sub)&&$method==='DELETE'){require_perm('events');$db->prepare("DELETE FROM event_media WHERE id=?")->execute([$sub]);json(['ok'=>1]);}
}

// MEDIA
if($resource==='media'){
  if($method==='GET'){require_perm('photos');json($db->query("SELECT * FROM media_library ORDER BY created_at DESC")->fetchAll());}
  if($method==='POST'){require_perm('photos');
    $f=$_FILES['file']??null;$m=null;
    if($f&&$f['error']===UPLOAD_ERR_OK){try{$m=handle_upload('file',$_POST['subdir']??'images');}catch(Exception $e){json(['error'=>$e->getMessage()],400);}}
    if(!$m){json(['error'=>'Upload a file (URL input disabled; use local upload only)'],400);}
    $u=is_logged_in();
    $db->prepare("INSERT INTO media_library(title,category,type,url,uploaded_by,created_at) VALUES(?,?,?,?,?,NOW())")->execute([$_POST['title']??$body['title']??'Uploaded',$_POST['category']??$body['category']??'General',$m['type'],$m['url'],$u['id']??null]);
    log_action('media_upload','Uploaded '.$m['type'].' '.$m['url']);json(['ok'=>1,'id'=>$db->lastInsertId(),'media'=>$m]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('photos');$db->prepare("DELETE FROM media_library WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// NEC
if($resource==='nec'){
  if($method==='GET'){json($db->query("SELECT * FROM nec_members ORDER BY position ASC")->fetchAll());}
  if($method==='POST'){require_perm('nec');
    $name=$body['name']??null;$photo=$body['photo']??null;$grad=$body['gradient']??null;$icon=$body['icon']??null;$duty=$body['duty']??null;$pub=array_key_exists('published',$body)?(!empty($body['published'])?1:0):null;$pos=$body['position']??null;
    if($id){
      $ex=$db->prepare("SELECT * FROM nec_members WHERE id=?");$ex->execute([$id]);$cur=$ex->fetch();if(!$cur)json(['error'=>'Not found'],404);
      $role=$body['role_title']??$body['role']??$cur['role_title'];
      $db->prepare("UPDATE nec_members SET role_title=?,name=COALESCE(?,name),photo=COALESCE(?,photo),gradient=COALESCE(?,gradient),icon=COALESCE(?,icon),duty=COALESCE(?,duty),published=COALESCE(?,published),position=COALESCE(?,position) WHERE id=?")->execute([$role,$name,$photo,$grad,$icon,$duty,$pub,$pos,$id]);
    }else{
      $role=$body['role_title']??$body['role']??'';if(!$role)json(['error'=>'Role required'],400);
      $pos=$pos!==null?$pos:(int)$db->query("SELECT COALESCE(MAX(position),-1)+1 FROM nec_members")->fetchColumn();
      $db->prepare("INSERT INTO nec_members(position,role_title,name,photo,gradient,icon,duty,published) VALUES(?,?,?,?,?,?,?,?)")->execute([$pos,$role,$name??'',$photo,$grad??'from-azure-500 to-azure-700',$icon??'fa-star',$duty??'',$pub??1]);
    }
    log_action($id?'nec_edit':'nec_add','NEC: '.$role);json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){require_perm('nec');$db->prepare("DELETE FROM nec_members WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// DONATIONS
if($resource==='donations'){
  if($method==='GET'){require_perm('donations');json($db->query("SELECT * FROM donations ORDER BY created_at DESC")->fetchAll());}
  if(is_numeric($id)&&($sub==='verify'||$sub==='')&&$method==='POST'){
    $status=$body['status']??'verified';if(!in_array($status,['pending','verified','rejected']))json(['error'=>'Invalid status'],400);
    $db->prepare("UPDATE donations SET status=? WHERE id=?")->execute([$status,$id]);log_action('donation_verify',"Donation $id set to $status");json(['ok'=>1]);}
  if(is_numeric($id)&&$method==='DELETE'){$db->prepare("DELETE FROM donations WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// MEMBERS
if($resource==='members'){
  if($method==='GET'){require_perm('members');json($db->query("SELECT * FROM members ORDER BY created_at DESC")->fetchAll());}
  if($method==='POST'){require_perm('members');
    $name=$body['name']??'';if($id){$ex=$db->prepare("SELECT * FROM members WHERE id=?");$ex->execute([$id]);$m=$ex->fetch();if(!$m)json(['error'=>'Not found'],404);if(!$name)$name=$m['name'];
      $db->prepare("UPDATE members SET name=?,email=?,phone=?,state=?,tier=?,status=? WHERE id=?")->execute([$name,$body['email']??$m['email'],$body['phone']??$m['phone'],$body['state']??$m['state'],$body['tier']??$m['tier'],$body['status']??$m['status'],$id]);}
    else{if(!$name)json(['error'=>'Name required'],400);$db->prepare("INSERT INTO members(name,email,phone,state,tier,status,joined) VALUES(?,?,?,?,?,?,CURDATE())")->execute([$name,$body['email']??'',$body['phone']??'',$body['state']??'',$body['tier']??'Applicant',$body['status']??'pending']);}
    json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){$db->prepare("DELETE FROM members WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// MESSAGES
if($resource==='messages'){
  if($method==='GET'){require_perm('messages');json($db->query("SELECT * FROM messages ORDER BY created_at DESC")->fetchAll());}
  if((is_numeric($id)||(is_numeric($id)&&$sub==='read'))&&$method==='POST'){
    $mid=is_numeric($id)?$id:($sub==='read'?$id:$id);
    $read=isset($body['is_read'])?($body['is_read']?1:0):1;$db->prepare("UPDATE messages SET is_read=? WHERE id=?")->execute([$read,$mid]);log_action('message_read','Toggled message '.$mid);json(['ok'=>1]);
  }
  if(is_numeric($id)&&$method==='DELETE'){$db->prepare("DELETE FROM messages WHERE id=?")->execute([$id]);json(['ok'=>1]);}
}

// STATS
if($resource==='stats'){require_auth();
  json(['donations_total'=>(float)$db->query("SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='verified'")->fetchColumn(),'donations_pending'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='pending'")->fetchColumn(),'donations_count'=>(int)$db->query("SELECT COUNT(*) FROM donations WHERE status='verified'")->fetchColumn(),'members_active'=>(int)$db->query("SELECT COUNT(*) FROM members WHERE status='active'")->fetchColumn(),'events_upcoming'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='upcoming'")->fetchColumn(),'events_completed'=>(int)$db->query("SELECT COUNT(*) FROM events WHERE status='completed'")->fetchColumn(),'messages_unread'=>(int)$db->query("SELECT COUNT(*) FROM messages WHERE is_read=0")->fetchColumn(),'programs_published'=>(int)$db->query("SELECT COUNT(*) FROM programs WHERE published=1")->fetchColumn(),'media_count'=>(int)$db->query("SELECT COUNT(*) FROM media_library")->fetchColumn(),'monthly_donations'=>$db->query("SELECT DATE_FORMAT(created_at,'%Y-%m') as month,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12")->fetchAll(),'by_campaign'=>$db->query("SELECT campaign,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY campaign")->fetchAll(),'by_method'=>$db->query("SELECT method,SUM(amount) as total FROM donations WHERE status='verified' GROUP BY method")->fetchAll(),'activity'=>$db->query("SELECT al.id,al.user_id,al.action,al.detail,al.created_at,u.name as user_name FROM activity_log al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 30")->fetchAll()]);
}

// SETTINGS (key/value pairs like currency, maintenance). Supports both flat object and {key,value} single update.
if($resource==='settings'&&$method==='POST'){require_perm('settings');
  $pairs=$body;
  if(isset($body['key'])){$pairs=[$body['key']=>$body['value']];}
  foreach($pairs as $k=>$v){if(is_array($v)||is_object($v))$v=json_encode($v);
    $chk=$db->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
    if($chk->fetch())$db->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$v,$k]);
    else $db->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);}
  log_action('settings_edit','Updated settings');json(['ok'=>1]);
}
if($resource==='site'&&$id==='homepage'&&$method==='GET'){json(settings_all());}

json(['error'=>'Not found: '.$resource.'/'.$id,'path'=>$path],404);
