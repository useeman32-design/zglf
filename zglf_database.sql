/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: zglf
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-0+deb13u1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(64) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES
(1,1,'user_create','Created user editor1','2026-11-07 19:31:44'),
(2,1,'settings_edit','Updated settings','2026-11-07 19:31:44'),
(3,1,'program_edit','Program: Education & Literacy','2026-11-07 19:31:44'),
(4,1,'event_edit','Event: Test Event Auto','2026-11-07 19:31:44'),
(5,1,'event_edit','Event: ZGLF Official Launch (edited)','2026-11-07 19:31:44'),
(6,1,'nec_edit','NEC: National President','2026-11-07 19:31:44'),
(7,1,'media_upload','Uploaded image /uploads/images/20261107_193144_849fbcee.jpg','2026-11-07 19:31:44'),
(8,1,'media_upload','Uploaded image /uploads/images/20261107_193144_3cd7d706.jpg','2026-11-07 19:31:44'),
(9,1,'donation_verify','Donation 1 set to verified','2026-11-07 19:31:44'),
(10,1,'message_read','Toggled message 1','2026-11-07 19:31:44'),
(11,1,'password_change','Changed own password','2026-11-07 19:31:45'),
(12,1,'password_change','Changed own password','2026-11-07 19:31:45');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `donor` varchar(128) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `campaign` varchar(64) DEFAULT 'General',
  `method` varchar(64) DEFAULT NULL,
  `anonymous` tinyint(4) DEFAULT 0,
  `note` text DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `donations` WRITE;
/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
INSERT INTO `donations` VALUES
(1,'Test Donor','td@example.com',1000.00,'General','Bank Transfer',0,'','verified','2026-11-07 19:31:43');
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `event_media`
--

DROP TABLE IF EXISTS `event_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) DEFAULT NULL,
  `type` enum('image','video') DEFAULT 'image',
  `url` varchar(512) DEFAULT NULL,
  `position` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_media_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_media`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `event_media` WRITE;
/*!40000 ALTER TABLE `event_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_media` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(128) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` varchar(32) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') DEFAULT 'upcoming',
  `description` text DEFAULT NULL,
  `excerpt` text DEFAULT NULL,
  `featured_image` varchar(512) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES
(1,'launch','ZGLF Official Launch (edited)','2026-01-15','10:00','Gusau, Zamfara','upcoming','Updated by test','Updated by test',NULL,'2026-11-07 19:31:43'),
(2,NULL,'Test Event Auto','2026-12-01','10:00','Gusau','upcoming','Automated test event','Test excerpt','events/food.jpg','2026-11-07 19:31:44');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `hero_slides`
--

DROP TABLE IF EXISTS `hero_slides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hero_slides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` int(11) DEFAULT 0,
  `type` enum('image','video') DEFAULT 'image',
  `url` varchar(512) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hero_slides`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `hero_slides` WRITE;
/*!40000 ALTER TABLE `hero_slides` DISABLE KEYS */;
/*!40000 ALTER TABLE `hero_slides` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `media_library`
--

DROP TABLE IF EXISTS `media_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_library` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(64) DEFAULT NULL,
  `type` enum('image','video') DEFAULT 'image',
  `url` varchar(512) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_library`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `media_library` WRITE;
/*!40000 ALTER TABLE `media_library` DISABLE KEYS */;
INSERT INTO `media_library` VALUES
(1,'Auto-test upload','General','image','/uploads/images/20261107_193144_849fbcee.jpg',1,'2026-11-07 19:31:44'),
(2,'Auto-test upload','General','image','/uploads/images/20261107_193144_3cd7d706.jpg',1,'2026-11-07 19:31:44');
/*!40000 ALTER TABLE `media_library` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `state` varchar(64) DEFAULT NULL,
  `tier` varchar(64) DEFAULT 'Applicant',
  `status` enum('pending','active','suspended') DEFAULT 'pending',
  `joined` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES
(1,'Test Applicant','ta@example.com','08099999999','Zamfara','Applicant','active','2026-11-07','2026-11-07 19:31:43');
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `source` varchar(32) DEFAULT 'contact',
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES
(1,'Test','t@example.com','Hi','test contact','contact',1,'2026-11-07 19:31:43');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `nec_members`
--

DROP TABLE IF EXISTS `nec_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nec_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` int(11) DEFAULT 0,
  `role_title` varchar(128) DEFAULT NULL,
  `name` varchar(128) DEFAULT NULL,
  `photo` varchar(512) DEFAULT NULL,
  `gradient` varchar(64) DEFAULT 'from-azure-500 to-azure-700',
  `icon` varchar(64) DEFAULT 'fa-star',
  `duty` text DEFAULT NULL,
  `published` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nec_members`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `nec_members` WRITE;
/*!40000 ALTER TABLE `nec_members` DISABLE KEYS */;
INSERT INTO `nec_members` VALUES
(1,0,'National President','Test NEC Name',NULL,'from-azure-600 to-blue-800','fa-crown','Presides over all NEC meetings and provides strategic leadership.',1),
(2,1,'Vice President','',NULL,'from-sky-500 to-azure-600','fa-hands-helping','Assists the President and acts in their absence.',1),
(3,2,'National Secretary','',NULL,'from-gold-500 to-yellow-600','fa-pen-fancy','Keeps records, correspondence, and minutes of all meetings.',1),
(4,3,'Deputy National Secretary','',NULL,'from-amber-500 to-orange-600','fa-file-alt','Assists the Secretary and handles specific delegated duties.',1),
(5,4,'National Treasurer','',NULL,'from-green-500 to-emerald-600','fa-coins','Manages all funds, accounts, and financial records of the Foundation.',1),
(6,5,'Financial Secretary','',NULL,'from-teal-500 to-cyan-600','fa-calculator','Prepares budgets, financial reports, and fundraising plans.',1),
(7,6,'National Publicity Secretary','',NULL,'from-rose-500 to-red-600','fa-bullhorn','Handles media, communications, and public image.',1),
(8,7,'National Welfare Officer','',NULL,'from-pink-500 to-rose-600','fa-heart','Oversees member welfare and humanitarian outreach.',1);
/*!40000 ALTER TABLE `nec_members` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(128) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `tag` varchar(64) DEFAULT NULL,
  `tag_color` varchar(16) DEFAULT '#1a37b8',
  `icon` varchar(64) DEFAULT 'fa-star',
  `cover` varchar(512) DEFAULT NULL,
  `short_desc` text DEFAULT NULL,
  `full_desc` text DEFAULT NULL,
  `published` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
INSERT INTO `programs` VALUES
(1,'-ducation-iteracy','Education & Literacy','Test','#1a37b8','fa-book-open',NULL,'Updated by automated test','<p>Test content</p>',1),
(2,'healthcare','Healthcare Access','Health','#22c55e','fa-heartbeat',NULL,'Providing free medical outreach, maternal health, and disease prevention in rural communities.',NULL,1),
(3,'empowerment','Economic Empowerment','Empowerment','#d4a84b','fa-hands-usd',NULL,'Skills acquisition, micro-grants, and women/youth cooperative programs.',NULL,1),
(4,'humanitarian','Humanitarian Aid','Humanitarian','#ef4444','fa-hands-helping',NULL,'Emergency relief for displaced persons, flood victims, and vulnerable families.',NULL,1);
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `k` varchar(64) NOT NULL,
  `v` text DEFAULT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES
('about_body','<p>Zee Glow Link Foundation (ZGLF) is a registered non-governmental organization dedicated to empowering marginalized communities across Nigeria.</p>'),
('about_cta','Learn Our Story'),
('about_title','About Zee Glow Link Foundation'),
('accent_color','#d4a84b'),
('bankAccounts','[]'),
('currency','NGN'),
('currencySymbol','₦'),
('donationNote','Every donation makes a difference. Thank you for supporting Zee Glow Link Foundation.'),
('donationTitle','Support Our Mission'),
('email','info@zeeglowlink.org'),
('facebook','#'),
('favicon_url','images/favicon.png'),
('footerAbout','<p><strong>Zee Glow Link Foundation</strong> — a registered Nigerian NGO dedicated to empowering communities across Nigeria through education, healthcare, economic empowerment, and humanitarian aid.</p>'),
('footerCopyright','© 2026 Zee Glow Link Foundation. All rights reserved.'),
('hero_cta1','Donate Now'),
('hero_cta2','Join Us'),
('hq_address','Gusau, Zamfara State, Nigeria'),
('instagram','#'),
('linkedin','#'),
('logo_url','images/zglf-logo.png'),
('maintenanceMode','0'),
('mission_body','<p>To empower and uplift...</p>'),
('mission_title','Our Mission'),
('nav_donate','1'),
('nav_login','1'),
('org_type','NGO • Registered in Nigeria'),
('paystackEnabled','0'),
('paystackKey',''),
('paystackSecret',''),
('phone','+234 803 000 0000'),
('pillars_body','Our work is anchored on four pillars that reflect our constitution and mission.'),
('pillars_title','Our Four Pillars'),
('primary_color','#1a37b8'),
('site_name','Zee Glow Link Foundation'),
('site_tagline','Empowering communities across Nigeria'),
('twitter','#'),
('values_body','<p>Integrity, Service...</p>'),
('values_title','Our Values'),
('vision_body','<p>A Nigeria...</p>'),
('vision_title','Our Vision'),
('youtube','#');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_tokens`
--

DROP TABLE IF EXISTS `user_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `token` varchar(128) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_tokens` WRITE;
/*!40000 ALTER TABLE `user_tokens` DISABLE KEYS */;
INSERT INTO `user_tokens` VALUES
(1,1,'3f24965b4e9d66156ebc56482efdf41af1ab14cb5cfd7476','2026-11-07 19:31:43'),
(2,1,'7c1c8358c347fd0ca44c2db8023e7c14b45e8391139981c1','2026-11-07 19:31:43'),
(3,2,'172cb91e556e16564d4751be20bdd78c1a460d4887ca89d3','2026-11-07 19:31:44'),
(4,2,'c89f4aac516feab306074bfcb4d96692d873086f36c2cfe9','2026-11-07 19:31:44'),
(5,1,'c145faffd978528d598a1eaa647d4c81f3e1cffbee2d1867','2026-11-07 19:31:45'),
(6,1,'6fb2f9b838554627012b4974b3eeb734ad0ba2d5ed1a16ba','2026-11-07 19:31:45'),
(7,1,'772ebe653d4938f0f66ca30cd5422f955e5ea03dd2e128b0','2026-11-07 19:31:46'),
(8,1,'b95f1a49fd236848efe8eff5c4b3f19d46c1922c21824236','2026-11-07 19:31:46');
/*!40000 ALTER TABLE `user_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','editor','staff') DEFAULT 'staff',
  `perms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`perms`)),
  `status` enum('active','disabled') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','Administrator','admin@zglf.org','$2y$12$fcI74QGFhWiaogqkeYHM9OKfmwQguB7HnwZ4KFGPxE9BHl09aYTBW','admin','{\"dashboard\":1,\"hero\":1,\"site\":1,\"footer\":1,\"donations\":1,\"programs\":1,\"events\":1,\"photos\":1,\"nec\":1,\"members\":1,\"messages\":1,\"users\":1,\"reports\":1,\"settings\":1}','active','2026-11-07 19:31:43'),
(2,'editor1','editor1','ed@zglf.ng','$2y$12$/c8XLXztwSNfl/WS4uTO3O5.7kf3q3CvnDUHvwwuhNI1Nrd3sMnX.','editor','{\"dashboard\":1,\"programs\":1,\"events\":1,\"hero\":0,\"nec\":0,\"photos\":0,\"donations\":0,\"members\":0,\"messages\":1,\"users\":0,\"site\":0,\"settings\":0,\"reports\":0}','active','2026-11-07 19:31:44');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-11-07 19:31:52
