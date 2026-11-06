-- ZGLF Database Export
-- Generated: 2026-11-06 23:23:31
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `activity_log` (`id`,`user_id`,`action`,`detail`,`created_at`) VALUES
('1','1','login','User logged in','2026-11-06 23:22:29'),
('2','1','login','User logged in','2026-11-06 23:22:29'),
('3','1','login','User logged in','2026-11-06 23:22:45'),
('4','1','login','User logged in','2026-11-06 23:22:45'),
('5',NULL,'login','User logged in','2026-11-06 23:22:46'),
('6',NULL,'login','User logged in','2026-11-06 23:22:46'),
('7','1','login','User logged in','2026-11-06 23:22:47'),
('8','1','login','User logged in','2026-11-06 23:22:47'),
('9','1','login','User logged in','2026-11-06 23:22:48'),
('10','1','login','User logged in','2026-11-06 23:22:48'),
('11','1','login','User logged in','2026-11-06 23:23:15'),
('12','1','login','User logged in','2026-11-06 23:23:15'),
('13',NULL,'login','User logged in','2026-11-06 23:23:16'),
('14',NULL,'login','User logged in','2026-11-06 23:23:16'),
('15','1','login','User logged in','2026-11-06 23:23:17'),
('16','1','login','User logged in','2026-11-06 23:23:17'),
('17','1','login','User logged in','2026-11-06 23:23:18'),
('18','1','login','User logged in','2026-11-06 23:23:18');

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
('5','Test Donor','td@example.com','1000.00','General','Bank Transfer','pending','0','','2026-11-06 23:22:28'),
('6','Test Donor','td@example.com','1000.00','General','Bank Transfer','pending','0','','2026-11-06 23:22:45'),
('7','Test Donor','td@example.com','1000.00','General','Bank Transfer','pending','0','','2026-11-06 23:23:15');

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `event_media` (`id`,`event_id`,`type`,`url`,`position`) VALUES
('1','1','image','/events/food.jpg','0'),
('2','2','image','/events/medical.jpg','0');

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` enum('upcoming','completed','draft') DEFAULT 'upcoming',
  `description` text DEFAULT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `events` (`id`,`title`,`event_date`,`event_time`,`location`,`status`,`description`,`excerpt`,`featured_image`,`slug`,`created_at`,`updated_at`) VALUES
('1','Ramadan Food Distribution 2025','2025-03-15',NULL,'Gusau, Zamfara','completed','Distributed food to 1,200 households across Gusau during Ramadan.','1,200 households reached across Gusau.','events/food.jpg','ramadan-food-distribution','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('2','Free Medical Outreach – Anka LGA','2025-08-10','09:00:00','Anka General Hospital','completed','Provided free medical consultations and medicines to 800 patients.','Free consultations & medicines for 800 patients in Anka LGA.','events/medical.jpg','medical-outreach-anka','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('3','Skills Acquisition Graduation 2026 (edited)','2026-09-20',NULL,'ZGLF Centre, Gusau','upcoming','Updated by test','Updated by test',NULL,NULL,'2026-11-06 23:22:15','2026-11-06 23:22:46'),
('4','Test Event Auto (edited)','2026-12-01',NULL,'Gusau','upcoming','Updated by test','Updated by test',NULL,NULL,'2026-11-06 23:22:46','2026-11-06 23:23:16'),
('5','Test Event Auto','2026-12-01','10:00:00','Gusau','upcoming','Automated test event','Test excerpt','events/food.jpg',NULL,'2026-11-06 23:23:16','2026-11-06 23:23:16');

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
('1','0','image','/images/hero-children.jpg','Children learning','Education is the most powerful weapon which you can use to change the world.','2026-11-06 23:22:15'),
('2','1','image','/images/hero-community.jpg','Community gathering','Every child deserves a chance to learn.','2026-11-06 23:22:15'),
('3','2','image','/images/hero-volunteers.jpg','Volunteers','Together we build stronger communities.','2026-11-06 23:22:15'),
('4','3','image','/images/team-community.jpg','Team in community','Hope · Empowerment · Service.','2026-11-06 23:22:15');

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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `media_library` (`id`,`title`,`category`,`type`,`url`,`uploaded_by`,`created_at`) VALUES
('1','Hero children','Hero','image','/images/hero-children.jpg',NULL,'2026-11-06 23:22:15'),
('2','Community gathering','Hero','image','/images/hero-community.jpg',NULL,'2026-11-06 23:22:15'),
('3','Volunteers','Hero','image','/images/hero-volunteers.jpg',NULL,'2026-11-06 23:22:15'),
('4','Scholarship awards','Education','image','/images/education-scholarship.jpg',NULL,'2026-11-06 23:22:15'),
('5','Youth training','Youth','image','/images/youth-empowerment.jpg',NULL,'2026-11-06 23:22:15'),
('6','Food distribution','Humanitarian','image','/images/humanitarian-food.jpg',NULL,'2026-11-06 23:22:15'),
('7','Medical outreach','Health','image','/images/medical-outreach.jpg',NULL,'2026-11-06 23:22:15'),
('8','Adult literacy class','Education','image','/images/literacy-class.jpg',NULL,'2026-11-06 23:22:15'),
('9','Entrepreneurship','Programs','image','/images/entrepreneurship.jpg',NULL,'2026-11-06 23:22:15'),
('10','Team & community','Programs','image','/images/team-community.jpg',NULL,'2026-11-06 23:22:15'),
('11','Ramadan Food Distribution 2025','Events','image','/events/food.jpg','1','2026-11-06 23:22:15'),
('12','Free Medical Outreach','Events','image','/events/medical.jpg','1','2026-11-06 23:22:15'),
('13','Skills Acquisition Graduation','Events','image','/events/graduation.jpg','1','2026-11-06 23:22:15');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `members` (`id`,`name`,`email`,`phone`,`state`,`tier`,`status`,`joined`,`created_at`) VALUES
('1','Aisha Bello','aisha@example.com','08030000001','Lagos','Gold','active','2026-03-01','2026-11-06 23:22:15'),
('2','Fatima Aliyu','fatima@example.com','08030000002','Zamfara','General','active','2026-05-12','2026-11-06 23:22:15'),
('3','Test Applicant','maryam@example.com','08030000003','Kaduna','General','active','2026-07-22','2026-11-06 23:22:15'),
('4','Test Applicant','ta@example.com','08099999999','Zamfara','Applicant','pending','2026-11-06','2026-11-06 23:22:28'),
('5','Test Applicant','ta@example.com','08099999999','Zamfara','Applicant','pending','2026-11-06','2026-11-06 23:22:45'),
('6','Test Applicant','ta@example.com','08099999999','Zamfara','Applicant','pending','2026-11-06','2026-11-06 23:23:15');

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
('1','Amina Sani','amina@example.com','Volunteer Enquiry','I would like to volunteer.','0','contact','2026-11-06 23:22:15'),
('2','Garba Muhammad','garba@example.com','Zakat Question','Question about zakat distribution.','1','contact','2026-11-06 23:22:15'),
('3','Test','t@example.com','Hi','test contact','0','contact','2026-11-06 23:22:28'),
('4','Test','t@example.com','Hi','test contact','0','contact','2026-11-06 23:22:45'),
('5','Test','t@example.com','Hi','test contact','0','contact','2026-11-06 23:23:15');

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
('1','','Test NEC Name','/images/nec-president.jpg','from-azure-500 to-azure-700','fa-star','','0','0'),
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
('1','Education Scholarships','education-scholarships','Test','#1a37b8','fa-book-open','/images/education-scholarship.jpg','','','1','2026-11-06 23:22:15','2026-11-06 23:22:46'),
('2','Skills Acquisition','skills','Youth','#8b5cf6','fa-hands-holding-child','/images/youth-empowerment.jpg','Vocational and ICT skills training for youths and women.','<p>Vocational training in tailoring, carpentry, welding, ICT, beauty therapy and more.</p>','1','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('3','Ramadan & Food Relief','relief','Humanitarian','#c9900d','fa-bowl-food','/images/humanitarian-food.jpg','Ramadan feeding and food distribution during crises.','<p>Annual Ramadan feeding and emergency food relief.</p>','1','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('4','Free Medical Outreach','medical','Health','#2e7d32','fa-kit-medical','/images/medical-outreach.jpg','Mobile medical camps for rural communities.','<p>Free medical consultations and medications.</p>','1','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('5','Adult Literacy Classes','literacy','Education','#1a37b8','fa-book-open-reader','/images/literacy-class.jpg','Reading, writing and numeracy classes for adults.','<p>Adult literacy classes across rural communities.</p>','1','2026-11-06 23:22:15','2026-11-06 23:22:15'),
('6','Micro-Grant Scheme','microgrant','Entrepreneurship','#ef6c00','fa-lightbulb','/images/entrepreneurship.jpg','Small business grants for young entrepreneurs and women.','<p>Small capital grants with mentoring.</p>','1','2026-11-06 23:22:15','2026-11-06 23:22:15');

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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `user_tokens` (`id`,`user_id`,`token`,`expires_at`,`created_at`) VALUES
('1','1','d49d04388f1f02f77dd92e21c1776bf1597fc2f8daa56c083e9fe65a51e56354','2026-11-13 23:22:29','2026-11-06 23:22:29'),
('2','1','2c38a7528f51f0ae74e1b837307cb7572000b572bf2279d6d0620cfe28ab6863','2026-11-13 23:22:29','2026-11-06 23:22:29'),
('3','1','01378a403a4bcc5914d6a13674b70743e74670dc57187028d5a11d668833aad6','2026-11-13 23:22:45','2026-11-06 23:22:45'),
('4','1','59bd74d3bd2b4b24e34b74a7d187a04d6f04c82f1353613d8af3c65d8c215a84','2026-11-13 23:22:45','2026-11-06 23:22:45'),
('7','1','b09e1639aeb46a949fbc756659c0c28eaaac82618dc794335be9bdbd827d0f54','2026-11-13 23:22:47','2026-11-06 23:22:47'),
('8','1','04970ac9cb28641273852c6a5bc6b2e7e9562d9867748ea7c7007cbf441243b6','2026-11-13 23:22:47','2026-11-06 23:22:47'),
('9','1','881c689905ee6a66673dc5d37ecaa3f68d697bbc3f75be2596053d7d2e3183f2','2026-11-13 23:22:48','2026-11-06 23:22:48'),
('10','1','cb29dcde41f3fd94be0b35b22003a559da931d9dcb397de6ca8ae14c64727bd3','2026-11-13 23:22:48','2026-11-06 23:22:48'),
('11','1','dd83c705aef5df1e1b4e7dc9abbf6319933eebc13083fd80fd72da3fc0590d0e','2026-11-13 23:23:15','2026-11-06 23:23:15'),
('12','1','f785fe77f31962a12cf135205f84b9013796802622119b3483358ad0f6fe54a2','2026-11-13 23:23:15','2026-11-06 23:23:15'),
('15','1','f6556e5a30d3f20c0c2f345bb6e674ebc6f8c44988748d9b59e9374d432a0e2b','2026-11-13 23:23:17','2026-11-06 23:23:17'),
('16','1','3eef3828260d669193aac1146ee514b108661e9faa3e29292070d32f2959458a','2026-11-13 23:23:17','2026-11-06 23:23:17'),
('17','1','aee00bc6f0fb580b384e6bf3b71199857af31ff8f6fa17b921e608e006cb7bac','2026-11-13 23:23:18','2026-11-06 23:23:18'),
('18','1','b7d38e5d7e0648b3ed5002ed3a08145cc40e0f4d302aadb130b7099ca59f5d1f','2026-11-13 23:23:18','2026-11-06 23:23:18');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff','editor','viewer') NOT NULL DEFAULT 'staff',
  `perms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`perms`)),
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `users` (`id`,`name`,`email`,`username`,`password_hash`,`role`,`perms`,`status`,`created_at`) VALUES
('1','Administrator','admin@zeeglowlink.org','admin','$2y$12$zZdPcgKET1dR4I3/DwH2TedHX/WSR63Mx5ha40OtiQbgOEG6V3ACa','admin','{\"dashboard\":1,\"hero\":1,\"site\":1,\"programs\":1,\"events\":1,\"donations\":1,\"photos\":1,\"nec\":1,\"members\":1,\"messages\":1,\"users\":1,\"reports\":1,\"settings\":1}','active','2026-11-06 23:22:15');

SET FOREIGN_KEY_CHECKS=1;
