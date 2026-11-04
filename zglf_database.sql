-- ZGLF Database Export
-- Generated: 2026-11-02 23:33:26
-- PHP Version: 8.4.27

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS `zglf` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `zglf`;

DROP TABLE IF EXISTS `activity_log`;
CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `detail` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `activity_log` (`id`,`user_id`,`action`,`detail`,`created_at`) VALUES
('1','1','login','User logged in','2026-10-29 16:17:48'),
('2','1','login','User logged in','2026-10-29 16:18:12'),
('3','1','login','User logged in','2026-10-29 16:18:30'),
('4','1','login','User logged in','2026-10-29 16:18:31'),
('5','1','login','User logged in','2026-10-29 16:21:22'),
('6','1','login','User logged in','2026-10-29 16:21:22'),
('7','1','login','User logged in','2026-10-29 16:21:35'),
('8','1','login','User logged in','2026-10-29 16:21:42'),
('9','1','login','User logged in','2026-10-29 16:21:53'),
('10','1','login','User logged in','2026-10-29 16:21:54'),
('11','1','login','User logged in','2026-11-01 22:49:08'),
('12','1','login','User logged in','2026-11-01 22:49:53'),
('13','1','login','User logged in','2026-11-02 23:31:46'),
('14','1','login','User logged in','2026-11-02 23:32:11'),
('15','1','login','User logged in','2026-11-02 23:32:57'),
('16','1','login','User logged in','2026-11-02 23:33:15');

DROP TABLE IF EXISTS `donations`;
CREATE TABLE `donations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `donor` varchar(200) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `campaign` varchar(120) DEFAULT NULL,
  `method` varchar(60) DEFAULT 'Bank Transfer',
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `anonymous` tinyint(1) DEFAULT 0,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `donations` (`id`,`donor`,`email`,`amount`,`campaign`,`method`,`status`,`anonymous`,`note`,`created_at`) VALUES
('1','Hauwa Yusuf','hauwa@example.com','50000.00','Women Empowerment','Bank Transfer','verified','0','For the skills program','2026-08-01 00:00:00'),
('2','Anonymous Donor','','200000.00','General','Bank Transfer','verified','1','May Allah accept it','2026-09-10 00:00:00'),
('3','Ibrahim Lawal','ib@example.com','25000.00','Education','Cash','verified','0','Sponsoring one student','2026-09-20 00:00:00'),
('4','Fatima Bello','fatima@example.com','10000.00','Healthcare','Mobile Transfer','verified','0','','2026-10-01 00:00:00'),
('5','Demo Visitor','','25000.00','General','Bank Transfer','pending','1','Donation from public site','2026-10-28 00:00:00');

DROP TABLE IF EXISTS `event_media`;
CREATE TABLE `event_media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `type` enum('image','video') NOT NULL DEFAULT 'image',
  `url` varchar(500) NOT NULL,
  `position` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_media_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `event_media` (`id`,`event_id`,`type`,`url`,`position`) VALUES
('8','1','image','/events/food.jpg','0'),
('9','1','image','/images/humanitarian-food.jpg','1'),
('10','2','image','/events/medical.jpg','0'),
('11','2','image','/images/medical-outreach.jpg','1');

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(200) DEFAULT NULL,
  `status` enum('upcoming','completed','draft') DEFAULT 'upcoming',
  `description` text DEFAULT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `events` (`id`,`title`,`event_date`,`event_time`,`location`,`featured_image`,`slug`,`status`,`description`,`excerpt`,`created_at`,`updated_at`) VALUES
('1','Ramadan Food Distribution 2025','2025-03-15',NULL,'Gusau, Zamfara','events/food.jpg','ramadan-food-distribution','completed','Distributed food to 1,200 households across Gusau and environs during Ramadan, easing hardship for widows, orphans and low-income families.','1,200 households reached across Gusau during Ramadan.','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('2','Free Medical Outreach – Anka LGA','2025-08-10','09:00:00','Anka General Hospital','events/medical.jpg','medical-outreach-anka','completed','Partnered with volunteer doctors to provide free medical consultations, tests and medicines to 800 patients in Anka LGA.','Free medical consultations & medicines for 800 patients in Anka LGA.','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('3','ZGLF Skills Acquisition Graduation — Gusau, Sept 2026','2026-09-20','10:00:00','ZGLF Skills Centre, Gusau','events/graduation.jpg','skills-graduation-2026','upcoming','Graduating 150 women trained in tailoring, catering and bead-making at the ZGLF Gusau centre.','150 women graduate from six months of free vocational training at the ZGLF Gusau Skills Centre.','2026-10-29 16:17:47','2026-11-02 23:32:57');

DROP TABLE IF EXISTS `hero_slides`;
CREATE TABLE `hero_slides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` int(11) NOT NULL DEFAULT 0,
  `type` enum('image','video') NOT NULL DEFAULT 'image',
  `url` varchar(500) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `hero_slides` (`id`,`position`,`type`,`url`,`alt_text`,`caption`,`created_at`) VALUES
('1','0','image','/images/hero-children.jpg','Children learning','Education is the most powerful weapon which you can use to change the world.','2026-10-29 16:17:47'),
('2','1','image','/images/hero-community.jpg','Community gathering','Every child deserves a chance to learn.','2026-10-29 16:17:47'),
('3','2','image','/images/hero-volunteers.jpg','Volunteers','Together we build stronger communities.','2026-10-29 16:17:47'),
('4','3','image','/images/team-community.jpg','Team in community','Hope · Empowerment · Service.','2026-10-29 16:17:47');

DROP TABLE IF EXISTS `media_library`;
CREATE TABLE `media_library` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `category` varchar(80) DEFAULT 'General',
  `type` enum('image','video') NOT NULL DEFAULT 'image',
  `url` varchar(500) NOT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `media_library_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `media_library` (`id`,`title`,`category`,`type`,`url`,`uploaded_by`,`created_at`) VALUES
('1','Hero children','Hero','image','/images/hero-children.jpg',NULL,'2026-10-29 16:17:47'),
('2','Community gathering','Hero','image','/images/hero-community.jpg',NULL,'2026-10-29 16:17:47'),
('3','Volunteers','Hero','image','/images/hero-volunteers.jpg',NULL,'2026-10-29 16:17:47'),
('4','Scholarship awards','Education','image','/images/education-scholarship.jpg',NULL,'2026-10-29 16:17:47'),
('5','Youth training','Youth','image','/images/youth-empowerment.jpg',NULL,'2026-10-29 16:17:47'),
('6','Food distribution','Humanitarian','image','/images/humanitarian-food.jpg',NULL,'2026-10-29 16:17:47'),
('7','Medical outreach','Health','image','/images/medical-outreach.jpg',NULL,'2026-10-29 16:17:47'),
('8','Adult literacy class','Education','image','/images/literacy-class.jpg',NULL,'2026-10-29 16:17:47'),
('9','Entrepreneurship','Programs','image','/images/entrepreneurship.jpg',NULL,'2026-10-29 16:17:47'),
('10','Team & community','Programs','image','/images/team-community.jpg',NULL,'2026-10-29 16:17:47'),
('14','Ramadan Food Distribution 2025 – Gusau, Zamfara','Events','image','/events/food.jpg','1','2026-11-01 22:49:43'),
('15','Free Medical Outreach – Anka LGA, Zamfara','Events','image','/events/medical.jpg','1','2026-11-01 22:49:43'),
('16','ZGLF Skills Acquisition Graduation – Gusau Centre','Events','image','/events/graduation.jpg','1','2026-11-01 22:49:43'),
('17','Ramadan Food Distribution 2025 – Gusau, Zamfara','Events','image','/events/food.jpg','1','2026-11-02 23:28:07'),
('18','Free Medical Outreach – Anka LGA, Zamfara','Events','image','/events/medical.jpg','1','2026-11-02 23:28:07'),
('19','ZGLF Skills Acquisition Graduation – Gusau Centre','Events','image','/events/graduation.jpg','1','2026-11-02 23:28:07'),
('20','Uploaded','Test','image','/uploads/images/20261102_233315_91c0aa55.jpg','1','2026-11-02 23:33:15');

DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `state` varchar(80) DEFAULT NULL,
  `tier` varchar(60) DEFAULT 'Applicant',
  `status` enum('active','pending','inactive') DEFAULT 'pending',
  `joined` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `members` (`id`,`name`,`email`,`phone`,`state`,`tier`,`status`,`joined`,`created_at`) VALUES
('1','Aisha Bello','aisha@example.com','08030000001','Lagos','Gold','active','2026-03-01','2026-10-29 16:17:47'),
('2','Fatima Aliyu','fatima@example.com','08030000002','Zamfara','General','active','2026-05-12','2026-10-29 16:17:47'),
('3','Maryam Usman','maryam@example.com','08030000003','Kaduna','General','active','2026-07-22','2026-10-29 16:17:47'),
('4','Zainab Musa','zainab@example.com','08030000004','Zamfara','Applicant','pending','2026-10-15','2026-10-29 16:17:47'),
('5','Hadiza Usman','hadiza@example.com','08030000005','Sokoto','Applicant','pending','2026-10-29','2026-10-29 16:17:47');

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `source` varchar(40) DEFAULT 'contact',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `messages` (`id`,`name`,`email`,`subject`,`message`,`is_read`,`source`,`created_at`) VALUES
('1','Amina Sani','amina@example.com','Volunteer Enquiry','Assalamu alaykum. I would like to volunteer with the foundation.','0','contact','2026-10-28 10:00:00'),
('2','Garba Muhammad','garba@example.com','Zakat Question','I have a question about zakat distribution to widows.','0','contact','2026-10-28 14:30:00'),
('3','Yusuf Ali','yusuf@example.com','School Sponsorship','I want to nominate a child for school sponsorship.','0','contact','2026-10-29 09:15:00');

DROP TABLE IF EXISTS `nec_members`;
CREATE TABLE `nec_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_title` varchar(120) NOT NULL,
  `name` varchar(150) DEFAULT '',
  `photo` varchar(500) DEFAULT NULL,
  `gradient` varchar(80) DEFAULT 'from-azure-500 to-azure-700',
  `icon` varchar(80) DEFAULT 'fa-star',
  `duty` text DEFAULT NULL,
  `position` int(11) DEFAULT 0,
  `published` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `nec_members` (`id`,`role_title`,`name`,`photo`,`gradient`,`icon`,`duty`,`position`,`published`) VALUES
('1','President','','/images/nec-president.jpg','from-gold-400 to-gold-600','fa-crown','Presides over all meetings. Signs minutes and vouchers. A bank signatory.','0','1'),
('2','Vice President','','/images/nec-vice.jpg','from-azure-500 to-azure-700','fa-user-tie','Acts on behalf of the President. Bank signatory in the President\'s absence.','1','1'),
('3','Secretary General','','/images/nec-secretary.jpg','from-azure-500 to-azure-700','fa-pen-fancy','Handles correspondence, minutes, circulars, reports. A bank signatory.','2','1'),
('4','Assistant Secretary','','/images/nec-assistant.jpg','from-azure-500 to-azure-700','fa-file-signature','Assists the Secretary General.','3','1'),
('5','Treasurer','','/images/nec-treasurer.jpg','from-emerald-500 to-emerald-700','fa-sack-dollar','Custodian of finances. Deposits donations within 24 working hours. A bank signatory.','4','1'),
('6','Public Relations Officer','','/images/nec-pro.jpg','from-violet-500 to-violet-700','fa-bullhorn','Publicises matters and acts as intermediary with the public.','5','1'),
('7','Auditor','','/images/nec-auditor.jpg','from-rose-500 to-rose-700','fa-magnifying-glass-chart','Independently audits the foundation\'s accounts.','6','1'),
('8','Patrons / Matrons','','/images/nec-patron.jpg','from-gold-400 to-gold-600','fa-star','Respected elders — one per geopolitical zone (six total).','7','1');

DROP TABLE IF EXISTS `programs`;
CREATE TABLE `programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `tag` varchar(80) DEFAULT NULL,
  `tag_color` varchar(20) DEFAULT '#1a37b8',
  `icon` varchar(80) DEFAULT 'fa-star',
  `cover` varchar(500) DEFAULT NULL,
  `short_desc` text DEFAULT NULL,
  `full_desc` longtext DEFAULT NULL,
  `published` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `programs` (`id`,`title`,`slug`,`tag`,`tag_color`,`icon`,`cover`,`short_desc`,`full_desc`,`published`,`created_at`,`updated_at`) VALUES
('1','Education Scholarships','scholarship','Education','#1a37b8','fa-user-graduate','/images/education-scholarship.jpg','Scholarships, school supplies and bursaries for indigent children.','<p>Our scholarship program supports indigent children with school fees, books, uniforms and supplies.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('2','Skills Acquisition','skills','Youth','#8b5cf6','fa-hands-holding-child','/images/youth-empowerment.jpg','Vocational and ICT skills training for youths and women.','<p>Vocational training in tailoring, carpentry, welding, ICT, beauty therapy and more.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('3','Ramadan & Food Relief','relief','Humanitarian','#c9900d','fa-bowl-food','/images/humanitarian-food.jpg','Ramadan feeding and food distribution during crises.','<p>Annual Ramadan feeding and emergency food relief.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('4','Free Medical Outreach','medical','Health','#2e7d32','fa-kit-medical','/images/medical-outreach.jpg','Mobile medical camps for rural communities.','<p>Free medical consultations and medications.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('5','Adult Literacy Classes','literacy','Education','#1a37b8','fa-book-open-reader','/images/literacy-class.jpg','Reading, writing and numeracy classes for adults.','<p>Adult literacy classes across rural communities.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47'),
('6','Micro-Grant Scheme','microgrant','Entrepreneurship','#ef6c00','fa-lightbulb','/images/entrepreneurship.jpg','Small business grants for young entrepreneurs and women.','<p>Small capital grants with mentoring.</p>','1','2026-10-29 16:17:47','2026-10-29 16:17:47');

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `k` varchar(80) NOT NULL,
  `v` text DEFAULT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `site_settings` (`k`,`v`) VALUES
('address','Sabuwar Hanya, Tsamiyar Masaka Road, Tudun Wada, Gusau, Zamfara State'),
('contactEmail','info@zeeglowlink.org'),
('currency','NGN'),
('currencySymbol','₦'),
('email','info@zeeglowlink.org'),
('facebook',''),
('hero_body','Zee Glow Link Foundation (ZGLF) is a civil welfare organisation dedicated to youth empowerment, community development, education, and humanitarian service across Nigeria and beyond.'),
('hero_cta1','Support Our Mission'),
('hero_cta2','Get Involved'),
('hero_headline','Spreading <em>hope</em>, empowering <em>communities</em>, delivering <em>service</em>.'),
('hero_subhead','Registered civil welfare organisation · Gusau, Zamfara State'),
('hero_visionquote','To uphold unity, peace, excellence and sustainable development for a better world.'),
('hours','Mon–Fri: 9am–5pm'),
('instagram',''),
('key','currency'),
('maintenanceMode','0'),
('mission','To spread hope, empower communities, and deliver selfless service with integrity and compassion.'),
('motto','Hope · Empowerment · Service'),
('orgName','Zee Glow Link Foundation'),
('phone','+234'),
('shortName','ZGLF'),
('tagline','Spreading hope, empowering communities, delivering service.'),
('twitter',''),
('value','NGN'),
('vision','To uphold unity, peace, excellence and sustainable development for a better world.'),
('whatsapp','');

DROP TABLE IF EXISTS `user_tokens`;
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `user_tokens` (`id`,`user_id`,`token`,`expires_at`,`created_at`) VALUES
('1','1','45d57fc2a1ff13550f3641961c978d42658bd9818972c514d4b28a73f86ba4cc','2026-11-05 16:17:48','2026-10-29 16:17:48'),
('2','1','109d42ad3cc0acf638d067d788048200c58d48eb763ce3339d56bdcd6595be8d','2026-11-05 16:18:12','2026-10-29 16:18:12'),
('3','1','77e4482ebb70abfc0005f2250cfdfa4d1f3cda265cbc4a484176e39e99089fa2','2026-11-05 16:18:30','2026-10-29 16:18:30'),
('4','1','774f3bec9afe6404e60138aab85bce357d487525780d8277f8c70f02475c265a','2026-11-05 16:18:31','2026-10-29 16:18:31'),
('5','1','f07dbfda0a3a16d187502148b5ffab8fe92d8ca0fd2d70810e77931784fad82d','2026-11-05 16:21:22','2026-10-29 16:21:22'),
('6','1','278cf14fa88b5ca7c68310b3e197beed6477600401b05b8822efb11e3acaebb7','2026-11-05 16:21:22','2026-10-29 16:21:22'),
('7','1','8909865d93709f65b6e0c5ec211ac46cb4490367d1d66512e5c363404dad7d23','2026-11-05 16:21:35','2026-10-29 16:21:35'),
('8','1','95e1bb2d580313fd22adbdc92227705dc7e715154d9e0927e035f2588b45a2f7','2026-11-05 16:21:42','2026-10-29 16:21:42'),
('9','1','503c0da62f0bc8291bb6abcb7fd599bd22f5e096e2b9ffb2ff28e4bd6a48298d','2026-11-05 16:21:53','2026-10-29 16:21:53'),
('10','1','ab608d280f5636831e8a4677bea369bac4d9b05f4d7d29191ecb1f5b9f8ae4fe','2026-11-05 16:21:54','2026-10-29 16:21:54'),
('11','1','f1dcf1d734d21e4a4e338d03390e325eaee561e775305bf08c0c57fcf5edc6cd','2026-11-08 22:49:08','2026-11-01 22:49:08'),
('12','1','1b2833c683c943263cd105fe2454081f90ac20932a41d2c64c0faaaf226a2102','2026-11-08 22:49:53','2026-11-01 22:49:53'),
('13','1','bcbd94408c1f02cf4420d3362e56c91d7b1c3cd939d24e155f298e8a59cad877','2026-11-09 23:31:46','2026-11-02 23:31:46'),
('14','1','cb4413fe4099a220e2c9b599de4cb0a539e20abb14fb2275e158c10ba59374d2','2026-11-09 23:32:11','2026-11-02 23:32:11'),
('15','1','baa3850c46e8dfa5c43c0bc7f856a5d71392a08cf374947551255a58fd117529','2026-11-09 23:32:57','2026-11-02 23:32:57'),
('16','1','bec720e8c74950d439b140172ad84238c4b2a8778bb088538032d2bd0f686f2a','2026-11-09 23:33:15','2026-11-02 23:33:15');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'staff',
  `perms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`perms`)),
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `users` (`id`,`name`,`email`,`username`,`password_hash`,`role`,`perms`,`status`,`created_at`) VALUES
('1','Administrator','admin@zeeglowlink.org','admin','$2y$12$N9Amb5VhlABtA6EdNXPKzueNM8Aw0mCryYtANhL/aZEEkn9g264ny','admin','{\"dashboard\":1,\"hero\":1,\"site\":1,\"programs\":1,\"events\":1,\"donations\":1,\"photos\":1,\"nec\":1,\"members\":1,\"messages\":1,\"users\":1,\"reports\":1,\"settings\":1}','active','2026-10-29 16:17:47');

SET FOREIGN_KEY_CHECKS=1;
