<?php
// Database config — loads from .env.php if present, falls back to XAMPP defaults
$_envFile=__DIR__.'/.env.php';
$_env=file_exists($_envFile)?(require $_envFile):[];
define('DB_HOST', $_env['DB_HOST']??(getenv('DB_HOST')?:'localhost'));
define('DB_NAME', $_env['DB_NAME']??(getenv('DB_NAME')?:'zglf'));
define('DB_USER', $_env['DB_USER']??(getenv('DB_USER')?:'root'));
define('DB_PASS', $_env['DB_PASS']??(getenv('DB_PASS')??''));
define('UPLOAD_DIR', dirname(__DIR__).DIRECTORY_SEPARATOR.'uploads'.DIRECTORY_SEPARATOR);
define('UPLOAD_URL', null); // auto-detected
define('SITE_URL', '/');
define('JWT_SECRET', 'zglf_admin_secret_change_me_in_prod');

// Auto-detect upload URL (works in subfolders like /zglf/)
if(!defined('UPLOAD_URL_ACTIVE')){
  define('UPLOAD_URL_ACTIVE', true);
  $scriptDir = str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME']??''));
  // api/index.php lives under /api/; uploads/ is at project root
  $base = preg_replace('#/api.*$#','',$scriptDir);
  define('UPLOAD_URL_BASE', rtrim($base,'/').'/uploads/');
}
function upurl($path){return UPLOAD_URL_BASE.ltrim($path,'/');}

function db(){
  static $pdo=null;
  if($pdo)return $pdo;
  try{
    $pdo=new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',DB_USER,DB_PASS,[
      PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES=>false
    ]);
    return $pdo;
  }catch(PDOException $e){json(['error'=>'DB connection failed: '.$e->getMessage()],500);}
}

function json($data,$status=200){
  http_response_code($status);
  header('Content-Type: application/json');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  echo json_encode($data);
  exit;
}

function body(){return json_decode(file_get_contents('php://input'),true)?:[];}

function requirePost(){if($_SERVER['REQUEST_METHOD']==='OPTIONS'){json(['ok'=>1]);}if($_SERVER['REQUEST_METHOD']!=='POST'&&$_SERVER['REQUEST_METHOD']!=='GET'){json(['error'=>'Method not allowed'],405);}}

// Simple token auth: admin users have a token stored in users table + PHP sessions
session_start();

function is_logged_in(){
  // Check header token
  $headers=function_exists('getallheaders')?getallheaders():[];
  if(!$headers){
    $headers=[];
    foreach($_SERVER as $k=>$v){if(strpos($k,'HTTP_')===0){$key=str_replace(' ','-',ucwords(str_replace('_',' ',strtolower(substr($k,5)))));$headers[$key]=$v;}}
  }
  $token=$headers['Authorization']??'';
  if($token&&strpos($token,'Bearer ')===0){
    $t=str_replace('Bearer ','',$token);
    $stmt=db()->prepare("SELECT u.* FROM user_tokens t JOIN users u ON u.id=t.user_id WHERE t.token=? LIMIT 1");
    $stmt->execute([$t]);
    $u=$stmt->fetch();
    if($u)return $u;
  }
  if(!empty($_SESSION['user_id'])){
    $stmt=db()->prepare("SELECT * FROM users WHERE id=? AND status='active' LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
  }
  return null;
}

function require_auth(){
  $u=is_logged_in();
  if(!$u)json(['error'=>'Unauthorized'],401);
  return $u;
}

function can($perm){
  $u=require_auth();
  if($u['role']==='admin')return true;
  $perms=json_decode($u['perms']??'{}',true)?:[];
  return !empty($perms[$perm]);
}

function require_perm($perm){
  if(!can($perm))json(['error'=>'Forbidden'],403);
}

function random_token($len=48){return bin2hex(random_bytes($len/2));}

function settings_all(){static $cache=null;if($cache!==null)return $cache;$rows=db()->query("SELECT k,v FROM site_settings")->fetchAll();$cache=[];foreach($rows as $r)$cache[$r['k']]=$r['v'];return $cache;}
function setting($k,$default=null){$s=settings_all();return array_key_exists($k,$s)?$s[$k]:$default;}
function save_setting($k,$v){
  $chk=db()->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
  if($chk->fetch())db()->prepare("UPDATE site_settings SET v=? WHERE k=?")->execute([$v,$k]);
  else db()->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);
}

function handle_upload($field,$subdir='images',$allowed_images=['jpg','jpeg','png','webp','gif'],$allowed_videos=['mp4','webm','mov']){
  if(empty($_FILES[$field]))return null;
  $f=$_FILES[$field];
  if($f['error']!==UPLOAD_ERR_OK){
    $msgs=[UPLOAD_ERR_INI_SIZE=>'File too large (php.ini)',UPLOAD_ERR_FORM_SIZE=>'File too large (form)',UPLOAD_ERR_PARTIAL=>'Partial upload',UPLOAD_ERR_NO_FILE=>'No file',UPLOAD_ERR_NO_TMP_DIR=>'Missing temp folder',UPLOAD_ERR_CANT_WRITE=>'Cannot write to disk',UPLOAD_ERR_EXTENSION=>'Blocked by extension'];
    throw new Exception('Upload error: '.($msgs[$f['error']]??'code '.$f['error']));
  }
  $ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));
  $all=array_merge($allowed_images,$allowed_videos);
  if(!in_array($ext,$all))throw new Exception('File type not allowed: '.$ext);
  $is_video=in_array($ext,$allowed_videos);
  $dir=UPLOAD_DIR.$subdir.'/';
  if(!is_dir($dir)){if(!@mkdir($dir,0777,true))throw new Exception('Cannot create folder: '.$dir);}
  if(!is_writable($dir))throw new Exception('Upload folder not writable: '.$dir.'. Chmod it to 777.');
  $name=date('Ymd_His').'_'.bin2hex(random_bytes(4)).'.'.$ext;
  $path=$dir.$name;
  if(!move_uploaded_file($f['tmp_name'],$path))throw new Exception('Cannot save file to '.$dir.' (disk full or permission denied)');
  if(!$is_video&&function_exists('imagecreatefromjpeg')&&in_array($ext,$allowed_images)){
    try{@resize_image($path,$ext,1600);}catch(Exception $e){/* non-fatal */}
  }
  return ['type'=>$is_video?'video':'image','url'=>upurl($subdir.'/'.$name),'name'=>$f['name']];
}

function resize_image($path,$ext,$max_w){
  list($w,$h)=getimagesize($path);
  if($w<=$max_w)return;
  $ratio=$max_w/$w;
  $new_w=$max_w;$new_h=floor($h*$ratio);
  switch($ext){
    case'jpg':case'jpeg':$src=imagecreatefromjpeg($path);break;
    case'png':$src=imagecreatefrompng($path);break;
    case'webp':$src=imagecreatefromwebp($path);break;
    case'gif':return;
    default:return;
  }
  $dst=imagecreatetruecolor($new_w,$new_h);
  if($ext==='png'){imagealphablending($dst,false);imagesavealpha($dst,true);}
  imagecopyresampled($dst,$src,0,0,0,0,$new_w,$new_h,$w,$h);
  switch($ext){
    case'jpg':case'jpeg':imagejpeg($dst,$path,85);break;
    case'png':imagepng($dst,$path,7);break;
    case'webp':imagewebp($dst,$path,82);break;
  }
  imagedestroy($src);imagedestroy($dst);
}

// CORS preflight (web only)
if(php_sapi_name()!=='cli' && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD']==='OPTIONS'){json(['ok'=>1]);}
