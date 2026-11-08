<?php
/**
 * ZGLF Server Diagnostic — open /zglf/diag.php in browser after install.
 * If any row shows FAIL, follow the fix shown.
 */
echo "<h2>ZGLF Server Diagnostics</h2><pre>";
function chk($label,$ok,$fix=''){
  echo ($ok?"[OK] ":"[FAIL] ").$label."\n";
  if(!$ok&&$fix)echo "       FIX: $fix\n";
  return $ok;
}
$ok=true;
$ok&=chk("PHP version >= 8.0",version_compare(PHP_VERSION,'8.0','>='),"Upgrade PHP to 8.0+");
$ok&=chk("PDO + MySQL extension",extension_loaded('pdo')&&extension_loaded('pdo_mysql'),"Enable pdo_mysql in php.ini");
$ok&=chk("GD extension (image resize)",extension_loaded('gd'),"Enable php-gd for image uploads");
$mods=function_exists('apache_get_modules')?apache_get_modules():[];
$rewrite=in_array('mod_rewrite',$mods);
$ok&=chk("Apache mod_rewrite enabled",$rewrite||!function_exists('apache_get_modules'),"Enable mod_rewrite in httpd.conf (uncomment LoadModule rewrite_module)");
$ht=__DIR__.'/.htaccess';
$ok&=chk(".htaccess exists",file_exists($ht),"Copy .htaccess from the repo into your install folder");
$uploads=__DIR__.'/uploads';
$ok&=chk("uploads/ folder exists",is_dir($uploads),"Create the uploads/ folder");
$ok&=chk("uploads/ folder writable",is_writable($uploads),'Chmod uploads/ to 777');
foreach(['images','events','videos','nec','programs'] as $d){
  $p=$uploads.'/'.$d;if(!is_dir($p))@mkdir($p,0777,true);
  $ok&=chk("uploads/$d/ writable",is_writable($p),"Create and chmod 777 uploads/$d/");
}
// Test DB
try{
  $env=require __DIR__.'/api/.env.php';
  $db=new PDO('mysql:host='.($env['DB_HOST']??'localhost').';dbname='.($env['DB_NAME']??'zglf').';charset=utf8mb4',$env['DB_USER']??'root',$env['DB_PASS']??'');
  $ok&=chk("Database connection",true);
  $r=$db->query("SELECT COUNT(*) FROM site_settings")->fetchColumn();
  $ok&=chk("site_settings table has rows ($r)",$r>0,"Run install.php again");
}catch(Exception $e){
  chk("Database connection",false,$e->getMessage());$ok=false;
}
// Test API routing
$api=__DIR__.'/api/index.php';
$ok&=chk("api/index.php exists",file_exists($api),"Re-pull the repo");
// Test rewrite simulation
$self=$_SERVER['REQUEST_URI']??'';
echo "\nCurrent URL: $self\n";
echo "Install dir: ".__DIR__."\n";
echo "</pre>";
echo $ok?"<h3 style='color:green'>All checks passed.</h3>":"<h3 style='color:red'>Some checks failed — see FIX lines above.</h3>";
echo "<p><a href='install.php'>Run install.php</a> | <a href='admin/'>Go to Admin</a> | <a href='./'>View site</a></p>";
