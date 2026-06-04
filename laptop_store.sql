-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: laptop_store
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `recipient_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `fk_address_user` (`user_id`),
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Địa chỉ giao hàng của khách';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,1,'Nguyễn Văn A','0901111111','123 Lê Lợi','Phường Bến Nghé','Quận 1','TP.HCM',1,'2026-04-13 13:35:58'),(2,1,'Nguyễn Văn A','0901111111','456 Nguyễn Huệ','Phường Bến Thành','Quận 1','TP.HCM',0,'2026-04-13 13:35:58'),(3,2,'Trần Thị B','0902222222','789 Trần Hưng Đạo','Phường Cầu Kho','Quận 5','TP.HCM',1,'2026-04-13 13:35:58'),(4,1,'Nguyễn Test User','0901234567','12 Nguyễn Trãi','Thanh Xuân Trung','Thanh Xuân','Hà Nội',1,'2026-04-20 22:35:59'),(5,2,'Trần Demo User','0987654321','56 Lê Văn Việt','Hiệp Phú','Quận 9','TP.HCM',1,'2026-04-20 22:35:59'),(6,11,'Vũ Xuân Hùng','0379297817','Tp. Vĩnh Yên','aaa','aa','Vĩnh Phúc',1,'2026-04-22 17:12:42'),(7,6,'Vũ Xuân Hùng','0379297817','Tp. Vĩnh Yên',NULL,'Ngô Quyền','Vĩnh Phúc',1,'2026-05-14 22:00:10'),(8,14,'Vũ Xuân Hùng','0379297817','Tp. Vĩnh Yên','aaa','Ngô Quyền','Vĩnh Phúc',1,'2026-05-27 21:03:27');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_otps`
--

DROP TABLE IF EXISTS `auth_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_otps` (
  `otp_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash mã OTP (không lưu plain text)',
  `purpose` enum('REGISTER','RESET_PASSWORD','VERIFY_EMAIL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`),
  KEY `idx_otp_email_purpose` (`email`,`purpose`),
  KEY `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã OTP gửi qua email';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_otps`
--

LOCK TABLES `auth_otps` WRITE;
/*!40000 ALTER TABLE `auth_otps` DISABLE KEYS */;
INSERT INTO `auth_otps` VALUES (1,'vuhung220224@gmail.com','$2a$10$emVj9Nuwkp5SE7iLKfDKQeG9U37/ZRHTG2DUo8H6Q.aYyVioIeItm','RESET_PASSWORD','2026-05-14 21:35:38','2026-05-14 21:26:51','2026-05-14 21:25:38'),(2,'vuhung220224@gmail.com','$2a$10$ee2djvDwoPXbRd/yt/ljLO0nT4gZXYdLCOGlgkuo9u8C6bFLGmPf.','RESET_PASSWORD','2026-05-14 21:36:51','2026-05-14 21:31:31','2026-05-14 21:26:51'),(3,'vuhung220224@gmail.com','$2a$10$pxrvuGAyUQiIJtZXPJtnv.jtj1Xbpfsd6UuJ.6Ib/JKM7SiGXK7se','RESET_PASSWORD','2026-05-14 21:41:31','2026-05-14 21:33:27','2026-05-14 21:31:31'),(4,'vuhung220224@gmail.com','$2a$10$OvE3djKSeEW7aXKJxXDo7e8PKLX3zvc7snKw.DfuqzA32crBjgArC','RESET_PASSWORD','2026-05-14 21:43:27','2026-05-14 21:48:42','2026-05-14 21:33:27'),(5,'vuhung220224@gmail.com','$2a$10$sjPtFuWdaL46VUfvWpSrq.qXhns7q1/EGlyCk2v4E7Pgkh9uGolxi','RESET_PASSWORD','2026-05-14 21:58:42','2026-05-14 21:51:38','2026-05-14 21:48:42'),(6,'vuhung220224@gmail.com','$2a$10$1QrdvcjchubrKoqzlA0lMeuwDwNgUJv.9n1oY1NU3gwS/gwg3EBiu','RESET_PASSWORD','2026-05-14 22:01:38','2026-05-14 21:54:22','2026-05-14 21:51:38'),(7,'vuhung220224@gmail.com','$2a$10$0eq1R/3bw.p0KxtrmBwg.uSGXk0cN3sB4aiahGQUZKM063F4D8mA.','RESET_PASSWORD','2026-05-14 22:04:22','2026-05-14 21:55:43','2026-05-14 21:54:22'),(8,'vuhung220224@gmail.com','$2a$10$w5MxJHlHe/Dji.KbN50vNugYpRF1RMsBZvHg6RWWTMqhD0u41FfGO','RESET_PASSWORD','2026-05-14 22:05:43','2026-05-14 21:57:35','2026-05-14 21:55:43'),(9,'vuhung220224@gmail.com','$2a$10$UhamZaN1AWR2bFaWLcvMY.NDUEHODG2gNRMs1dX6rYtz2/5BY4vky','RESET_PASSWORD','2026-05-14 22:07:36','2026-05-14 21:58:25','2026-05-14 21:57:36'),(10,'vuhung220224@gmail.com','$2a$10$/6xIkSPMLCIVHCsgF4r5GO.9Bg6r07dShTGMfVhHxU8YEdUAB6XZ6','RESET_PASSWORD','2026-05-14 22:08:26','2026-05-14 21:58:44','2026-05-14 21:58:26'),(11,'vuhung220224@gmail.com','$2a$10$6JwmdzzLHq6MWkvTCn9LkeAEV/BhwHcasOwF2dOw9mOW6h06I0WCu','RESET_PASSWORD','2026-05-22 11:43:34','2026-05-22 11:34:02','2026-05-22 11:33:34');
/*!40000 ALTER TABLE `auth_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `brand_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `website` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`brand_id`),
  UNIQUE KEY `uq_brand_name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `uq_brand_slug` (`slug`),
  KEY `idx_brand_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thương hiệu laptop: Dell, HP, Asus...';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Dell','dell',NULL,'Thương hiệu laptop Mỹ, nổi tiếng dòng XPS và Inspiron',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59'),(2,'HP','hp',NULL,'Hewlett-Packard, đa dạng phân khúc từ phổ thông đến cao cấp',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59'),(3,'Asus','asus',NULL,'Thương hiệu Đài Loan, mạnh về gaming (ROG, TUF) và ultrabook',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59'),(4,'Lenovo','lenovo',NULL,'Dòng ThinkPad huyền thoại và IdeaPad phổ thông',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59'),(5,'Apple','apple',NULL,'MacBook với chip Apple Silicon M-series abc',NULL,1,'2026-05-02 15:02:19','2026-05-07 16:16:09'),(6,'MSI','msi',NULL,'Chuyên gaming laptop hiệu năng cao',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59'),(7,'Acer','acer',NULL,'Phổ thông đến gaming với dòng Nitro, Predator',NULL,1,'2026-05-02 15:02:19','2026-05-02 15:05:59');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  UNIQUE KEY `uq_cart` (`user_id`,`product_id`),
  KEY `fk_cart_product` (`product_id`),
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_qty` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng đa thiết bị';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,1,1,1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(2,1,5,1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(3,2,2,2,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(4,2,4,1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(75,12,7,3,'2026-05-15 19:43:28','2026-05-15 19:43:28');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL COMMENT 'NULL = danh mục gốc',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL-friendly name',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_slug` (`slug`),
  KEY `idx_category_parent` (`parent_id`),
  KEY `idx_category_order` (`sort_order`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cây danh mục sản phẩm (đệ quy)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Laptop Shop','laptop',0,1,'2026-05-24 23:56:51','2026-05-24 23:56:51'),(2,1,'Laptop Gaming','laptop-gaming',1,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(3,1,'Laptop Văn Phòng','laptop-van-phong',2,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(4,1,'Laptop Đồ Hoạ','laptop-do-hoa',3,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(5,1,'Ultrabook / Mỏng Nhẹ','laptop-mong-nhe',4,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(6,1,'MacBook','macbook',5,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(7,1,'Laptop Cũ / Refurbished','laptop-cu',6,1,'2026-05-24 23:57:03','2026-05-24 23:57:03'),(10,2,'Gaming Tầm Trung','gaming-tam-trung',1,1,'2026-05-24 23:57:15','2026-05-24 23:57:15'),(11,2,'Gaming Cao Cấp','gaming-cao-cap',2,1,'2026-05-24 23:57:15','2026-05-24 23:57:15'),(12,2,'Gaming Siêu Cao Cấp','gaming-sieu-cao-cap',3,1,'2026-05-24 23:57:15','2026-05-24 23:57:15'),(13,2,'Gaming Nhỏ Gọn','gaming-nho-gon',4,1,'2026-05-24 23:57:15','2026-05-24 23:57:15'),(20,3,'Laptop Sinh Viên','laptop-sinh-vien',1,1,'2026-05-24 23:57:29','2026-05-24 23:57:29'),(21,3,'Laptop Doanh Nhân','laptop-doanh-nhan',2,1,'2026-05-24 23:57:29','2026-05-24 23:57:29'),(22,3,'Laptop 2 Trong 1','laptop-2-trong-1',3,1,'2026-05-24 23:57:29','2026-05-24 23:57:29'),(30,4,'Thiết Kế Đồ Họa','thiet-ke-do-hoa',1,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(31,4,'Dựng Phim / Video','dung-phim-video',2,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(32,4,'Kỹ Thuật / CAD','ky-thuat-cad',3,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(40,5,'Siêu Mỏng < 1kg','sieu-mong-duoi-1kg',1,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(41,5,'Mỏng Nhẹ 1-1.5kg','mong-nhe-1-1-5kg',2,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(42,5,'OLED / Màn Cao Cấp','ultrabook-oled',3,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(50,6,'MacBook Air','macbook-air',1,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(51,6,'MacBook Pro','macbook-pro',2,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(60,7,'Cũ Dưới 5 Triệu','cu-duoi-5-trieu',1,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(61,7,'Cũ 5 - 10 Triệu','cu-5-10-trieu',2,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(62,7,'Cũ Trên 10 Triệu','cu-tren-10-trieu',3,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(63,7,'Refurbished','refurbished',4,1,'2026-05-24 23:57:57','2026-05-24 23:57:57'),(100,10,'Gaming RTX 4050','gaming-rtx-4050',1,1,'2026-05-24 23:58:15','2026-05-24 23:58:15'),(101,10,'Gaming RTX 4060','gaming-rtx-4060',2,1,'2026-05-24 23:58:15','2026-05-24 23:58:15'),(110,11,'Gaming RTX 4070','gaming-rtx-4070',1,1,'2026-05-24 23:58:15','2026-05-24 23:58:15'),(111,11,'Gaming RTX 4080','gaming-rtx-4080',2,1,'2026-05-24 23:58:15','2026-05-24 23:58:15');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_alerts`
--

DROP TABLE IF EXISTS `inventory_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_alerts` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `product_id` int NOT NULL,
  `stock` int NOT NULL,
  `min_stock` int NOT NULL,
  `severity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'critical|warning|info',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`alert_id`),
  UNIQUE KEY `uq_alert_store_product` (`store_id`,`product_id`),
  KEY `fk_alert_product` (`product_id`),
  KEY `idx_alert_store` (`store_id`),
  KEY `idx_alert_severity` (`severity`),
  CONSTRAINT `fk_alert_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_alert_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_alerts`
--

LOCK TABLES `inventory_alerts` WRITE;
/*!40000 ALTER TABLE `inventory_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_ticket_lines`
--

DROP TABLE IF EXISTS `inventory_ticket_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_ticket_lines` (
  `line_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(15,0) DEFAULT NULL,
  `line_total` decimal(15,0) DEFAULT NULL,
  PRIMARY KEY (`line_id`),
  KEY `idx_ticketline_ticket` (`ticket_id`),
  KEY `idx_ticketline_product` (`product_id`),
  CONSTRAINT `fk_ticketline_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_ticketline_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `inventory_tickets` (`ticket_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_ticket_lines`
--

LOCK TABLES `inventory_ticket_lines` WRITE;
/*!40000 ALTER TABLE `inventory_ticket_lines` DISABLE KEYS */;
INSERT INTO `inventory_ticket_lines` VALUES (1,1,5,1000,10000000,10000000000);
/*!40000 ALTER TABLE `inventory_ticket_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_tickets`
--

DROP TABLE IF EXISTS `inventory_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_tickets` (
  `ticket_id` int NOT NULL AUTO_INCREMENT,
  `ticket_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IMPORT|EXPORT|TRANSFER',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `from_store_id` int DEFAULT NULL,
  `to_store_id` int DEFAULT NULL,
  `supplier` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `fk_ticket_staff` (`created_by`),
  KEY `idx_ticket_type` (`ticket_type`),
  KEY `idx_ticket_from_store` (`from_store_id`),
  KEY `idx_ticket_to_store` (`to_store_id`),
  KEY `idx_ticket_status` (`status`),
  KEY `idx_ticket_created` (`created_at`),
  CONSTRAINT `fk_ticket_from_store` FOREIGN KEY (`from_store_id`) REFERENCES `stores` (`store_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ticket_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ticket_to_store` FOREIGN KEY (`to_store_id`) REFERENCES `stores` (`store_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_tickets`
--

LOCK TABLES `inventory_tickets` WRITE;
/*!40000 ALTER TABLE `inventory_tickets` DISABLE KEYS */;
INSERT INTO `inventory_tickets` VALUES (1,'IMPORT','COMPLETED',NULL,2,NULL,NULL,NULL,NULL,'2026-05-27 21:06:46','2026-05-27 21:06:46');
/*!40000 ALTER TABLE `inventory_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `transaction_id` bigint NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity_delta` int NOT NULL COMMENT 'Dương: nhập/chuyển vào; Âm: xuất/chuyển đi',
  `transaction_type` enum('import','export','transfer_out','transfer_in','adjustment','order_deduct','return_in') COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_ref` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'UUID: cặp transfer_out / transfer_in cùng lô',
  `counterparty_store_id` int DEFAULT NULL COMMENT 'Chi nhánh đối ứng khi điều chuyển',
  `related_order_id` int DEFAULT NULL,
  `related_return_id` int DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_invtxn_store_product` (`store_id`,`product_id`),
  KEY `idx_invtxn_product` (`product_id`),
  KEY `idx_invtxn_created` (`created_at`),
  KEY `idx_invtxn_batch` (`batch_ref`),
  KEY `fk_invtxn_counterparty` (`counterparty_store_id`),
  KEY `fk_invtxn_order` (`related_order_id`),
  KEY `fk_invtxn_return` (`related_return_id`),
  KEY `fk_invtxn_staff` (`staff_id`),
  CONSTRAINT `fk_invtxn_counterparty` FOREIGN KEY (`counterparty_store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_invtxn_order` FOREIGN KEY (`related_order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `fk_invtxn_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_invtxn_return` FOREIGN KEY (`related_return_id`) REFERENCES `return_requests` (`return_id`),
  CONSTRAINT `fk_invtxn_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`),
  CONSTRAINT `fk_invtxn_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử biến động tồn kho';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,1,12,10,'adjustment',NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-05 21:01:51'),(2,1,7,-1,'order_deduct',NULL,NULL,19,NULL,'Xuất kho theo đơn ORD-20260514-6243',NULL,'2026-05-14 10:56:50'),(3,1,8,-1,'order_deduct',NULL,NULL,19,NULL,'Xuất kho theo đơn ORD-20260514-6243',NULL,'2026-05-14 10:56:50'),(4,1,9,-2,'order_deduct',NULL,NULL,19,NULL,'Xuất kho theo đơn ORD-20260514-6243',NULL,'2026-05-14 10:56:50'),(5,1,9,-1,'order_deduct',NULL,NULL,31,NULL,'Xuất kho theo đơn ORD-20260515-7696',NULL,'2026-05-15 11:12:48'),(6,1,11,-1,'order_deduct',NULL,NULL,31,NULL,'Xuất kho theo đơn ORD-20260515-7696',NULL,'2026-05-15 11:12:48'),(7,1,12,-2,'order_deduct',NULL,NULL,31,NULL,'Xuất kho theo đơn ORD-20260515-7696',NULL,'2026-05-15 11:12:48'),(8,1,3,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(9,1,4,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(10,1,8,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(11,1,9,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(12,1,10,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(13,1,11,-1,'order_deduct',NULL,NULL,36,NULL,'Xuất kho theo đơn ORD-20260517-4898',NULL,'2026-05-17 22:29:29'),(14,4,7,-1,'order_deduct',NULL,NULL,34,NULL,'Xuất kho theo đơn ORD-20260515-9714',NULL,'2026-05-17 23:50:21'),(15,2,2,-1,'order_deduct',NULL,NULL,37,NULL,'Xuất kho theo đơn ORD-20260518-3971',NULL,'2026-05-18 12:07:30'),(16,2,7,-1,'order_deduct',NULL,NULL,37,NULL,'Xuất kho theo đơn ORD-20260518-3971',NULL,'2026-05-18 12:07:30'),(17,2,9,-1,'order_deduct',NULL,NULL,37,NULL,'Xuất kho theo đơn ORD-20260518-3971',NULL,'2026-05-18 12:07:30'),(18,2,10,-2,'order_deduct',NULL,NULL,37,NULL,'Xuất kho theo đơn ORD-20260518-3971',NULL,'2026-05-18 12:07:30'),(19,2,11,-1,'order_deduct',NULL,NULL,37,NULL,'Xuất kho theo đơn ORD-20260518-3971',NULL,'2026-05-18 12:07:30'),(20,2,5,1000,'import',NULL,NULL,NULL,NULL,'Nhập kho theo phiếu',NULL,'2026-05-27 21:06:46');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,6,'ORDER_STATUS','Đơn #ORD-20260518-3971 đã được xác nhận','Đơn hàng đã được xác nhận và sẽ sớm được xử lý.',37,'ORDER',1,'2026-05-18 12:07:17'),(2,6,'ORDER_STATUS','Đơn #ORD-20260518-3971 đang được xử lý','Chúng tôi đang chuẩn bị hàng cho đơn của bạn.',37,'ORDER',1,'2026-05-18 12:07:21'),(3,6,'ORDER_STATUS','Đơn #ORD-20260518-3971 đang được giao','Đơn hàng đang trên đường giao đến bạn.',37,'ORDER',1,'2026-05-18 12:07:30'),(4,6,'ORDER_STATUS','Cập nhật đơn hàng #ORD-20260518-3971','Trạng thái đơn hàng của bạn đã được cập nhật.',37,'ORDER',1,'2026-05-18 12:07:37'),(6,6,'ORDER_STATUS','Đơn #ORD-20260520-5231 đã bị hủy','Đơn hàng đã bị hủy. Liên hệ hỗ trợ nếu cần thêm thông tin.',44,'ORDER',1,'2026-05-20 23:16:43'),(7,6,'ORDER_STATUS','Đơn #ORD-20260520-6742 đã bị hủy','Đơn hàng đã bị hủy. Liên hệ hỗ trợ nếu cần thêm thông tin.',43,'ORDER',1,'2026-05-20 23:16:47'),(8,6,'ORDER_STATUS','Đơn #ORD-20260525-3952 đã được xác nhận','Đơn hàng đã được xác nhận và sẽ sớm được xử lý.',47,'ORDER',1,'2026-05-25 18:01:00'),(10,14,'ORDER_STATUS','Đơn #ORD-20260527-6608 đã bị hủy','Đơn hàng đã bị hủy. Liên hệ hỗ trợ nếu cần thêm thông tin.',48,'ORDER',1,'2026-05-27 21:21:53'),(11,14,'ORDER_STATUS','Đơn #ORD-20260527-6975 đã bị hủy','Đơn hàng đã bị hủy. Liên hệ hỗ trợ nếu cần thêm thông tin.',49,'ORDER',0,'2026-05-27 21:22:45');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_history`
--

DROP TABLE IF EXISTS `order_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` int DEFAULT NULL,
  `staff_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `fk_oh_staff` (`staff_id`),
  KEY `idx_oh_order` (`order_id`),
  KEY `idx_oh_created` (`created_at`),
  CONSTRAINT `fk_oh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oh_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_history`
--

LOCK TABLES `order_history` WRITE;
/*!40000 ALTER TABLE `order_history` DISABLE KEYS */;
INSERT INTO `order_history` VALUES (1,12,'PENDING','CONFIRMED',NULL,NULL,'2026-05-04 20:11:41'),(2,12,'CONFIRMED','CANCELLED',NULL,NULL,'2026-05-04 20:12:01'),(3,19,'PENDING','CONFIRMED',NULL,NULL,'2026-05-14 10:56:39'),(4,19,'CONFIRMED','PROCESSING',NULL,NULL,'2026-05-14 10:56:47'),(5,19,'PROCESSING','SHIPPING',NULL,NULL,'2026-05-14 10:56:50'),(6,19,'SHIPPING','COMPLETED',NULL,NULL,'2026-05-14 10:56:54'),(7,18,'PENDING','CONFIRMED',NULL,NULL,'2026-05-14 22:47:01'),(8,18,'CONFIRMED','CANCELLED',NULL,NULL,'2026-05-14 22:47:06'),(9,31,'CONFIRMED','PROCESSING',NULL,NULL,'2026-05-15 11:12:44'),(10,31,'PROCESSING','SHIPPING',NULL,NULL,'2026-05-15 11:12:48'),(11,31,'SHIPPING','COMPLETED',NULL,NULL,'2026-05-15 11:12:52'),(12,36,'CONFIRMED','PROCESSING',NULL,NULL,'2026-05-17 22:29:10'),(13,36,'PROCESSING','SHIPPING',NULL,NULL,'2026-05-17 22:29:29'),(14,36,'SHIPPING','COMPLETED',NULL,NULL,'2026-05-17 22:29:41'),(15,34,'PENDING','CONFIRMED',NULL,NULL,'2026-05-17 23:50:12'),(16,34,'CONFIRMED','PROCESSING',NULL,NULL,'2026-05-17 23:50:18'),(17,34,'PROCESSING','SHIPPING',NULL,NULL,'2026-05-17 23:50:21'),(18,34,'SHIPPING','COMPLETED',NULL,NULL,'2026-05-17 23:50:25'),(19,33,'PENDING','CANCELLED',NULL,NULL,'2026-05-17 23:55:10'),(20,37,'PENDING','CONFIRMED',NULL,NULL,'2026-05-18 12:07:17'),(21,37,'CONFIRMED','PROCESSING',NULL,NULL,'2026-05-18 12:07:21'),(22,37,'PROCESSING','SHIPPING',NULL,NULL,'2026-05-18 12:07:30'),(23,37,'SHIPPING','COMPLETED',NULL,NULL,'2026-05-18 12:07:37'),(24,47,'PENDING','CONFIRMED',NULL,NULL,'2026-05-25 18:01:00');
/*!40000 ALTER TABLE `order_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(15,0) NOT NULL COMMENT 'Giá tại thời điểm mua (snapshot)',
  `total_price` decimal(15,0) NOT NULL COMMENT 'unit_price * quantity',
  PRIMARY KEY (`item_id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `idx_oi_product` (`product_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết sản phẩm trong đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,1,17490000,17490000),(2,2,3,1,32990000,32990000),(3,3,4,1,20990000,20990000),(4,4,2,2,32990000,65980000),(5,5,9,1,23990000,23990000),(6,6,8,1,13490000,13490000),(7,7,3,5,32990000,164950000),(8,7,7,1,18490000,18490000),(9,8,5,1,29990000,29990000),(10,9,8,2,13490000,26980000),(11,10,8,1,13490000,13490000),(12,10,9,1,23990000,23990000),(13,11,9,1,23990000,23990000),(14,11,10,1,47990000,47990000),(15,12,7,1,18490000,18490000),(16,12,8,1,13490000,13490000),(17,12,10,1,47990000,47990000),(18,13,2,1,32990000,32990000),(19,13,7,4,18490000,73960000),(20,13,8,4,13490000,53960000),(21,13,9,3,23990000,71970000),(22,14,7,1,18490000,18490000),(23,14,8,1,13490000,13490000),(24,14,9,1,23990000,23990000),(25,14,10,1,47990000,47990000),(26,15,10,4,47990000,191960000),(27,16,4,1,20990000,20990000),(28,16,6,1,37990000,37990000),(29,16,10,1,47990000,47990000),(30,16,11,1,49990000,49990000),(31,16,12,1,28990000,28990000),(32,17,7,1,18490000,18490000),(33,17,8,1,13490000,13490000),(34,17,9,1,23990000,23990000),(35,18,7,1,18490000,18490000),(36,18,8,1,13490000,13490000),(37,18,9,1,23990000,23990000),(38,18,11,1,49990000,49990000),(39,19,7,1,18490000,18490000),(40,19,8,1,13490000,13490000),(41,19,9,2,23990000,47980000),(42,20,7,5,18490000,92450000),(43,20,10,2,47990000,95980000),(44,21,7,1,18490000,18490000),(45,21,8,1,13490000,13490000),(46,22,7,1,18490000,18490000),(47,22,8,1,13490000,13490000),(48,23,11,1,49990000,49990000),(49,23,12,1,28990000,28990000),(50,24,7,1,18490000,18490000),(51,25,3,1,32990000,32990000),(52,26,10,4,47990000,191960000),(53,27,8,1,13490000,13490000),(54,28,8,1,13490000,13490000),(55,29,10,1,47990000,47990000),(56,29,11,1,49990000,49990000),(57,30,8,1,13490000,13490000),(58,31,9,1,23990000,23990000),(59,31,11,1,49990000,49990000),(60,31,12,2,28990000,57980000),(61,32,7,1,18490000,18490000),(62,33,8,1,13490000,13490000),(63,34,7,1,18490000,18490000),(64,35,8,1,13490000,13490000),(65,36,3,1,32990000,32990000),(66,36,4,1,20990000,20990000),(67,36,8,1,13490000,13490000),(68,36,9,1,23990000,23990000),(69,36,10,1,47990000,47990000),(70,36,11,1,49990000,49990000),(71,37,2,1,32990000,32990000),(72,37,7,1,18490000,18490000),(73,37,9,1,23990000,23990000),(74,37,10,2,47990000,95980000),(75,37,11,1,49990000,49990000),(76,38,11,1,49990000,49990000),(77,39,9,1,23990000,23990000),(78,40,8,1,13490000,13490000),(79,41,2,1,32990000,32990000),(80,42,7,1,18490000,18490000),(81,43,11,1,49990000,49990000),(82,44,1,1,17490000,17490000),(83,44,8,1,13490000,13490000),(84,45,10,1,47990000,47990000),(85,46,12,1,28990000,28990000),(86,47,5,1,28888888,28888888),(87,48,7,1,18490000,18490000),(88,48,9,1,23990000,23990000),(89,49,8,1,13490000,13490000);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_id` int NOT NULL COMMENT 'Chi nhánh xử lý đơn',
  `address_id` int DEFAULT NULL COMMENT 'NULL nếu khách tới mua trực tiếp',
  `promotion_id` int DEFAULT NULL,
  `order_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã đơn hiển thị: ORD-20240315-0001',
  `status` enum('PENDING','CONFIRMED','PROCESSING','SHIPPING','COMPLETED','CANCELLED','REFUNDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(15,0) NOT NULL COMMENT 'Tổng tiền hàng trước giảm',
  `discount_amount` decimal(15,0) NOT NULL DEFAULT '0',
  `shipping_fee` decimal(15,0) NOT NULL DEFAULT '0',
  `total_amount` decimal(15,0) NOT NULL COMMENT 'Số tiền khách thực trả',
  `note` text COLLATE utf8mb4_unicode_ci,
  `ordered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uq_order_code` (`order_code`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_store` (`store_id`),
  KEY `idx_order_status` (`status`),
  KEY `idx_order_date` (`ordered_at`),
  KEY `fk_order_address` (`address_id`),
  KEY `fk_order_promotion` (`promotion_id`),
  CONSTRAINT `fk_order_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`),
  CONSTRAINT `fk_order_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`promotion_id`),
  CONSTRAINT `fk_order_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn đặt hàng của khách';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,1,1,NULL,'ORD-20260101-0001','COMPLETED',17490000,0,30000,17520000,NULL,'2026-04-13 13:35:58','2026-04-13 13:35:58'),(2,1,1,1,NULL,'ORD-20260201-0002','SHIPPING',32990000,0,30000,33020000,NULL,'2026-04-13 13:35:58','2026-04-13 13:35:58'),(3,2,1,3,NULL,'ORD-20260301-0003','REFUNDED',20990000,500000,30000,20520000,NULL,'2026-04-13 13:35:58','2026-05-05 10:09:04'),(4,11,1,6,NULL,'ORD-20260422-3504','PENDING',65980000,0,30000,66010000,NULL,'2026-04-22 17:51:48','2026-04-22 17:51:48'),(5,11,1,6,NULL,'ORD-20260422-5652','PENDING',23990000,0,30000,24020000,NULL,'2026-04-22 17:52:31','2026-04-22 17:52:31'),(6,11,1,6,NULL,'ORD-20260422-1462','PENDING',13490000,0,30000,13520000,NULL,'2026-04-22 18:04:53','2026-04-22 18:04:53'),(7,11,1,6,NULL,'ORD-20260423-1514','PENDING',183440000,0,30000,183470000,NULL,'2026-04-23 09:56:19','2026-04-23 09:56:19'),(8,11,1,6,NULL,'ORD-20260423-9487','PENDING',29990000,0,30000,30020000,NULL,'2026-04-23 10:03:37','2026-04-23 10:03:37'),(9,11,1,6,NULL,'ORD-20260423-9114','PENDING',26980000,0,30000,27010000,NULL,'2026-04-23 10:04:19','2026-04-23 10:04:19'),(10,11,1,6,NULL,'ORD-20260423-3285','PENDING',37480000,0,30000,37510000,NULL,'2026-04-23 10:12:10','2026-04-23 10:12:10'),(11,11,1,6,NULL,'ORD-20260423-9931','PENDING',71980000,0,30000,72010000,NULL,'2026-04-23 10:16:19','2026-04-23 10:16:19'),(12,11,1,6,NULL,'ORD-20260423-3164','CANCELLED',79970000,0,30000,80000000,NULL,'2026-04-23 10:19:27','2026-05-04 20:12:01'),(13,11,1,6,NULL,'ORD-20260511-1430','PENDING',232880000,0,30000,232910000,NULL,'2026-05-11 18:15:04','2026-05-11 18:15:04'),(14,11,1,6,NULL,'ORD-20260512-8925','PENDING',103960000,0,0,103960000,NULL,'2026-05-12 12:25:36','2026-05-12 12:25:36'),(15,11,1,6,NULL,'ORD-20260512-5160','PENDING',191960000,0,0,191960000,NULL,'2026-05-12 23:36:26','2026-05-12 23:36:26'),(16,11,1,6,NULL,'ORD-20260513-3074','PENDING',185950000,0,0,185950000,NULL,'2026-05-13 21:41:27','2026-05-13 21:41:27'),(17,11,1,6,NULL,'ORD-20260514-9214','PENDING',55970000,0,0,55970000,NULL,'2026-05-14 10:19:23','2026-05-14 10:19:23'),(18,11,5,6,NULL,'ORD-20260514-1495','CANCELLED',105960000,0,0,105960000,NULL,'2026-05-14 10:19:45','2026-05-14 22:47:06'),(19,11,1,6,NULL,'ORD-20260514-6243','COMPLETED',79960000,0,0,79960000,NULL,'2026-05-14 10:20:23','2026-05-14 10:56:54'),(20,6,1,7,NULL,'ORD-20260514-2859','PENDING',188430000,0,0,188430000,NULL,'2026-05-14 22:00:10','2026-05-14 22:00:10'),(21,6,1,7,NULL,'ORD-20260514-3966','PENDING',31980000,0,0,31980000,NULL,'2026-05-14 23:57:06','2026-05-14 23:57:06'),(22,6,1,7,NULL,'ORD-20260514-8811','PENDING',31980000,0,0,31980000,NULL,'2026-05-14 23:57:35','2026-05-14 23:57:35'),(23,6,1,7,NULL,'ORD-20260515-7395','PENDING',78980000,0,0,78980000,NULL,'2026-05-15 00:05:35','2026-05-15 00:05:35'),(24,6,1,7,NULL,'ORD-20260515-3065','PENDING',18490000,0,0,18490000,NULL,'2026-05-15 00:05:49','2026-05-15 00:05:49'),(25,6,1,7,NULL,'ORD-20260515-5815','PENDING',32990000,0,0,32990000,NULL,'2026-05-15 00:08:25','2026-05-15 00:08:25'),(26,6,1,7,NULL,'ORD-20260515-8625','PENDING',191960000,0,0,191960000,NULL,'2026-05-15 10:57:06','2026-05-15 10:57:06'),(27,6,1,7,NULL,'ORD-20260515-6251','PENDING',13490000,0,0,13490000,NULL,'2026-05-15 10:57:34','2026-05-15 10:57:34'),(28,6,1,7,NULL,'ORD-20260515-6165','PENDING',13490000,0,0,13490000,NULL,'2026-05-15 11:00:49','2026-05-15 11:00:49'),(29,6,1,7,NULL,'ORD-20260515-2168','PENDING',97980000,0,0,97980000,NULL,'2026-05-15 11:01:07','2026-05-15 11:01:07'),(30,6,1,7,NULL,'ORD-20260515-9098','PENDING',13490000,0,0,13490000,NULL,'2026-05-15 11:05:09','2026-05-15 11:05:09'),(31,6,1,7,NULL,'ORD-20260515-7696','COMPLETED',131960000,0,0,131960000,NULL,'2026-05-15 11:11:23','2026-05-15 11:12:52'),(32,6,1,7,NULL,'ORD-20260515-2148','CONFIRMED',18490000,0,0,18490000,NULL,'2026-05-15 12:25:56','2026-05-15 12:27:04'),(33,6,1,7,NULL,'ORD-20260515-4050','CANCELLED',13490000,0,0,13490000,NULL,'2026-05-15 12:27:28','2026-05-17 23:55:10'),(34,6,4,7,NULL,'ORD-20260515-9714','COMPLETED',18490000,0,0,18490000,NULL,'2026-05-15 12:30:55','2026-05-17 23:50:25'),(35,6,1,7,NULL,'ORD-20260515-2208','CONFIRMED',13490000,0,0,13490000,NULL,'2026-05-15 12:41:53','2026-05-15 12:45:44'),(36,6,1,7,NULL,'ORD-20260517-4898','REFUNDED',189440000,0,0,189440000,NULL,'2026-05-17 22:27:02','2026-05-17 23:45:05'),(37,6,2,7,NULL,'ORD-20260518-3971','COMPLETED',221440000,0,0,221440000,NULL,'2026-05-18 12:07:03','2026-05-18 12:07:37'),(38,6,1,7,NULL,'ORD-20260519-3007','PENDING',49990000,0,0,49990000,NULL,'2026-05-19 23:53:07','2026-05-19 23:53:07'),(39,6,1,7,NULL,'ORD-20260519-3155','PENDING',23990000,0,0,23990000,NULL,'2026-05-19 23:53:29','2026-05-19 23:53:29'),(40,6,1,7,NULL,'ORD-20260520-2146','PENDING',13490000,0,0,13490000,NULL,'2026-05-20 00:00:36','2026-05-20 00:00:36'),(41,6,1,7,NULL,'ORD-20260520-3274','PENDING',32990000,0,0,32990000,NULL,'2026-05-20 00:05:08','2026-05-20 00:05:08'),(42,6,1,7,NULL,'ORD-20260520-3788','PENDING',18490000,0,0,18490000,NULL,'2026-05-20 00:05:43','2026-05-20 00:05:43'),(43,6,1,7,NULL,'ORD-20260520-6742','CANCELLED',49990000,0,0,49990000,NULL,'2026-05-20 00:07:52','2026-05-20 23:16:47'),(44,6,1,7,NULL,'ORD-20260520-5231','CANCELLED',30980000,0,0,30980000,NULL,'2026-05-20 00:08:55','2026-05-20 23:16:43'),(45,6,1,7,NULL,'ORD-20260525-5565','PENDING',47990000,0,0,47990000,NULL,'2026-05-25 17:50:39','2026-05-25 17:50:39'),(46,6,1,7,NULL,'ORD-20260525-5680','PENDING',28990000,0,0,28990000,NULL,'2026-05-25 17:50:49','2026-05-25 17:50:49'),(47,6,5,7,NULL,'ORD-20260525-3952','CONFIRMED',28888888,0,0,28888888,NULL,'2026-05-25 17:50:56','2026-05-25 18:01:00'),(48,14,1,8,2,'ORD-20260527-6608','CANCELLED',42480000,0,0,42480000,NULL,'2026-05-27 21:03:27','2026-05-27 21:21:53'),(49,14,1,8,NULL,'ORD-20260527-6975','CANCELLED',13490000,0,0,13490000,NULL,'2026-05-27 21:22:27','2026-05-27 21:22:45');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `method` enum('COD','BANK_TRANSFER','MOMO','VNPAY','ZALOPAY','CREDIT_CARD') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PAID','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,0) NOT NULL,
  `transaction_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã giao dịch từ cổng thanh toán',
  `gateway_data` json DEFAULT NULL COMMENT 'Raw response từ cổng thanh toán',
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_url` text COLLATE utf8mb4_unicode_ci,
  `raw_response` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_payment_order` (`order_id`),
  KEY `idx_payment_status` (`status`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông tin thanh toán đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'COD','PAID',17520000,NULL,NULL,'2026-01-02 10:00:00','2026-04-13 13:35:58','2026-04-13 13:35:58',NULL,NULL),(2,2,'BANK_TRANSFER','PAID',33020000,NULL,NULL,'2026-02-01 09:00:00','2026-04-13 13:35:58','2026-04-13 13:35:58',NULL,NULL),(3,3,'MOMO','REFUNDED',20520000,NULL,NULL,NULL,'2026-04-13 13:35:58','2026-05-05 10:09:03',NULL,NULL),(4,7,'VNPAY','PENDING',183470000,NULL,NULL,NULL,'2026-04-23 09:56:19','2026-04-23 09:56:19','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=18347000000&vnp_Command=pay&vnp_CreateDate=20260423095619&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260423-1514&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=YOUR_TMN_CODE&vnp_TxnRef=7&vnp_Version=2.1.0&vnp_SecureHash=aa640164848e863d2ed2122f6c99f6552c304cc6fd7e20593658b8428f97dc1e052db33cbe1ae4f822561548cca74d64712f03730a7912d924fad856aaddfb64',NULL),(5,14,'COD','PENDING',103960000,NULL,NULL,NULL,'2026-05-12 12:25:36','2026-05-12 12:25:36',NULL,NULL),(6,15,'BANK_TRANSFER','PENDING',191960000,NULL,NULL,NULL,'2026-05-12 23:36:26','2026-05-12 23:36:26',NULL,NULL),(7,16,'COD','PENDING',185950000,NULL,NULL,NULL,'2026-05-13 21:41:27','2026-05-13 21:41:27',NULL,NULL),(8,17,'BANK_TRANSFER','PENDING',55970000,NULL,NULL,NULL,'2026-05-14 10:19:23','2026-05-14 10:19:23',NULL,NULL),(9,18,'CREDIT_CARD','PENDING',105960000,NULL,NULL,NULL,'2026-05-14 10:19:45','2026-05-14 10:19:54','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10596000000&vnp_Command=pay&vnp_CreateDate=20260514101953&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260514-1495&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=YOUR_TMN_CODE&vnp_TxnRef=18&vnp_Version=2.1.0&vnp_SecureHash=720892b2be0d320e5f726f3e95bc54a0565ef2014f1f3c33ff579507562d8028ad4da57a0bc2e6bdc2e7f4dba58e1ed233cc9e8f9bce4aabe0129a13e834d520',NULL),(10,19,'CREDIT_CARD','PENDING',79960000,NULL,NULL,NULL,'2026-05-14 10:20:23','2026-05-14 10:20:23',NULL,NULL),(11,20,'CREDIT_CARD','PENDING',188430000,NULL,NULL,NULL,'2026-05-14 22:00:10','2026-05-14 22:00:16','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=18843000000&vnp_Command=pay&vnp_CreateDate=20260514220015&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260514-2859&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=YOUR_TMN_CODE&vnp_TxnRef=20&vnp_Version=2.1.0&vnp_SecureHash=b6be3b0436988eb9802491be305cb6ba7df1494aa653bd3c3916877154fd208818cf3899789aeca1359a07c6f86b26c4e0a7cf81fa8a843ba3ca8e0f387dbcc2',NULL),(12,21,'BANK_TRANSFER','PENDING',31980000,NULL,NULL,NULL,'2026-05-14 23:57:06','2026-05-14 23:57:06',NULL,NULL),(13,22,'CREDIT_CARD','PENDING',31980000,NULL,NULL,NULL,'2026-05-14 23:57:35','2026-05-14 23:57:37','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=3198000000&vnp_Command=pay&vnp_CreateDate=20260514235736&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260514-8811&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=YOUR_TMN_CODE&vnp_TxnRef=22&vnp_Version=2.1.0&vnp_SecureHash=874c22716840068e16c1ad04a8eec1764e3d44ceb1455680ca89d05e47aad4e81451f632109f7d0da6405436f929f312796349c0a429a0f244f75ac1567331a0',NULL),(14,23,'COD','PENDING',78980000,NULL,NULL,NULL,'2026-05-15 00:05:35','2026-05-15 00:05:35',NULL,NULL),(15,24,'CREDIT_CARD','PENDING',18490000,NULL,NULL,NULL,'2026-05-15 00:05:49','2026-05-15 00:05:52','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1849000000&vnp_Command=pay&vnp_CreateDate=20260515000552&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-3065&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=24&vnp_Version=2.1.0&vnp_SecureHash=4566755e5d9120837ce78f969579f45e8e31efaec869bf13318529755a0dc72a9739f97be27dd6ef4707c2fd4e4741a2163fac518fcd823318b9d810e3b4468b',NULL),(16,25,'CREDIT_CARD','PENDING',32990000,NULL,NULL,NULL,'2026-05-15 00:08:25','2026-05-15 00:08:26','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=3299000000&vnp_Command=pay&vnp_CreateDate=20260515000825&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-5815&vnp_OrderType=other&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=25&vnp_Version=2.1.0&vnp_SecureHash=4f12ab3bbe50727db1d3098d9e1abf1de0e45a5e1bee346004366b67066ae0c4345049e4237476237af7d037cfbde341c5edb8369ca181fff8398d92cd0a11ac',NULL),(17,26,'CREDIT_CARD','PENDING',191960000,NULL,NULL,NULL,'2026-05-15 10:57:06','2026-05-15 10:57:11','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=19196000000&vnp_Command=pay&vnp_CreateDate=20260515105710&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-8625&vnp_OrderType=other&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=26&vnp_Version=2.1.0&vnp_SecureHash=e0133af8a7c7886bc5b0bfda1279d28dbba6e0c4021978b5a243da1b53462c860a166997b2d314dd496115ed58a2fcc9c6dd4a44239a0a51334bdba843b582dd',NULL),(18,27,'CREDIT_CARD','PENDING',13490000,NULL,NULL,NULL,'2026-05-15 10:57:34','2026-05-15 10:58:09','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1349000000&vnp_Command=pay&vnp_CreateDate=20260515105808&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-6251&vnp_OrderType=other&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=27&vnp_Version=2.1.0&vnp_SecureHash=7e4e6fe230b46544536df94eeaaf9de0a032ef24c36e93b4740c142f6f066ac77b0620752db03c9a16f7dab137267ea4a02245c6c81ec9cd4aae532ddee44dbb',NULL),(19,28,'COD','PENDING',13490000,NULL,NULL,NULL,'2026-05-15 11:00:49','2026-05-15 11:00:49',NULL,NULL),(20,29,'CREDIT_CARD','PENDING',97980000,NULL,NULL,NULL,'2026-05-15 11:01:07','2026-05-15 11:01:31','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=9798000000&vnp_Command=pay&vnp_CreateDate=20260515110130&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-2168&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=29&vnp_Version=2.1.0&vnp_SecureHash=d23c2191d0e8cb732384dd7c2b7a8afc919fac59b515ac18a87668c79945a55e34abcd4ca48e76ee31177cdfc564deb03e61534302f4778b4cbf4cb0036895b4',NULL),(21,30,'CREDIT_CARD','PENDING',13490000,NULL,NULL,NULL,'2026-05-15 11:05:09','2026-05-15 11:05:26','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1349000000&vnp_Command=pay&vnp_CreateDate=20260515110526&vnp_CurrCode=VND&vnp_ExpireDate=20260515112026&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-9098&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=30_1778817926369&vnp_Version=2.1.0&vnp_SecureHash=ba85499669904c6f2f676ba0999741f508f8ec0aca1246cc03952d12960af5bd1843ce52c32de5fccb74eb99ff522580732ec91ac0ee7874bfbd66f082e5b135',NULL),(22,31,'CREDIT_CARD','PAID',131960000,'15539556',NULL,'2026-05-15 11:12:01','2026-05-15 11:11:23','2026-05-15 11:12:01','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=13196000000&vnp_Command=pay&vnp_CreateDate=20260515111125&vnp_CurrCode=VND&vnp_ExpireDate=20260515112625&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-7696&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=31_1778818285481&vnp_Version=2.1.0&vnp_SecureHash=7c2f2443598853ffc5f2c4228ac9a40b229278b2c847dfbdb5b42bc0124d56ed25823834bdfd444b37f3afee46e308c8ead7baf1a2cd557061644e297b0cc2e7','{vnp_Amount=13196000000, vnp_BankCode=NCB, vnp_BankTranNo=VNP15539556, vnp_CardType=ATM, vnp_OrderInfo=Thanh toan don hang ORD-20260515-7696, vnp_PayDate=20260515111156, vnp_ResponseCode=00, vnp_TmnCode=ZC5M1UBY, vnp_TransactionNo=15539556, vnp_TransactionStatus=00, vnp_TxnRef=31_1778818285481, vnp_SecureHash=f8ee522cc829eeed7c922b0debd98d42846b7a70b87287cb64824244b79bc13a8e2017b61a184ed2f8802a247edea79fa88c4f5c44a2004ee7d3a5415dcebc18}'),(23,32,'CREDIT_CARD','PAID',18490000,'15539644',NULL,'2026-05-15 12:27:04','2026-05-15 12:25:56','2026-05-15 12:27:04','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1849000000&vnp_Command=pay&vnp_CreateDate=20260515122558&vnp_CurrCode=VND&vnp_ExpireDate=20260515124058&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-2148&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=32_1778822758255&vnp_Version=2.1.0&vnp_SecureHash=2bf2b464fc6c6bed0f0e491da3e6b444b50aac22029c7801d555bc1ca620394e83dce58f34dd219f9d30e32dfb6da3810501d4357f9f187c2ac59eaee02c0b10','{vnp_Amount=1849000000, vnp_BankCode=NCB, vnp_BankTranNo=VNP15539644, vnp_CardType=ATM, vnp_OrderInfo=Thanh toan don hang ORD-20260515-2148, vnp_PayDate=20260515122659, vnp_ResponseCode=00, vnp_TmnCode=ZC5M1UBY, vnp_TransactionNo=15539644, vnp_TransactionStatus=00, vnp_TxnRef=32_1778822758255, vnp_SecureHash=6b254d1ebbf1cefc04d75b36d58095e7e71aabcdbaf275af2048e6c0af86855fa28a1f452e45ca16d3076bd9788d5dfc26e46881d1cd7ebb56a600e7f282b5d5}'),(24,33,'CREDIT_CARD','FAILED',13490000,'15539645',NULL,NULL,'2026-05-15 12:27:28','2026-05-15 12:28:09','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1349000000&vnp_Command=pay&vnp_CreateDate=20260515122731&vnp_CurrCode=VND&vnp_ExpireDate=20260515124231&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-4050&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=33_1778822851687&vnp_Version=2.1.0&vnp_SecureHash=2eb599f53fa1d090101d4f0ab0adc181c33542e8c39381fd9128e3d6a607bae86d0f9f98c73943bc1cbc3dff4b7b515c75210e72b6ec15c41deb9014a1e7b482','{vnp_Amount=1349000000, vnp_BankCode=SACOMBANK, vnp_CardType=ATM, vnp_OrderInfo=Thanh toan don hang ORD-20260515-4050, vnp_PayDate=20260515122747, vnp_ResponseCode=24, vnp_TmnCode=ZC5M1UBY, vnp_TransactionNo=15539645, vnp_TransactionStatus=02, vnp_TxnRef=33_1778822851687, vnp_SecureHash=31df7fc3762c7cdeeacb03722318e1d3dc336f270d56dd580b9d9597019c7c2b94e8982330a86b889750c284cb892dec8f97c367c6a78b4d4e664722bd78da1b}'),(25,34,'CREDIT_CARD','PENDING',18490000,NULL,NULL,NULL,'2026-05-15 12:30:55','2026-05-15 12:30:57','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1849000000&vnp_Command=pay&vnp_CreateDate=20260515123056&vnp_CurrCode=VND&vnp_ExpireDate=20260515124556&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-9714&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=34_1778823056655&vnp_Version=2.1.0&vnp_SecureHash=4d03da745d2e2fad102e7b5e8bd3c64f754b7035d01c1796503d476e31c7bb2469e469dc031764712d0ece22f0fc59773daac4fdb192077d0a01b34f0c44b99c',NULL),(26,35,'CREDIT_CARD','PAID',13490000,'15539653',NULL,'2026-05-15 12:45:44','2026-05-15 12:41:53','2026-05-15 12:45:44','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1349000000&vnp_Command=pay&vnp_CreateDate=20260515124456&vnp_CurrCode=VND&vnp_ExpireDate=20260515125956&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260515-2208&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=35_1778823896494&vnp_Version=2.1.0&vnp_SecureHash=7e2d6492697cb7fd6fe7174b188d51d19e1fcfe684b33d5dd7ea4f7a09517cafb4449637b7e59b62e121199dd9a92ef687abdcbda91ceb235801a9b58cb3b345','{vnp_Amount=1349000000, vnp_BankCode=NCB, vnp_BankTranNo=VNP15539653, vnp_CardType=ATM, vnp_OrderInfo=Thanh toan don hang ORD-20260515-2208, vnp_PayDate=20260515124539, vnp_ResponseCode=00, vnp_TmnCode=ZC5M1UBY, vnp_TransactionNo=15539653, vnp_TransactionStatus=00, vnp_TxnRef=35_1778823896494, vnp_SecureHash=898e264c7120a4d4b7433dcf92fdc3db7db91c3d4343df822b1c42b07eb678d6a665ffd6aa1cdf97fea0311c7f7700b98f5a6a901044cd77b5caf7b73b129a2d}'),(27,36,'CREDIT_CARD','REFUNDED',189440000,'15543386',NULL,'2026-05-17 22:28:39','2026-05-17 22:27:02','2026-05-17 23:45:04','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=18944000000&vnp_Command=pay&vnp_CreateDate=20260517222703&vnp_CurrCode=VND&vnp_ExpireDate=20260517224203&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260517-4898&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=36_1779031623547&vnp_Version=2.1.0&vnp_SecureHash=4ee97df671e0e09eb922d59e58100e6d7d6f352ff57165721e1e10b1877f4ceeb945b1e1f0a9265d17d7e3e54d6783316c6027d86d161713ea6cd578106b659d','{vnp_Amount=18944000000, vnp_BankCode=NCB, vnp_BankTranNo=VNP15543386, vnp_CardType=ATM, vnp_OrderInfo=Thanh toan don hang ORD-20260517-4898, vnp_PayDate=20260517222835, vnp_ResponseCode=00, vnp_TmnCode=ZC5M1UBY, vnp_TransactionNo=15543386, vnp_TransactionStatus=00, vnp_TxnRef=36_1779031623547, vnp_SecureHash=631993b426ec6b7d0a41c83cd4dfd5d031faa58a0a9148c16d18c9d48d6fec3dcd3c4b4a0c0923261055d5bf184b103bcbe3598a94f38216b21e58d11837fa35}'),(28,37,'COD','PENDING',221440000,NULL,NULL,NULL,'2026-05-18 12:07:03','2026-05-18 12:07:03',NULL,NULL),(29,38,'CREDIT_CARD','PENDING',49990000,NULL,NULL,NULL,'2026-05-19 23:53:07','2026-05-19 23:53:07',NULL,NULL),(30,39,'CREDIT_CARD','PENDING',23990000,NULL,NULL,NULL,'2026-05-19 23:53:29','2026-05-19 23:53:29',NULL,NULL),(31,40,'CREDIT_CARD','PENDING',13490000,NULL,NULL,NULL,'2026-05-20 00:00:36','2026-05-20 00:00:36',NULL,NULL),(32,41,'VNPAY','PENDING',32990000,NULL,NULL,NULL,'2026-05-20 00:05:08','2026-05-20 00:05:08',NULL,NULL),(33,42,'CREDIT_CARD','PENDING',18490000,NULL,NULL,NULL,'2026-05-20 00:05:43','2026-05-20 00:05:43',NULL,NULL),(34,43,'CREDIT_CARD','PENDING',49990000,NULL,NULL,NULL,'2026-05-20 00:07:52','2026-05-20 00:07:52',NULL,NULL),(35,44,'CREDIT_CARD','PENDING',30980000,NULL,NULL,NULL,'2026-05-20 00:08:55','2026-05-20 00:09:15','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=3098000000&vnp_Command=pay&vnp_CreateDate=20260520000915&vnp_CurrCode=VND&vnp_ExpireDate=20260520002415&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260520-5231&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=44_1779210555425&vnp_Version=2.1.0&vnp_SecureHash=6f9e8c22df8fe93ae20c27153dc76deb1a701179e674fe9b7eb29333a41fe819aa4eed0338078d405072c62b04aa4da0c08969f2c60a412bf4dc6acbd54c951b',NULL),(36,45,'COD','PENDING',47990000,NULL,NULL,NULL,'2026-05-25 17:50:39','2026-05-25 17:50:39',NULL,NULL),(37,46,'COD','PENDING',28990000,NULL,NULL,NULL,'2026-05-25 17:50:49','2026-05-25 17:50:49',NULL,NULL),(38,47,'COD','PENDING',28888888,NULL,NULL,NULL,'2026-05-25 17:50:56','2026-05-25 17:50:56',NULL,NULL),(39,48,'CREDIT_CARD','PENDING',42480000,NULL,NULL,NULL,'2026-05-27 21:03:27','2026-05-27 21:22:12','https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=4248000000&vnp_Command=pay&vnp_CreateDate=20260527212212&vnp_CurrCode=VND&vnp_ExpireDate=20260527213712&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+ORD-20260527-6608&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A9765%2Fapi%2Fpayment%2Fvnpay%2Fcallback&vnp_TmnCode=ZC5M1UBY&vnp_TxnRef=48_1779891732485&vnp_Version=2.1.0&vnp_SecureHash=9a89c1a50f11ca929517301466cffd8f7d57608ad9fb6f69c22e33796ce9369fc40bc41a7c5911407762d7a3939af9d3c7669fb4b3b96f5960b1dfdb39b4f363',NULL),(40,49,'COD','PENDING',13490000,NULL,NULL,NULL,'2026-05-27 21:22:27','2026-05-27 21:22:27',NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `alt_text` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `idx_img_product` (`product_id`),
  CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ảnh sản phẩm (nhiều ảnh/sản phẩm)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (24,12,'http://127.0.0.1:9765/uploads/ce1d3f0b-7f10-4b83-9d12-0c55c69386bc.jpg',NULL,1,0),(25,12,'http://127.0.0.1:9765/uploads/0224ae65-2e74-45e4-94ca-6a97a9cc2da7.jpg',NULL,0,1),(26,12,'http://127.0.0.1:9765/uploads/91f61ef8-67fd-4197-a6d8-f3d81fd013d1.jpg',NULL,0,2),(27,12,'http://127.0.0.1:9765/uploads/22b35ba4-39dd-4c37-a9a4-4342de049ea5.jpg',NULL,0,3),(28,10,'http://127.0.0.1:9765/uploads/59370db0-5266-4447-94b4-0f47cc87f0cd.jpg',NULL,1,0),(29,10,'http://127.0.0.1:9765/uploads/b36ac231-b325-4707-a183-e4d42bd4f1ae.jpg',NULL,0,1),(30,10,'http://127.0.0.1:9765/uploads/f344f325-0bf7-4ed1-8fce-18728adf3900.jpg',NULL,0,2),(31,10,'http://127.0.0.1:9765/uploads/2d0761e3-bf50-4fbe-a99f-5bce4e5aa03c.jpg',NULL,0,3),(32,9,'http://127.0.0.1:9765/uploads/6cbc3dff-fdb0-47b8-950b-1e6aa21d72dc.jpg',NULL,1,0),(33,9,'http://127.0.0.1:9765/uploads/c7847860-c5cd-460d-b927-de0098e9c598.jpg',NULL,0,1),(34,9,'http://127.0.0.1:9765/uploads/da099b14-c150-4a2e-8108-783d2d1d8257.jpg',NULL,0,2),(35,9,'http://127.0.0.1:9765/uploads/812420ed-fc02-4fe3-acaf-885dcabfe6ac.jpg',NULL,0,3),(36,4,'http://127.0.0.1:9765/uploads/e8532755-5dd0-4a6e-8c92-c9eb0c051163.jpg',NULL,1,0),(37,4,'http://127.0.0.1:9765/uploads/abc28b0f-e834-49be-9f9d-8913e7c90d43.jpg',NULL,0,1),(38,4,'http://127.0.0.1:9765/uploads/518f33d2-d8b6-40f2-8926-df4bf801b740.jpg',NULL,0,2),(39,4,'http://127.0.0.1:9765/uploads/85ee109d-b1e0-47e9-b615-971adcbd1e5e.jpg',NULL,0,3),(40,3,'http://127.0.0.1:9765/uploads/cd1f3da2-5019-4611-a5ed-e99a2a03a11b.jpg',NULL,1,0),(41,3,'http://127.0.0.1:9765/uploads/47d2d949-c5c7-419a-a11e-93d620de7588.jpg',NULL,0,1),(42,3,'http://127.0.0.1:9765/uploads/b73131b7-b30b-48a0-b36f-9c23d49e97e7.jpg',NULL,0,2),(43,3,'http://127.0.0.1:9765/uploads/77b8cca7-bc67-4807-90ef-b35118ffc1ec.jpg',NULL,0,3),(44,2,'http://127.0.0.1:9765/uploads/a2dfd500-f1ea-4b52-b28f-f6f31ddb9ac8.jpg',NULL,1,0),(45,2,'http://127.0.0.1:9765/uploads/5c024f8e-0ee1-43ad-9008-5fa9f085e8c6.jpg',NULL,0,1),(46,2,'http://127.0.0.1:9765/uploads/12776c64-70c6-4421-bad5-4273c1740a58.jpg',NULL,0,2),(47,2,'http://127.0.0.1:9765/uploads/d3e36437-8221-43e7-a075-c7785249c517.jpg',NULL,0,3),(48,1,'http://127.0.0.1:9765/uploads/faa13e03-6ee7-4450-a7bd-80420ccdc8d9.jpg',NULL,1,0),(49,1,'http://127.0.0.1:9765/uploads/c05b5a55-5a5e-40d0-b93e-7596fb2d5dde.jpg',NULL,0,1),(50,1,'http://127.0.0.1:9765/uploads/a0cb38dd-f826-486f-8078-7689379dbdb1.jpg',NULL,0,2),(51,1,'http://127.0.0.1:9765/uploads/ef8b88e3-c1b1-4306-8f92-6d9e4e9a3105.jpg',NULL,0,3),(52,11,'http://127.0.0.1:9765/uploads/ac0a78b7-8967-49f4-8b79-d5e0a4d8893a.png',NULL,1,0),(53,11,'http://127.0.0.1:9765/uploads/63923049-73ba-4b9f-8fbf-f6813aa03783.png',NULL,0,1),(54,11,'http://127.0.0.1:9765/uploads/5ceb2525-bfa3-4a3f-afef-c2b4c69deff2.png',NULL,0,2),(55,11,'http://127.0.0.1:9765/uploads/6dae3b54-54f5-45c6-a9bf-e01e1a4f05d8.png',NULL,0,3),(56,8,'http://127.0.0.1:9765/uploads/24884b5c-a6b0-4359-8ba6-2a01ab7690f8.jpg',NULL,1,0),(57,8,'http://127.0.0.1:9765/uploads/0abc444e-a8fa-4337-b1af-8717c5d636e0.jpg',NULL,0,1),(58,8,'http://127.0.0.1:9765/uploads/46a3bc06-429a-4cc1-98a5-624258a235a6.jpg',NULL,0,2),(59,8,'http://127.0.0.1:9765/uploads/4f5562cb-f942-4ebc-a0df-0da69144d5d0.jpg',NULL,0,3),(60,7,'http://127.0.0.1:9765/uploads/ab7f53a4-3630-4880-a44e-85b0b1b9791c.png',NULL,1,0),(61,7,'http://127.0.0.1:9765/uploads/5bc699b3-b648-4fe6-a067-daac4f26844c.png',NULL,0,1),(62,7,'http://127.0.0.1:9765/uploads/e67c3155-feb4-49a1-b8d3-203a56cff730.png',NULL,0,2),(63,7,'http://127.0.0.1:9765/uploads/093512b7-c494-4426-94ea-47e4c08afad7.png',NULL,0,3),(64,6,'http://127.0.0.1:9765/uploads/31e3cc7a-55c2-43a9-a095-36c1eb99feef.jpg',NULL,1,0),(65,6,'http://127.0.0.1:9765/uploads/6b87944b-2adc-4d8f-9c38-74657673fb40.jpg',NULL,0,1),(66,6,'http://127.0.0.1:9765/uploads/261b85b4-249f-4d17-a1ba-8754570ef649.jpg',NULL,0,2),(67,6,'http://127.0.0.1:9765/uploads/ed140268-9c68-4669-bb1d-b724d7f76e3a.jpg',NULL,0,3),(72,5,'http://127.0.0.1:9765/uploads/5677e3d5-e314-4f35-8329-e2c369397e6b.png',NULL,1,0),(73,5,'http://127.0.0.1:9765/uploads/152e3511-daec-4f34-bb88-1c2ac7ea1f4f.png',NULL,0,1),(74,5,'http://127.0.0.1:9765/uploads/704a15a6-f6c5-4252-8218-9fa156c058dc.png',NULL,0,2),(75,5,'http://127.0.0.1:9765/uploads/5d4c56c8-4ee3-449f-96fd-37fb8cd8237b.png',NULL,0,3);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_specs`
--

DROP TABLE IF EXISTS `product_specs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_specs` (
  `spec_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `cpu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: Intel Core i7-13700H',
  `ram` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: 16GB DDR5 5200MHz',
  `storage` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: 512GB NVMe PCIe 4.0',
  `display` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: 15.6" FHD IPS 144Hz',
  `gpu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: NVIDIA RTX 4060 8GB',
  `os` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: Windows 11 Home',
  `weight_kg` decimal(4,2) DEFAULT NULL,
  `battery_wh` int DEFAULT NULL COMMENT 'Dung lượng pin (Wh)',
  `ports` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mô tả cổng kết nối',
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`spec_id`),
  UNIQUE KEY `uq_spec_product` (`product_id`),
  CONSTRAINT `fk_spec_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông số kỹ thuật chi tiết sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_specs`
--

LOCK TABLES `product_specs` WRITE;
/*!40000 ALTER TABLE `product_specs` DISABLE KEYS */;
INSERT INTO `product_specs` VALUES (1,1,'AMD Ryzen 5 7535HS','8GB DDR5 4800MHz','512GB NVMe PCIe 3.0','15.6\" FHD IPS 144Hz','NVIDIA RTX 2050 4GB','Windows 11 Home',2.30,90,NULL,NULL),(2,2,'Intel Core i7-13650HX','16GB DDR5 4800MHz','1TB NVMe PCIe 4.0','16\" QHD+ IPS 240Hz','NVIDIA RTX 4060 8GB','Windows 11 Home',2.50,90,NULL,NULL),(3,3,'Intel Core Ultra 5 125H','16GB LPDDR5X','512GB NVMe PCIe 4.0','13.4\" OLED 2.8K 60Hz','Intel Arc Graphics','Windows 11 Pro',1.19,55,NULL,NULL),(4,4,'AMD Ryzen 5 7530U','16GB DDR4 3200MHz','512GB NVMe PCIe 3.0','14\" FHD IPS 60Hz','AMD Radeon Graphics','Windows 11 Pro',1.56,57,NULL,NULL),(5,5,'Apple M3 (8-core CPU)','8GB Unified Memory','256GB SSD','13.6\" Liquid Retina 2560x1664','Apple M3 10-core GPU','macOS Sonoma',1.24,52,NULL,NULL),(6,6,'Intel Core i7-14700HX','32GB DDR5 5600MHz','2TB NVMe PCIe 4.0','16\" QHD+ OLED 240Hz','NVIDIA RTX 4070 8GB','Windows 11 Pro',2.40,99,NULL,NULL),(7,7,'Intel Core i5-1335U (10 nhân, up to 4.6GHz)','16GB DDR4 3200MHz','512GB NVMe PCIe 3.0','15.6\" FHD IPS 60Hz 250nits','Intel Iris Xe Graphics','Windows 11 Home',1.75,41,NULL,NULL),(8,8,'Intel Core i5-1235U (10 nhân, up to 4.4GHz)','8GB DDR4 3200MHz','256GB NVMe PCIe 3.0','15.6\" FHD IPS 60Hz 250nits','Intel Iris Xe Graphics','Windows 11 Home',1.70,42,NULL,NULL),(9,9,'Intel Core i7-13620H (10 nhân, up to 4.9GHz)','16GB DDR5 4800MHz','512GB NVMe PCIe 4.0','15.6\" FHD IPS 144Hz','NVIDIA RTX 4060 8GB','Windows 11 Home',2.25,53,NULL,NULL),(10,10,'Intel Core i9-14900HX (24 nhân, up to 5.8GHz)','32GB DDR5 5600MHz','1TB NVMe PCIe 4.0','16\" QHD 240Hz','NVIDIA RTX 4080 12GB','Windows 11 Home',2.60,99,NULL,NULL),(11,11,'Apple M3 (8-core CPU, 4nm)','8GB Unified Memory','512GB SSD','14.2\" Liquid Retina XDR 3024x1964 120Hz','Apple M3 10-core GPU','macOS Sonoma',1.55,70,NULL,NULL),(12,12,'Intel Core Ultra 7 155H (16 nhân, up to 4.8GHz)','16GB LPDDR5X 7467MHz','1TB NVMe PCIe 4.0','14\" OLED 2.8K 120Hz 550nits','Intel Arc Graphics','Windows 11 Home',1.20,75,NULL,NULL);
/*!40000 ALTER TABLE `product_specs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `brand_id` int NOT NULL,
  `category_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(280) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã hàng nội bộ',
  `base_price` decimal(15,0) NOT NULL COMMENT 'Giá niêm yết (VNĐ)',
  `sale_price` decimal(15,0) DEFAULT NULL COMMENT 'Giá bán thực tế, NULL = dùng base_price',
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uq_product_sku` (`sku`),
  UNIQUE KEY `uq_product_slug` (`slug`),
  KEY `idx_product_brand` (`brand_id`),
  KEY `idx_product_category` (`category_id`),
  CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm laptop';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,3,6,'Asus TUF Gaming A15 FA506NF','asus-tuf-gaming-a15-fa506nf','AS-TUF-A15-FA506NF',18990000,17490000,'Laptop gaming tầm trung AMD Ryzen 5 7535HS, RTX 2050, màn 144Hz',1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(2,3,7,'Asus ROG Strix G16 G614JV','asus-rog-strix-g16-g614jv','AS-ROG-G16-G614JV',34990000,32990000,'Gaming cao cấp Intel Core i7-13650HX, RTX 4060 8GB, QHD 240Hz',1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(3,1,5,'Dell XPS 13 9340','dell-xps-13-9340','DE-XPS13-9340',32990000,NULL,'Ultrabook siêu mỏng Intel Core Ultra 5 125H, OLED 2.8K',1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(4,4,3,'Lenovo ThinkPad E14 Gen 5','lenovo-thinkpad-e14-gen5','LV-TPE14-GEN5',22490000,20990000,'Laptop văn phòng bền bỉ, AMD Ryzen 5 7530U, Full HD IPS',1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(5,5,5,'Apple MacBook Air M3 13 inch','apple-macbook-air-m3-13','AP-MBA-M3-13',29990000,28888888,'MacBook Air chip M3, màn Liquid Retina 13.6\", pin 18 giờ',1,'2026-04-07 00:02:07','2026-05-25 17:45:09'),(6,6,4,'MSI Creator M16 HX','msi-creator-m16-hx','MS-CRM16-HX',39990000,37990000,'Laptop đồ hoạ Intel Core i7-14700HX, RTX 4070, màn QHD+ 240Hz',1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(7,2,3,'HP Pavilion 15-eg3037TX','hp-pavilion-15-eg3037tx','HP-PAV15-EG3037TX',19990000,18490000,'Laptop sinh viên HP Pavilion 15, Core i5-1335U, RAM 16GB, màn FHD IPS',1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(8,3,3,'Asus Vivobook 15 X1504ZA','asus-vivobook-15-x1504za','AS-VB15-X1504ZA',14990000,13490000,'Laptop văn phòng giá rẻ, Core i5-1235U, thiết kế mỏng nhẹ, pin 42Wh',1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(9,6,6,'MSI Cyborg 15 B13WFKG','msi-cyborg-15-b13wfkg','MS-CYB15-B13WFKG',26990000,23990000,'Gaming tầm trung Core i7-13620H, RTX 4060, màn FHD 144Hz',1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(10,6,7,'MSI Crosshair 16 HX AI','msi-crosshair-16-hx-ai','MS-CRH16-HX',59990000,47990000,'Gaming đỉnh cao Core i9-14900HX, RTX 4080, màn QHD 240Hz',1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(11,5,3,'Apple MacBook Pro 14 inch M3','apple-macbook-pro-14-m3','AP-MBP14-M3',49990000,49990000,'MacBook Pro 14 inch M3, màn Liquid Retina XDR 3024x1964, pin 22h',1,'2026-04-20 22:35:59','2026-04-20 22:35:59'),(12,3,5,'Asus Zenbook 14 OLED UX3405MA','asus-zenbook-14-oled-ux3405ma','AS-ZB14-UX3405MA',30990000,28990000,'Ultrabook Core Ultra 7 155H, màn OLED 2.8K 120Hz, pin 75Wh',1,'2026-04-20 22:35:59','2026-04-20 22:35:59');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_products`
--

DROP TABLE IF EXISTS `promotion_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL COMMENT 'Nếu không có bản ghi nào = áp dụng toàn đơn',
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_product` (`promotion_id`,`product_id`),
  KEY `fk_pp_product` (`product_id`),
  CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`promotion_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giới hạn khuyến mãi cho sản phẩm cụ thể';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_products`
--

LOCK TABLES `promotion_products` WRITE;
/*!40000 ALTER TABLE `promotion_products` DISABLE KEYS */;
INSERT INTO `promotion_products` VALUES (1,2,1),(2,2,2);
/*!40000 ALTER TABLE `promotion_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `promotion_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('PERCENT','FIXED','FREE_SHIP') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `discount_value` decimal(15,2) NOT NULL COMMENT '% hoặc số tiền giảm (VNĐ)',
  `max_discount` decimal(15,0) DEFAULT NULL COMMENT 'Giảm tối đa (áp dụng cho loại percent)',
  `min_order_amount` decimal(15,0) NOT NULL DEFAULT '0' COMMENT 'Đơn hàng tối thiểu để áp dụng',
  `max_uses` int DEFAULT NULL COMMENT 'NULL = không giới hạn',
  `used_count` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci,
  `min_qty` int NOT NULL DEFAULT '0',
  `max_uses_per_user` int DEFAULT NULL,
  `apply_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all' COMMENT 'all | select',
  `category_ids` json DEFAULT NULL COMMENT 'JSON array of category IDs when apply_mode=select',
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`promotion_id`),
  UNIQUE KEY `uq_promo_code` (`code`),
  KEY `idx_promo_dates` (`starts_at`,`ends_at`),
  KEY `idx_promo_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã khuyến mãi và chương trình giảm giá';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,'WELCOME10','Giảm 10% cho khách mới đăng ký','PERCENT',10.00,2000000,5000000,500,0,0,'2026-01-01 00:00:00','2026-12-31 23:59:59','2026-04-07 00:02:07','123',0,NULL,'all',NULL,NULL,'2026-05-07 16:35:57'),(2,'GAMING500K','Giảm 500K laptop gaming','FIXED',500000.00,NULL,20000000,200,0,1,'2026-03-01 00:00:00','2026-06-30 00:00:00','2026-04-07 00:02:07',NULL,0,NULL,'all',NULL,NULL,NULL),(3,'SUMMER15','Sale hè 15%','PERCENT',15.00,3000000,15000000,NULL,0,1,'2026-06-01 00:00:00','2026-08-31 00:00:00','2026-04-07 00:02:07',NULL,0,NULL,'all',NULL,NULL,NULL),(4,'TETDOCLAP','Khuyến mãi 30/4','PERCENT',10.00,3000000,500000,304,0,1,'2026-04-30 00:00:00','2026-05-10 23:59:59','2026-05-07 16:37:49','Mừng ngày lễ giải phóng',0,0,'all',NULL,'system','2026-05-07 16:37:49');
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_audit`
--

DROP TABLE IF EXISTS `refund_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_audit` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `old_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` int DEFAULT NULL,
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `fk_raudit_staff` (`staff_id`),
  KEY `idx_raudit_return` (`return_id`),
  KEY `idx_raudit_created` (`created_at`),
  CONSTRAINT `fk_raudit_return` FOREIGN KEY (`return_id`) REFERENCES `return_requests` (`return_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_raudit_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_audit`
--

LOCK TABLES `refund_audit` WRITE;
/*!40000 ALTER TABLE `refund_audit` DISABLE KEYS */;
INSERT INTO `refund_audit` VALUES (1,1,'PENDING','APPROVED',NULL,'ok','2026-05-05 10:08:31'),(2,1,'APPROVED','REFUNDED',NULL,'Hoàn tiền qua CASH — ref: 1123422ABC','2026-05-05 10:09:04'),(4,3,NULL,'PENDING',NULL,'Khách hàng tạo yêu cầu hoàn trả','2026-05-17 22:52:21'),(5,3,'PENDING','APPROVED',NULL,'ok','2026-05-17 23:44:16'),(6,3,'APPROVED','REFUNDED',NULL,'Hoàn tiền qua BANK — ref: null','2026-05-17 23:45:05');
/*!40000 ALTER TABLE `refund_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_request_items`
--

DROP TABLE IF EXISTS `return_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_request_items` (
  `rri_id` int NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `order_item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `condition_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tình trạng hàng trả',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `refund_amount` decimal(15,0) DEFAULT NULL,
  PRIMARY KEY (`rri_id`),
  UNIQUE KEY `uq_return_line` (`return_id`,`order_item_id`),
  KEY `fk_rri_oi` (`order_item_id`),
  CONSTRAINT `fk_rri_oi` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`item_id`),
  CONSTRAINT `fk_rri_return` FOREIGN KEY (`return_id`) REFERENCES `return_requests` (`return_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết sản phẩm trong yêu cầu trả hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_request_items`
--

LOCK TABLES `return_request_items` WRITE;
/*!40000 ALTER TABLE `return_request_items` DISABLE KEYS */;
INSERT INTO `return_request_items` VALUES (2,3,67,1,NULL,'khong mua nua',13490000);
/*!40000 ALTER TABLE `return_request_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_requests`
--

DROP TABLE IF EXISTS `return_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_requests` (
  `return_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','RECEIVED','REFUNDED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lý do khách',
  `staff_note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú nội bộ / lý do từ chối',
  `refund_amount` decimal(15,0) DEFAULT NULL COMMENT 'Số tiền hoàn (snapshot khi duyệt)',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  `processed_by` int DEFAULT NULL COMMENT 'staff xử lý',
  `transaction_ref` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã giao dịch hoàn tiền thực tế',
  `refund_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Phương thức hoàn: BANK / CASH / MOMO / VNPAY',
  PRIMARY KEY (`return_id`),
  KEY `idx_return_order` (`order_id`),
  KEY `idx_return_user` (`user_id`),
  KEY `idx_return_status` (`status`),
  KEY `fk_return_staff` (`processed_by`),
  CONSTRAINT `fk_return_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `fk_return_staff` FOREIGN KEY (`processed_by`) REFERENCES `staff` (`staff_id`),
  CONSTRAINT `fk_return_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yêu cầu đổi trả / hoàn tiền';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_requests`
--

LOCK TABLES `return_requests` WRITE;
/*!40000 ALTER TABLE `return_requests` DISABLE KEYS */;
INSERT INTO `return_requests` VALUES (1,3,2,'REFUNDED','Sản phẩm bị lỗi màn hình, có đốm sáng góc trái.','ok',NULL,'2026-04-13 13:35:58','2026-05-05 10:09:04',NULL,'1123422ABC','CASH'),(3,36,6,'REFUNDED','khong mua nua','ok',13490000,'2026-05-17 22:52:21','2026-05-17 23:45:05',NULL,NULL,'BANK');
/*!40000 ALTER TABLE `return_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_images`
--

DROP TABLE IF EXISTS `review_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `idx_ri_review` (`review_id`),
  CONSTRAINT `fk_ri_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`review_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_images`
--

LOCK TABLES `review_images` WRITE;
/*!40000 ALTER TABLE `review_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `order_item_id` int DEFAULT NULL COMMENT 'Liên kết để xác minh đã mua hàng',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` tinyint NOT NULL COMMENT '1-5 sao',
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = đã xác minh mua hàng',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('PENDING','APPROVED','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reply_text` text COLLATE utf8mb4_unicode_ci COMMENT 'Phản hồi từ cửa hàng',
  `replied_at` datetime DEFAULT NULL,
  `replied_by` int DEFAULT NULL COMMENT 'staff trả lời',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_review_user_item` (`user_id`,`order_item_id`),
  KEY `idx_review_product` (`product_id`),
  KEY `fk_review_order_item` (`order_item_id`),
  KEY `fk_review_replier` (`replied_by`),
  KEY `idx_review_status` (`status`),
  CONSTRAINT `fk_review_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`item_id`),
  CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_review_replier` FOREIGN KEY (`replied_by`) REFERENCES `staff` (`staff_id`),
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `chk_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đánh giá sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (3,11,7,39,NULL,5,'san pham tot',1,1,'APPROVED',NULL,NULL,NULL,'2026-05-14 15:37:39','2026-05-15 21:39:25'),(4,11,8,40,NULL,4,'tam duoc th',1,1,'APPROVED',NULL,NULL,NULL,'2026-05-14 15:37:46','2026-05-15 21:39:27'),(5,11,9,41,NULL,5,'dich vu tot',1,1,'APPROVED',NULL,NULL,NULL,'2026-05-14 15:37:53','2026-05-15 21:39:29'),(6,6,4,66,NULL,5,'totvagqgqềqfq',1,1,'PENDING',NULL,NULL,NULL,'2026-05-17 22:45:44','2026-05-17 22:45:44');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json DEFAULT NULL COMMENT 'Danh sách quyền dạng JSON array',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_role_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vai trò nhân viên: admin, kho, thu ngân...';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin','[\"staff\", \"orders\", \"refunds\", \"warranty\", \"inventory\", \"reports\", \"products\", \"customers\", \"promotions\"]'),(2,'store_manager','[\"orders\", \"refunds\", \"warranty\", \"inventory\", \"reports\"]'),(3,'sales_staff','[\"orders\", \"refunds\", \"warranty\", \"inventory\"]');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `shipment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `carrier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'GHN, GHTK, VNPost...',
  `tracking_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PREPARING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú giao hàng',
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`shipment_id`),
  UNIQUE KEY `uq_shipment_order` (`order_id`),
  CONSTRAINT `fk_shipment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vận chuyển và giao hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (1,1,'GHN','GHN123456','DELIVERED',NULL,'2026-01-01 15:00:00','2026-01-02 10:00:00','2026-04-13 13:35:58','2026-04-13 13:35:58'),(2,2,'GHTK','GHTK78910','IN_TRANSIT',NULL,'2026-02-01 14:00:00',NULL,'2026-04-13 13:35:58','2026-04-13 13:35:58');
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logo, banner, SEO mặc định, v.v.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES ('contact_hotline','1900xxxx','2026-04-07 00:02:07'),('default_meta_description','Mua laptop Dell, HP, Asus, Lenovo, Apple... Giao hàng toàn quốc, trả góp 0%.','2026-04-07 00:02:07'),('default_meta_title','Laptop Store - Chuỗi cửa hàng laptop chính hãng','2026-04-07 00:02:07'),('home_banner_url','https://cdn.example.com/banner-home.jpg','2026-04-07 00:02:07'),('site_logo_url','https://cdn.example.com/logo.svg','2026-04-07 00:02:07');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `role_id` int NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `uq_staff_email` (`email`),
  KEY `fk_staff_store` (`store_id`),
  KEY `fk_staff_role` (`role_id`),
  CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_staff_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhân viên từng chi nhánh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,1,1,'Quản trị hệ thống','adminlaptopshop24@gmail.com','0901000001','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',1,'2026-04-07 00:02:07','2026-05-22 18:51:03'),(2,1,2,'Nguyễn Manager','manager@test.com','0911111111','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',1,'2026-04-13 13:35:58','2026-05-22 18:51:02'),(3,1,3,'Trần Sales','sales@test.com','0922222222','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',1,'2026-04-13 13:35:58','2026-04-13 14:43:52'),(4,1,1,'Lê Warehouse','warehouse@test.com','0933333333','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',1,'2026-04-13 13:35:58','2026-05-14 23:56:13');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_inventory`
--

DROP TABLE IF EXISTS `store_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0' COMMENT 'Số lượng hiện tại',
  `min_quantity` int NOT NULL DEFAULT '5' COMMENT 'Ngưỡng cảnh báo hết hàng',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `uq_inventory` (`store_id`,`product_id`),
  KEY `fk_inv_product` (`product_id`),
  CONSTRAINT `fk_inv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `fk_inv_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tồn kho từng sản phẩm tại từng chi nhánh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_inventory`
--

LOCK TABLES `store_inventory` WRITE;
/*!40000 ALTER TABLE `store_inventory` DISABLE KEYS */;
INSERT INTO `store_inventory` VALUES (1,1,1,72,5,'2026-05-25 17:39:58'),(2,1,2,32,3,'2026-05-25 17:39:21'),(3,1,3,25,3,'2026-05-25 17:38:45'),(4,1,4,59,5,'2026-05-25 17:38:06'),(5,1,5,5375,4,'2026-05-25 17:45:09'),(6,1,6,18,2,'2026-05-25 17:44:22'),(7,2,1,72,5,'2026-05-25 17:39:58'),(8,2,2,32,3,'2026-05-25 17:39:21'),(9,2,3,25,3,'2026-05-25 17:38:45'),(10,2,4,59,5,'2026-05-25 17:38:06'),(11,2,5,6375,4,'2026-05-27 21:06:46'),(12,2,6,18,2,'2026-05-25 17:44:22'),(13,3,1,72,5,'2026-05-25 17:39:58'),(14,3,2,32,3,'2026-05-25 17:39:21'),(15,3,3,25,3,'2026-05-25 17:38:45'),(16,3,4,59,5,'2026-05-25 17:38:06'),(17,3,5,5375,4,'2026-05-25 17:45:09'),(18,3,6,18,2,'2026-05-25 17:44:22'),(19,4,1,72,5,'2026-05-25 17:39:58'),(20,4,2,32,3,'2026-05-25 17:39:21'),(21,4,3,25,3,'2026-05-25 17:38:45'),(22,4,4,59,5,'2026-05-25 17:38:06'),(23,4,5,5375,4,'2026-05-25 17:45:09'),(24,4,6,18,2,'2026-05-25 17:44:22'),(25,5,1,72,5,'2026-05-25 17:39:58'),(26,5,2,32,3,'2026-05-25 17:39:21'),(27,5,3,25,3,'2026-05-25 17:38:45'),(28,5,4,59,5,'2026-05-25 17:38:06'),(29,5,5,5375,4,'2026-05-25 17:45:09'),(30,5,6,18,2,'2026-05-25 17:44:22'),(31,1,7,68,5,'2026-05-25 17:44:10'),(32,1,8,83,5,'2026-05-25 17:43:14'),(33,1,9,30,3,'2026-05-25 17:36:15'),(34,1,10,10,2,'2026-05-25 17:35:48'),(35,1,11,23,3,'2026-05-25 17:42:18'),(36,1,12,29,2,'2026-05-25 16:58:35'),(37,2,7,68,5,'2026-05-25 17:44:10'),(38,2,8,83,5,'2026-05-25 17:43:14'),(39,2,9,30,3,'2026-05-25 17:36:15'),(40,2,10,10,2,'2026-05-25 17:35:48'),(41,2,11,23,3,'2026-05-25 17:42:18'),(42,2,12,29,2,'2026-05-25 16:58:35'),(43,3,7,68,5,'2026-05-25 17:44:10'),(44,3,8,83,5,'2026-05-25 17:43:14'),(45,3,9,30,3,'2026-05-25 17:36:15'),(46,3,10,10,2,'2026-05-25 17:35:48'),(47,3,11,23,3,'2026-05-25 17:42:18'),(48,3,12,29,2,'2026-05-25 16:58:35'),(49,4,7,68,5,'2026-05-25 17:44:10'),(50,4,8,83,5,'2026-05-25 17:43:14'),(51,4,9,30,3,'2026-05-25 17:36:15'),(52,4,10,10,2,'2026-05-25 17:35:48'),(53,4,11,23,3,'2026-05-25 17:42:18'),(54,4,12,29,2,'2026-05-25 16:58:35'),(55,5,7,68,5,'2026-05-25 17:44:10'),(56,5,8,83,5,'2026-05-25 17:43:14'),(57,5,9,30,3,'2026-05-25 17:36:15'),(58,5,10,10,2,'2026-05-25 17:35:48'),(59,5,11,23,3,'2026-05-25 17:42:18'),(60,5,12,29,2,'2026-05-25 16:58:35');
/*!40000 ALTER TABLE `store_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL COMMENT 'Toạ độ GPS',
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi nhánh cửa hàng trong chuỗi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'Laptop Store - Hoàn Kiếm','15 Hàng Bài','Hoàn Kiếm','Hà Nội','0241234567','hoankiem@laptopstore.vn',NULL,NULL,1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(2,'Laptop Store - Cầu Giấy','89 Xuân Thuỷ','Cầu Giấy','Hà Nội','0241234568','caugiay@laptopstore.vn',NULL,NULL,1,'2026-04-07 00:02:07','2026-04-07 00:02:07'),(3,'Laptop Store - Quận 7','200 Nguyễn Thị Minh Khai','Quận 1','TP.HCM','0281234567','quan1@laptopstore.vn',NULL,NULL,0,'2026-04-07 00:02:07','2026-05-09 08:55:07'),(4,'Laptop Store - Bình Thạnh','45 Đinh Tiên Hoàng','Bình Thạnh','TP.HCM','0281234568','binhthanh@laptopstore.vn',NULL,NULL,1,'2026-04-07 00:02:07','2026-05-18 22:56:03'),(5,'Laptop Store - Hải Phòng','72 Lạch Tray','Ngô Quyền','Hải Phòng','0221234567','haiphong@laptopstore.vn',NULL,NULL,1,'2026-04-07 00:02:07','2026-04-07 00:02:07');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','LOCKED','UNVERIFIED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNVERIFIED',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `dob` date DEFAULT NULL COMMENT 'Ngày sinh khách hàng',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEW' COMMENT 'Phân loại: NEW | REGULAR | VIP',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `idx_user_phone` (`phone`),
  KEY `idx_user_type` (`type`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản khách hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Nguyễn Văn A','user1@test.com','0901111111','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',NULL,'ACTIVE','2026-04-13 13:35:58','2026-05-06 23:47:10','2026-05-06 23:47:10',NULL,'NEW'),(2,'Trần Thị B','user2@test.com','0902222222','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',NULL,'LOCKED','2026-04-13 13:35:58','2026-05-05 21:04:28',NULL,NULL,'NEW'),(3,'Lê Văn C','locked@test.com','0903333333','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',NULL,'LOCKED','2026-04-13 13:35:58','2026-04-13 14:23:10',NULL,NULL,'NEW'),(4,'Phạm Thị D','unverified@test.com','0904444444','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',NULL,'UNVERIFIED','2026-04-13 13:35:58','2026-04-13 14:23:10',NULL,NULL,'NEW'),(5,'Nguyễn Test','newuser@test.com','0999999999','$2a$10$E2Oz/g.YTrF2rMPs6Z3htOv7kN.aQtyBLB4wDDotVnQybU.KtcH42',NULL,'ACTIVE','2026-04-13 13:44:16','2026-05-05 21:04:03','2026-04-13 14:22:30',NULL,'NEW'),(6,'Vũ Xuân Hùng','vuhung220224@gmail.com','0327100717','$2a$10$5TNLAr/YyugyFo2i0iKvku1OectejLvrKG8TUdetlJg8kKYsdqHaS',NULL,'ACTIVE','2026-04-20 17:44:47','2026-05-25 17:47:08','2026-05-25 17:47:08',NULL,'NEW'),(7,'Nguyễn Test User','test@laptopstore.vn','0901234567','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'ACTIVE','2026-04-20 22:35:59','2026-04-20 22:35:59',NULL,NULL,'NEW'),(8,'Trần Demo User','demo@laptopstore.vn','0987654321','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'ACTIVE','2026-04-20 22:35:59','2026-04-20 22:35:59',NULL,NULL,'NEW'),(9,'Hùng Vũ','vuhung220204@gmail.com','0988432142','$2a$10$BCXAeSS4n02TZ2h90D1giuE3wLf1LVdyamLgT8ROljmhAEnpw9zzi',NULL,'ACTIVE','2026-04-20 23:50:07','2026-04-20 23:50:07',NULL,NULL,'NEW'),(10,'Hùng Vũ','newuser99@test.com','0999999989','$2a$10$FbYm/BuRaIIprkhnxyOfTuUW9E.XCA2Mx6O9Tw8MV2l8OU8RS7yzG',NULL,'ACTIVE','2026-04-22 16:35:18','2026-05-04 10:59:19',NULL,NULL,'NEW'),(11,'Hùng Vũ','vuhung22024@gmail.com','0984602824','$2a$10$xNp7VnzGauLEPO.xUlYS5.8URRQjRYByQZwWelwmBBXgQtwZ8zrWu','','ACTIVE','2026-04-22 16:46:22','2026-05-14 10:02:23','2026-05-14 10:02:23',NULL,'NEW'),(12,'Vũ Xuân Hùng','adminlaptopshop24@gmail.com','0327100717','$2a$10$QzcLFpaHJkBvnZ1BSkvUVuBl2wshZH4LSs9.Wuytq8NyTTczeebWy',NULL,'ACTIVE','2026-05-15 19:37:30','2026-05-17 04:19:23','2026-05-17 04:19:23',NULL,'NEW'),(13,'Vũ Xuân Hùng','adminlaptopshop23@gmail.com','0327100717','$2a$10$tAR8SvuEiSMwOel6AF.qsOh22867nxnofTypRbp9UjZuP.Kt.joFW',NULL,'ACTIVE','2026-05-15 19:38:01','2026-05-15 19:38:01',NULL,NULL,'NEW'),(14,'Nguyễn Văn A','emo0vxh24@gmail.com','03857641964','$2a$10$kiHnTh.uvhY3KmkVqXd0wOKq3MZ/U93o2eLalrYskZRAjptTNEqG2',NULL,'ACTIVE','2026-05-27 21:00:57','2026-05-27 21:01:03','2026-05-27 21:01:03',NULL,'NEW');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_inventory_status`
--

DROP TABLE IF EXISTS `v_inventory_status`;
/*!50001 DROP VIEW IF EXISTS `v_inventory_status`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_inventory_status` AS SELECT 
 1 AS `store_name`,
 1 AS `product_name`,
 1 AS `sku`,
 1 AS `quantity`,
 1 AS `min_quantity`,
 1 AS `stock_status`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_monthly_revenue`
--

DROP TABLE IF EXISTS `v_monthly_revenue`;
/*!50001 DROP VIEW IF EXISTS `v_monthly_revenue`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_monthly_revenue` AS SELECT 
 1 AS `store_name`,
 1 AS `month`,
 1 AS `total_orders`,
 1 AS `revenue`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_top_products`
--

DROP TABLE IF EXISTS `v_top_products`;
/*!50001 DROP VIEW IF EXISTS `v_top_products`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_top_products` AS SELECT 
 1 AS `product_id`,
 1 AS `name`,
 1 AS `sku`,
 1 AS `brand`,
 1 AS `total_sold`,
 1 AS `total_revenue`,
 1 AS `avg_rating`,
 1 AS `review_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `warranty_requests`
--

DROP TABLE IF EXISTS `warranty_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_requests` (
  `warranty_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int NOT NULL,
  `order_item_id` int NOT NULL,
  `handled_by` int DEFAULT NULL COMMENT 'Staff tiếp nhận xử lý, NULL = chưa có ai nhận',
  `status` enum('PENDING','APPROVED','IN_REPAIR','COMPLETED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `issue_description` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mô tả lỗi / vấn đề của máy do khách nhập',
  `staff_note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú kỹ thuật của staff',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Lý do từ chối (khi status = REJECTED)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL COMMENT 'Thời điểm staff duyệt hoặc từ chối',
  `completed_at` datetime DEFAULT NULL COMMENT 'Thời điểm trả máy cho khách',
  PRIMARY KEY (`warranty_id`),
  KEY `fk_warranty_order_item` (`order_item_id`),
  KEY `fk_warranty_staff` (`handled_by`),
  KEY `idx_warranty_user` (`user_id`),
  KEY `idx_warranty_order` (`order_id`),
  KEY `idx_warranty_status` (`status`),
  KEY `idx_warranty_created` (`created_at`),
  CONSTRAINT `fk_warranty_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `fk_warranty_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`item_id`),
  CONSTRAINT `fk_warranty_staff` FOREIGN KEY (`handled_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warranty_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yêu cầu bảo hành sản phẩm của khách hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranty_requests`
--

LOCK TABLES `warranty_requests` WRITE;
/*!40000 ALTER TABLE `warranty_requests` DISABLE KEYS */;
INSERT INTO `warranty_requests` VALUES (1,6,36,65,NULL,'PENDING','man hinh bi xuoc',NULL,NULL,'2026-05-17 22:47:48','2026-05-17 22:47:48',NULL,NULL),(2,6,36,66,NULL,'PENDING','agagreqgeh',NULL,NULL,'2026-05-17 22:55:22','2026-05-17 22:55:22',NULL,NULL),(3,6,36,67,1,'REJECTED','ưthwhwthrth',NULL,'khong','2026-05-17 23:08:07','2026-05-17 23:45:34','2026-05-17 23:45:34',NULL);
/*!40000 ALTER TABLE `warranty_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `wishlist_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlist_id`),
  UNIQUE KEY `uq_wishlist` (`user_id`,`product_id`),
  KEY `fk_wl_product` (`product_id`),
  CONSTRAINT `fk_wl_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yêu thích';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
INSERT INTO `wishlists` VALUES (1,1,10,'2026-04-20 22:35:59'),(2,1,11,'2026-04-20 22:35:59'),(3,2,3,'2026-04-20 22:35:59'),(4,2,12,'2026-04-20 22:35:59'),(6,6,7,'2026-04-22 12:10:03'),(15,11,8,'2026-04-23 08:18:21'),(16,11,9,'2026-04-23 08:18:22'),(17,11,10,'2026-04-23 08:31:07'),(18,11,2,'2026-05-08 20:20:49'),(19,11,7,'2026-05-11 18:14:22'),(20,6,10,'2026-05-14 21:59:47'),(22,12,7,'2026-05-15 19:43:31'),(23,6,5,'2026-05-25 18:01:50');
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `v_inventory_status`
--

/*!50001 DROP VIEW IF EXISTS `v_inventory_status`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_inventory_status` AS select `s`.`name` AS `store_name`,`p`.`name` AS `product_name`,`p`.`sku` AS `sku`,`si`.`quantity` AS `quantity`,`si`.`min_quantity` AS `min_quantity`,if((`si`.`quantity` <= `si`.`min_quantity`),'LOW_STOCK','OK') AS `stock_status` from ((`store_inventory` `si` join `stores` `s` on((`s`.`store_id` = `si`.`store_id`))) join `products` `p` on((`p`.`product_id` = `si`.`product_id`))) order by `s`.`store_id`,`p`.`product_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_monthly_revenue`
--

/*!50001 DROP VIEW IF EXISTS `v_monthly_revenue`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_monthly_revenue` AS select `s`.`name` AS `store_name`,date_format(`o`.`ordered_at`,'%Y-%m') AS `month`,count(0) AS `total_orders`,sum(`o`.`total_amount`) AS `revenue` from (`orders` `o` join `stores` `s` on((`s`.`store_id` = `o`.`store_id`))) where (`o`.`status` in ('completed','delivered')) group by `s`.`store_id`,date_format(`o`.`ordered_at`,'%Y-%m') order by `month` desc,`revenue` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_top_products`
--

/*!50001 DROP VIEW IF EXISTS `v_top_products`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_top_products` AS select `p`.`product_id` AS `product_id`,`p`.`name` AS `name`,`p`.`sku` AS `sku`,`b`.`name` AS `brand`,sum(`oi`.`quantity`) AS `total_sold`,sum(`oi`.`total_price`) AS `total_revenue`,avg(`r`.`rating`) AS `avg_rating`,count(distinct `r`.`review_id`) AS `review_count` from ((((`order_items` `oi` join `products` `p` on((`p`.`product_id` = `oi`.`product_id`))) join `brands` `b` on((`b`.`brand_id` = `p`.`brand_id`))) join `orders` `o` on((`o`.`order_id` = `oi`.`order_id`))) left join `reviews` `r` on(((`r`.`product_id` = `p`.`product_id`) and (`r`.`is_verified` = 1)))) where (`o`.`status` in ('completed','delivered')) group by `p`.`product_id`,`p`.`name`,`p`.`sku`,`b`.`name` order by `total_sold` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 14:28:47
