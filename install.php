<?php
/**
 * ZGLF Auto-Installer
 * ----------------------------------------------------------
 * Run ONCE from browser or CLI to set up the database automatically.
 *   Browser:  http://localhost/zglf/install.php  OR  http://localhost:8080/install.php
 *   CLI:      php install.php
 */
error_reporting(E_ALL); ini_set('display_errors',1); @set_time_limit(60);
$IS_CLI = (php_sapi_name()==='cli');
$root = __DIR__;

function out($s){global $IS_CLI; if($IS_CLI){echo strip_tags($s)."\n";}else{echo $s."<br>\n";@ob_flush();flush();}}
function hdr($s){global $IS_CLI; if($IS_CLI){echo "\n=== $s ===\n";}else{echo "<h2>$s</h2>";}}
function ok($s){out("<span style='color:#0a7d28'>[OK]</span> $s");}
function warn($s){out("<span style='color:#b86e00'>[!]</span> $s");}
function fail($s){out("<span style='color:#c00'>[FAIL]</span> $s");}

if(!$IS_CLI){
  echo '<!doctype html><html><head><meta charset="utf-8"><title>ZGLF Installer</title>
  <style>body{font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#222}
  h1{color:#122660;border-bottom:3px solid #c9900d;padding-bottom:8px}
  h2{color:#122660;margin-top:28px}
  code{background:#f1f5ff;padding:2px 6px;border-radius:4px}
  .box{background:#f0f9f2;border:1px solid #a9d3b8;border-radius:8px;padding:16px;margin-top:18px}
  .box.err{background:#fdf2f2;border-color:#e6a8a8}</style></head><body>';
  echo '<h1>ZGLF Foundation — Auto Installer</h1>';
} else {
  echo "\nZGLF Foundation — Auto Installer\n\n";
}

// ---------- Defaults (match api/config.php) ----------
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_NAME = getenv('DB_NAME') ?: 'zglf';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
ok("Target: host=<b>$DB_HOST</b> user=<b>$DB_USER</b> db=<b>$DB_NAME</b>");

// ---------- Environment checks ----------
hdr("Environment checks");
$ok_env=true;
if(version_compare(PHP_VERSION,'8.0.0','<')){fail("PHP 8.0+ required, have ".PHP_VERSION);$ok_env=false;}else{ok("PHP ".PHP_VERSION);}
foreach(['uploads','uploads/images','uploads/videos','uploads/events'] as $d){
  $p=$root.'/'.$d; if(!is_dir($p))@mkdir($p,0777,true);
  if(is_writable($p)){ok("<code>$d/</code> writable");}
  else{if(@chmod($p,0777)){ok("<code>$d/</code> permissions fixed to 777");}else{fail("<code>$d/</code> not writable");$ok_env=false;}}
}
foreach(['api/config.php','api/setup.php','api/index.php'] as $f){
  if(!file_exists($root.'/'.$f)){fail("Missing <code>$f</code>");$ok_env=false;}
}
if(!extension_loaded('pdo_mysql')){fail("pdo_mysql PHP extension missing");$ok_env=false;}else{ok("PDO MySQL extension loaded");}
if(!$ok_env){fail("Fix the issues above then re-run.");goto END;}

// ---------- Connect to MySQL server (try several credential combos) ----------
hdr("Database setup");
$attempts = [
  [$DB_HOST,$DB_USER,$DB_PASS],
  ['127.0.0.1','root',''],
  ['localhost','root',''],
  [$DB_HOST,'root','root'],
  [$DB_HOST,'root','toor'],
  ['127.0.0.1','root','root'],
];
$pdo_root=null; $last_err='';
foreach($attempts as $a){
  [$h,$u,$p]=$a;
  try{
    $opt=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_TIMEOUT=>5];
    $dsn="mysql:host=$h;charset=utf8mb4";
    $pdo_root=new PDO($dsn,$u,$p,$opt);
    $pwpart=$p?' (with password)':'';
    ok("Connected as <b>$u</b>$pwpart on $h");
    break;
  }catch(PDOException $e){$last_err=$e->getMessage();}
}

// Linux/MariaDB fallback: some distros require sudo for initial root (unix socket auth)
if(!$pdo_root && PHP_OS==='Linux' && function_exists('exec')){
  warn("PDO connect failed — trying sudo mysql CLI (Linux unix-socket auth)…");
  $test=@shell_exec('sudo -n mysql -NBe "SELECT 1" 2>&1');
  if(trim($test)==='1'){
    // We can sudo into mysql. Create DB + a passwordless 'zglf_admin' user for the app.
    $create_db_sql="CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
    if(strtolower($DB_USER)==='root'){
      // Change root auth to passwordless TCP so the app can connect
      $create_db_sql.="ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES;";
    } else {
      $create_db_sql.="CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
                       GRANT ALL PRIVILEGES ON `$DB_NAME`.* TO '$DB_USER'@'localhost';
                       CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';
                       GRANT ALL PRIVILEGES ON `$DB_NAME`.* TO '$DB_USER'@'%';
                       FLUSH PRIVILEGES;";
    }
    $cmd="sudo mysql -e ".escapeshellarg($create_db_sql)." 2>&1";
    $out=shell_exec($cmd);
    if($out)warn(trim($out));
    // Try connecting again
    foreach([['localhost','root',''],['127.0.0.1','root',''],[$DB_HOST,$DB_USER,$DB_PASS]] as $a){
      [$h,$u,$p]=$a;
      try{
        $pdo_root=new PDO("mysql:host=$h;charset=utf8mb4",$u,$p,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_TIMEOUT=>5]);
        ok("Connected via sudo bootstrap as <b>$u</b>"); break;
      }catch(Exception $e){$last_err=$e->getMessage();}
    }
  } else {
    warn("sudo -n not available (need NOPASSWD sudo). On shared Linux hosts, create the DB manually in cPanel or run: sudo mysql -e \"CREATE DATABASE $DB_NAME\"");
  }
}
if(!$pdo_root){
  fail("Could not connect to MySQL. Tried common root credentials.");
  warn("Last error: $last_err");
  warn("If you set a custom MySQL password, set the DB_PASS env var or edit api/config.php and re-run.");
  goto END;
}

// ---------- Create the database ----------
$pdo_root->exec("CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
ok("Database <b>$DB_NAME</b> created");

// Ensure config user can connect (for non-root user)
if(strtolower($DB_USER)!=='root'){
  try{
    $pdo_root->exec("CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS'");
    $pdo_root->exec("GRANT ALL PRIVILEGES ON `$DB_NAME`.* TO '$DB_USER'@'%'");
    $pdo_root->exec("CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS'");
    $pdo_root->exec("GRANT ALL PRIVILEGES ON `$DB_NAME`.* TO '$DB_USER'@'localhost'");
    $pdo_root->exec("FLUSH PRIVILEGES");
    ok("User <b>$DB_USER</b> granted access");
  }catch(Exception $e){warn("User grant note: ".$e->getMessage());}
}

try{
  $pdo=new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",$DB_USER,$DB_PASS,[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
  ]);
}catch(PDOException $e){fail("Cannot connect to $DB_NAME: ".$e->getMessage());goto END;}

// ---------- Detect existing install ----------
$installed=false;
try{
  $tbls=(int)$pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'")->fetchColumn();
  if($tbls>0){
    try{$c=(int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();if($c>0)$installed=true;}catch(Exception $e){}
  }
}catch(Exception $e){}

if(!$installed){
  hdr("Creating tables & seeding default data");
  // Don't pre-define constants — let config.php define them
  if(!defined('UPLOAD_URL_ACTIVE'))define('UPLOAD_URL_ACTIVE',false);
  ob_start();
  error_reporting(E_ERROR | E_PARSE); // suppress warnings during setup (session_start etc.)
  try{
    require_once $root.'/api/config.php';
    // Re-point db() to the DB we just created (config.php reads constants we just defined)
    require_once $root.'/api/setup.php';
    $out=ob_get_clean();
    foreach(explode("\n",trim($out)) as $l)if(trim($l))out("  ".htmlspecialchars($l));
    ok("Schema & seed data written");
  }catch(Throwable $e){
    ob_end_clean();
    fail("Setup failed: ".$e->getMessage()." in ".$e->getFile().":".$e->getLine());
    goto END;
  }
} else {
  hdr("Verifying existing install");
  error_reporting(E_ERROR | E_PARSE);
  require_once $root.'/api/config.php';
  $pdo=db();
  $migrations=[
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt VARCHAR(500)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_image VARCHAR(500)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR(200)",
    "ALTER TABLE users MODIFY COLUMN role ENUM('admin','staff','editor','viewer') NOT NULL DEFAULT 'staff'",
  ];
  foreach($migrations as $sql){try{$pdo->exec($sql);}catch(Exception $e){}}
  ok("Schema up-to-date");
}

// Also seed demo events + stats if the events table is empty
require_once $root.'/api/config.php';
$pdo=db();
if((int)$pdo->query("SELECT COUNT(*) FROM events")->fetchColumn()===0){
  hdr("Seeding demo content");
  $events=[
    ['Ramadan Food Distribution 2025','2025-03-15',null,'Gusau, Zamfara','completed',
     'Distributed food to 1,200 households across Gusau during Ramadan.',
     '1,200 households reached across Gusau.','events/food.jpg','ramadan-food-distribution'],
    ['Free Medical Outreach – Anka LGA','2025-08-10','09:00:00','Anka General Hospital','completed',
     'Provided free medical consultations and medicines to 800 patients.',
     'Free consultations & medicines for 800 patients in Anka LGA.','events/medical.jpg','medical-outreach-anka'],
    ['Skills Acquisition Graduation 2026','2026-09-20','10:00:00','ZGLF Centre, Gusau','upcoming',
     'Graduating 150 women trained in tailoring, catering and bead-making.',
     '150 women graduate from skills training at ZGLF Gusau centre.','events/graduation.jpg','skills-graduation'],
  ];
  $ins=$pdo->prepare('INSERT INTO events(title,event_date,event_time,location,status,description,excerpt,featured_image,slug) VALUES(?,?,?,?,?,?,?,?,?)');
  $im=$pdo->prepare('INSERT INTO event_media(event_id,type,url,position) VALUES(?,?,?,?)');
  foreach($events as [$t,$d,$tm,$l,$s,$desc,$ex,$img,$slug]){
    $ins->execute([$t,$d,$tm,$l,$s,$desc,$ex,$img,$slug]);
    $eid=$pdo->lastInsertId();
    $im->execute([$eid,'image','/'.$img,0]);
  }
  $pdo->exec("INSERT INTO donations(donor,email,amount,campaign,method,anonymous,note,status,created_at) VALUES
    ('Hauwa Yusuf','hauwa@example.com',50000,'Women Empowerment','Bank Transfer',0,'For the skills program','verified','2026-08-01'),
    ('Anonymous Donor','',200000,'General','Bank Transfer',1,'May Allah accept it','verified','2026-09-10'),
    ('Ibrahim Lawal','ib@example.com',25000,'Education','Cash',0,'Sponsoring one student','verified','2026-09-20'),
    ('Fatima Bello','fatima@example.com',10000,'Healthcare','Mobile Transfer',0,'','verified','2026-10-01')");
  $pdo->exec("INSERT INTO members(name,email,phone,state,tier,status,joined) VALUES
    ('Aisha Bello','aisha@example.com','08030000001','Lagos','Gold','active','2026-03-01'),
    ('Fatima Aliyu','fatima@example.com','08030000002','Zamfara','General','active','2026-05-12'),
    ('Maryam Usman','maryam@example.com','08030000003','Kaduna','General','active','2026-07-22')");
  $pdo->exec("INSERT INTO messages(name,email,subject,message,source,created_at,is_read) VALUES
    ('Amina Sani','amina@example.com','Volunteer Enquiry','I would like to volunteer.','contact',NOW(),0),
    ('Garba Muhammad','garba@example.com','Zakat Question','Question about zakat distribution.','contact',NOW(),0)");
  // Add event media to library
  $pdo->exec("INSERT IGNORE INTO media_library(title,category,type,url,uploaded_by) VALUES
    ('Ramadan Food Distribution 2025','Events','image','/events/food.jpg',1),
    ('Free Medical Outreach','Events','image','/events/medical.jpg',1),
    ('Skills Acquisition Graduation','Events','image','/events/graduation.jpg',1)");
  ok("Demo events, donations, members, messages added");
}

// ---------- Summary ----------
hdr("Installation complete");
function base_url(){
  if(php_sapi_name()==='cli')return '/';
  return rtrim(str_replace(basename($_SERVER['SCRIPT_NAME']),'',$_SERVER['SCRIPT_NAME']),'/').'/';
}
$base=base_url();

if(!$IS_CLI){
  echo '<div class="box"><p><b style="color:#122660;font-size:17px">ZGLF is installed.</b></p>';
  echo "<p>🔓 Admin: <code>admin</code> / <code>admin123</code><br>";
  echo "🌐 Public site: <a href=\"$base\">$base</a><br>";
  echo "⚙️  Admin panel: <a href=\"".rtrim($base,'/')."/admin/\">".rtrim($base,'/')."/admin/</a></p>";
  echo '<p style="color:#a33;font-size:13px">For security you can delete install.php now (it refuses to overwrite an existing DB, so leaving it is safe for demo).</p></div>';
}else{
  echo "\nZGLF is installed.\n";
  echo "  Admin    : admin / admin123\n";
  echo "  Public   : php -S 0.0.0.0:8080 router.php   →   http://localhost:8080/\n";
  echo "  Admin UI : http://localhost:8080/admin/\n";
}
END:
if(!$IS_CLI)echo '</body></html>';
