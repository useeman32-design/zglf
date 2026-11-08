<?php
/**
 * ZGLF Admin Debug Panel — open /zglf/debug.php in browser.
 * Shows live DB state so we can see if saves actually land.
 */
header('Content-Type:text/html; charset=utf-8');
echo "<!DOCTYPE html><html><head><title>ZGLF Debug</title><style>
body{font-family:system-ui,sans-serif;padding:20px;max-width:900px;margin:auto;background:#f8fafc}
h2{color:#1a37b8;border-bottom:2px solid #f5c842;padding-bottom:8px}
pre{background:#fff;border:1px solid #e2e8f0;padding:12px;border-radius:8px;overflow:auto;max-height:300px}
.ok{color:#10b981;font-weight:bold}.bad{color:#ef4444;font-weight:bold}
table{width:100%;border-collapse:collapse;background:#fff;margin:10px 0}
td,th{padding:8px;border:1px solid #e2e8f0;text-align:left;font-size:13px}
th{background:#1a37b8;color:#fff}
</style></head><body><h1>ZGLF Debug Panel</h1>";
require __DIR__.'/api/config.php';
$db=db();

function row($label,$ok,$detail=''){echo "<tr><td>$label</td><td class=\"".($ok?'ok':'bad')."\">".($ok?'OK':'FAIL')."</td><td>$detail</td></tr>";}

echo "<h2>Environment</h2><table>";
row("PHP",true,PHP_VERSION);
row("mod_rewrite",function_exists('apache_get_modules')?in_array('mod_rewrite',apache_get_modules()):true,"OK (built-in server or unknown)");
row("uploads/ writable",is_writable(__DIR__.'/uploads'),is_writable(__DIR__.'/uploads')?'':'Chmod 777 uploads/');
row("GD extension",extension_loaded('gd'),extension_loaded('gd')?'':'Enable gd in php.ini');
echo "</table>";

echo "<h2>Auth Test</h2><pre>";
// Try a login
$ch=false;
$ctx=stream_context_create(['http'=>['method'=>'POST','header'=>"Content-Type: application/json\r\n",'content'=>json_encode(['username'=>'admin','password'=>'admin123'])]]);
$login=@file_get_contents('http'.(isset($_SERVER['HTTPS'])?'s':'').'://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['SCRIPT_NAME']).'/api/index.php/auth/login',false,$ctx);
if($login){
  $j=json_decode($login,true);
  echo "Login response: ";var_dump(isset($j['token'])?'TOKEN OK (length='.strlen($j['token']).')':'LOGIN FAILED: '.$login);
  $token=$j['token']??'';
  if($token){
    // Test /api/site GET
    $opts=['http'=>['method'=>'GET','header'=>"Authorization: Bearer $token\r\n"]];
    $ctx2=stream_context_create($opts);
    $site=@file_get_contents('http'.(isset($_SERVER['HTTPS'])?'s':'').'://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['SCRIPT_NAME']).'/api/index.php/site',false,$ctx2);
    echo "\n/api/site GET status: ".($site?'OK ('.strlen($site).' bytes)':'FAILED');
    if($site){
      $s=json_decode($site,true);
      echo "\n  footerAbout = ".htmlspecialchars(substr($s['footerAbout']??'(empty)',0,100));
      echo "\n  bankAccounts = ".json_encode($s['bankAccounts']??'NONE');
      echo "\n  hero_headline = ".htmlspecialchars(substr($s['hero_headline']??'(empty)',0,100));
      echo "\n  orgName = ".htmlspecialchars($s['orgName']??'(empty)');
    }
    // Test /api/content GET (public)
    $content=@file_get_contents('http'.(isset($_SERVER['HTTPS'])?'s':'').'://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['SCRIPT_NAME']).'/api/index.php/content');
    echo "\n\n/api/content (public) size: ".($content?strlen($content).' bytes':'FAILED');
    if($content){
      $c=json_decode($content,true);
      echo "\n  donation.bankAccounts count: ".count($c['donation']['bankAccounts']??[]);
      echo "\n  nec count: ".count($c['nec']??[]);
      echo "\n  programs count: ".count($c['programs']??[]);
      echo "\n  hero slides count: ".count($c['hero']['slides']??[]);
      echo "\n  footer about (first 80): ".htmlspecialchars(substr($c['footer']['about']??'(empty)',0,80));
    }
  }
}else{
  echo "Login request to /api/index.php/auth/login FAILED. ";
  echo "Try visiting: ".dirname($_SERVER['SCRIPT_NAME'])."/api/index.php/auth/login directly — it should return JSON, not a 404.";
}
echo "</pre>";

echo "<h2>DB Contents — site_settings</h2><table><tr><th>Key</th><th>Value (first 80 chars)</th></tr>";
foreach($db->query("SELECT k,v FROM site_settings ORDER BY k")as$r){
  echo "<tr><td>".htmlspecialchars($r['k'])."</td><td>".htmlspecialchars(substr($r['v'],0,80)).(strlen($r['v'])>80?'...':'')."</td></tr>";
}
echo "</table>";

echo "<h2>DB Contents — programs</h2><table><tr><th>ID</th><th>Title</th><th>Cover</th><th>Short</th></tr>";
foreach($db->query("SELECT * FROM programs ORDER BY id")as$r){
  echo "<tr><td>{$r['id']}</td><td>".htmlspecialchars($r['title'])."</td><td>".htmlspecialchars($r['cover']??'(none)')."</td><td>".htmlspecialchars(substr($r['short_desc']??'',0,80))."</td></tr>";
}
echo "</table>";

echo "<h2>DB Contents — nec_members</h2><table><tr><th>ID</th><th>Role</th><th>Name</th><th>Photo</th></tr>";
foreach($db->query("SELECT * FROM nec_members ORDER BY position")as$r){
  echo "<tr><td>{$r['id']}</td><td>".htmlspecialchars($r['role_title'])."</td><td>".htmlspecialchars($r['name']?:'(vacant)')."</td><td>".htmlspecialchars($r['photo']??'(none)')."</td></tr>";
}
echo "</table>";

echo "<h2>DB Contents — events</h2><table><tr><th>ID</th><th>Title</th><th>Featured</th><th>Media count</th></tr>";
foreach($db->query("SELECT e.*, (SELECT COUNT(*) FROM event_media WHERE event_id=e.id) as mc FROM events e ORDER BY event_date DESC")as$r){
  echo "<tr><td>{$r['id']}</td><td>".htmlspecialchars($r['title'])."</td><td>".htmlspecialchars($r['featured_image']??'(none)')."</td><td>{$r['mc']}</td></tr>";
}
echo "</table>";

echo "<h2>Direct URL Tests (click them)</h2><ul>";
$b=dirname($_SERVER['SCRIPT_NAME']);
echo "<li><a href='$b/api/index.php/content' target='_blank'>$b/api/index.php/content</a> (should show JSON)</li>";
echo "<li><a href='$b/api/index.php/site' target='_blank'>$b/api/index.php/site</a> (requires auth — will show {\"error\":\"Unauthorized\"})</li>";
echo "<li><a href='$b/api/index.php/programs' target='_blank'>$b/api/index.php/programs</a> (should show JSON array)</li>";
echo "<li><a href='$b/images/nec-president.jpg' target='_blank'>$b/images/nec-president.jpg</a> (should show image)</li>";
echo "</ul>";

echo "<p style='margin-top:30px;color:#64748b;font-size:12px'>If any of the Direct URL Tests return 404, Apache is not serving PHP files at that path.</p>";
echo "</body></html>";
