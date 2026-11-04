<?php
require_once __DIR__.'/config.php';
$db=db();

$schema="
CREATE TABLE IF NOT EXISTS users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) UNIQUE,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  perms JSON NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_tokens(
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings(
  k VARCHAR(80) PRIMARY KEY,
  v TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hero_slides(
  id INT AUTO_INCREMENT PRIMARY KEY,
  position INT NOT NULL DEFAULT 0,
  type ENUM('image','video') NOT NULL DEFAULT 'image',
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  caption VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS programs(
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  tag VARCHAR(80),
  tag_color VARCHAR(20) DEFAULT '#1a37b8',
  icon VARCHAR(80) DEFAULT 'fa-star',
  cover VARCHAR(500),
  short_desc TEXT,
  full_desc LONGTEXT,
  published TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events(
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  event_date DATE,
  event_time TIME,
  location VARCHAR(255),
  status ENUM('upcoming','completed','draft') DEFAULT 'upcoming',
  description TEXT,
  excerpt VARCHAR(500),
  featured_image VARCHAR(500),
  slug VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_media(
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  type ENUM('image','video') NOT NULL DEFAULT 'image',
  url VARCHAR(500) NOT NULL,
  position INT DEFAULT 0,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS media_library(
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  category VARCHAR(80) DEFAULT 'General',
  type ENUM('image','video') NOT NULL DEFAULT 'image',
  url VARCHAR(500) NOT NULL,
  uploaded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS nec_members(
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_title VARCHAR(120) NOT NULL,
  name VARCHAR(150) DEFAULT '',
  photo VARCHAR(500),
  gradient VARCHAR(80) DEFAULT 'from-azure-500 to-azure-700',
  icon VARCHAR(80) DEFAULT 'fa-star',
  duty TEXT,
  position INT DEFAULT 0,
  published TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS donations(
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor VARCHAR(200) NOT NULL,
  email VARCHAR(190),
  amount DECIMAL(12,2) NOT NULL,
  campaign VARCHAR(120),
  method VARCHAR(60) DEFAULT 'Bank Transfer',
  status ENUM('pending','verified','rejected') DEFAULT 'pending',
  anonymous TINYINT(1) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS members(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190),
  phone VARCHAR(40),
  state VARCHAR(80),
  tier VARCHAR(60) DEFAULT 'Applicant',
  status ENUM('active','pending','inactive') DEFAULT 'pending',
  joined DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190),
  subject VARCHAR(255),
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  source VARCHAR(40) DEFAULT 'contact',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_log(
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(120) NOT NULL,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

foreach(array_filter(array_map('trim',explode(';',$schema)))as $stmt){
  try{$db->exec($stmt);}catch(PDOException $e){echo"Error: ".$e->getMessage()."\n";}
}
echo "Tables created.\n";

// Seed default admin
$hash=password_hash('admin123',PASSWORD_BCRYPT);
$allPerms=json_encode(['dashboard'=>1,'hero'=>1,'site'=>1,'programs'=>1,'events'=>1,'donations'=>1,'photos'=>1,'nec'=>1,'members'=>1,'messages'=>1,'users'=>1,'reports'=>1,'settings'=>1]);
$check=$db->query("SELECT id FROM users WHERE username='admin'")->fetch();
if(!$check){
  $db->prepare("INSERT INTO users(name,email,username,password_hash,role,perms,status) VALUES(?,?,?,?,?,?,?)")->execute(['Administrator','admin@zeeglowlink.org','admin',$hash,'admin',$allPerms,'active']);
  echo "Default admin created (admin / admin123)\n";
}else{
  // Ensure perms column is filled for existing admin
  $db->prepare("UPDATE users SET perms=? WHERE username='admin'")->execute([$allPerms]);
  echo "Admin already exists.\n";
}

// Seed default site settings
$defaults=[
  'orgName'=>'Zee Glow Link Foundation','shortName'=>'ZGLF','motto'=>'Hope · Empowerment · Service',
  'tagline'=>'Spreading hope, empowering communities, delivering service.',
  'vision'=>'To uphold unity, peace, excellence and sustainable development for a better world.',
  'mission'=>'To spread hope, empower communities, and deliver selfless service with integrity and compassion.',
  'address'=>'Sabuwar Hanya, Tsamiyar Masaka Road, Tudun Wada, Gusau, Zamfara State',
  'phone'=>'+234','email'=>'info@zeeglowlink.org','hours'=>'Mon–Fri: 9am–5pm',
  'facebook'=>'','twitter'=>'','instagram'=>'','whatsapp'=>'',
  'hero_headline'=>'Spreading <em>hope</em>, empowering <em>communities</em>, delivering <em>service</em>.',
  'hero_subhead'=>'Registered civil welfare organisation · Gusau, Zamfara State',
  'hero_visionquote'=>'To uphold unity, peace, excellence and sustainable development for a better world.',
  'hero_body'=>'Zee Glow Link Foundation (ZGLF) is a civil welfare organisation dedicated to youth empowerment, community development, education, and humanitarian service across Nigeria and beyond.',
  'hero_cta1'=>'Support Our Mission','hero_cta2'=>'Get Involved',
  'currency'=>'NGN','currencySymbol'=>'₦','contactEmail'=>'info@zeeglowlink.org','maintenanceMode'=>'0'
];
foreach($defaults as $k=>$v){
  $chk=$db->prepare("SELECT k FROM site_settings WHERE k=?");$chk->execute([$k]);
  if(!$chk->fetch()){$db->prepare("INSERT INTO site_settings(k,v) VALUES(?,?)")->execute([$k,$v]);}
}
echo "Default settings seeded.\n";

// Seed NEC members if empty
$necCount=$db->query("SELECT COUNT(*) FROM nec_members")->fetchColumn();
if($necCount==0){
  $nec=[
    ['President','','/images/nec-president.jpg','from-gold-400 to-gold-600','fa-crown','Presides over all meetings. Signs minutes and vouchers. A bank signatory.'],
    ['Vice President','','/images/nec-vice.jpg','from-azure-500 to-azure-700','fa-user-tie','Acts on behalf of the President. Bank signatory in the President\'s absence.'],
    ['Secretary General','','/images/nec-secretary.jpg','from-azure-500 to-azure-700','fa-pen-fancy','Handles correspondence, minutes, circulars, reports. A bank signatory.'],
    ['Assistant Secretary','','/images/nec-assistant.jpg','from-azure-500 to-azure-700','fa-file-signature','Assists the Secretary General.'],
    ['Treasurer','','/images/nec-treasurer.jpg','from-emerald-500 to-emerald-700','fa-sack-dollar','Custodian of finances. Deposits donations within 24 working hours. A bank signatory.'],
    ['Public Relations Officer','','/images/nec-pro.jpg','from-violet-500 to-violet-700','fa-bullhorn','Publicises matters and acts as intermediary with the public.'],
    ['Auditor','','/images/nec-auditor.jpg','from-rose-500 to-rose-700','fa-magnifying-glass-chart','Independently audits the foundation\'s accounts.'],
    ['Patrons / Matrons','','/images/nec-patron.jpg','from-gold-400 to-gold-600','fa-star','Respected elders — one per geopolitical zone (six total).']
  ];
  $stmt=$db->prepare("INSERT INTO nec_members(role_title,name,photo,gradient,icon,duty,position) VALUES(?,?,?,?,?,?,?)");
  foreach($nec as $i=>$n){$stmt->execute([$n[0],$n[1],$n[2],$n[3],$n[4],$n[5],$i]);}
  echo "NEC members seeded (8 positions).\n";
}

// Seed hero slides if empty
$hs=$db->query("SELECT COUNT(*) FROM hero_slides")->fetchColumn();
if($hs==0){
  $slides=[
    ['image','/images/hero-children.jpg','Children learning','Education is the most powerful weapon which you can use to change the world.'],
    ['image','/images/hero-community.jpg','Community gathering','Every child deserves a chance to learn.'],
    ['image','/images/hero-volunteers.jpg','Volunteers','Together we build stronger communities.'],
    ['image','/images/team-community.jpg','Team in community','Hope · Empowerment · Service.']
  ];
  $stmt=$db->prepare("INSERT INTO hero_slides(position,type,url,alt_text,caption) VALUES(?,?,?,?,?)");
  foreach($slides as $i=>$s){$stmt->execute([$i,$s[0],$s[1],$s[2],$s[3]]);}
  echo "Hero slides seeded.\n";
}

// Seed programs if empty
$pc=$db->query("SELECT COUNT(*) FROM programs")->fetchColumn();
if($pc==0){
  $programs=[
    ['scholarship','Education Scholarships','Education','#1a37b8','fa-user-graduate','/images/education-scholarship.jpg','Scholarships, school supplies and bursaries for indigent children.','<p>Our scholarship program supports indigent children with school fees, books, uniforms and supplies.</p>'],
    ['skills','Skills Acquisition','Youth','#8b5cf6','fa-hands-holding-child','/images/youth-empowerment.jpg','Vocational and ICT skills training for youths and women.','<p>Vocational training in tailoring, carpentry, welding, ICT, beauty therapy and more.</p>'],
    ['relief','Ramadan & Food Relief','Humanitarian','#c9900d','fa-bowl-food','/images/humanitarian-food.jpg','Ramadan feeding and food distribution during crises.','<p>Annual Ramadan feeding and emergency food relief.</p>'],
    ['medical','Free Medical Outreach','Health','#2e7d32','fa-kit-medical','/images/medical-outreach.jpg','Mobile medical camps for rural communities.','<p>Free medical consultations and medications.</p>'],
    ['literacy','Adult Literacy Classes','Education','#1a37b8','fa-book-open-reader','/images/literacy-class.jpg','Reading, writing and numeracy classes for adults.','<p>Adult literacy classes across rural communities.</p>'],
    ['microgrant','Micro-Grant Scheme','Entrepreneurship','#ef6c00','fa-lightbulb','/images/entrepreneurship.jpg','Small business grants for young entrepreneurs and women.','<p>Small capital grants with mentoring.</p>']
  ];
  $stmt=$db->prepare("INSERT INTO programs(slug,title,tag,tag_color,icon,cover,short_desc,full_desc,published) VALUES(?,?,?,?,?,?,?,?,1)");
  foreach($programs as $p){$stmt->execute($p);}
  echo "Programs seeded.\n";
}

// Seed media library if empty
$mc=$db->query("SELECT COUNT(*) FROM media_library")->fetchColumn();
if($mc==0){
  $media=[
    ['Hero children','Hero','image','/images/hero-children.jpg'],
    ['Community gathering','Hero','image','/images/hero-community.jpg'],
    ['Volunteers','Hero','image','/images/hero-volunteers.jpg'],
    ['Scholarship awards','Education','image','/images/education-scholarship.jpg'],
    ['Youth training','Youth','image','/images/youth-empowerment.jpg'],
    ['Food distribution','Humanitarian','image','/images/humanitarian-food.jpg'],
    ['Medical outreach','Health','image','/images/medical-outreach.jpg'],
    ['Adult literacy class','Education','image','/images/literacy-class.jpg'],
    ['Entrepreneurship','Programs','image','/images/entrepreneurship.jpg'],
    ['Team & community','Programs','image','/images/team-community.jpg']
  ];
  $stmt=$db->prepare("INSERT INTO media_library(title,category,type,url) VALUES(?,?,?,?)");
  foreach($media as $m)$stmt->execute($m);
  echo "Media library seeded.\n";
}

echo "\nSetup complete.\n";
