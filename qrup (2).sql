CREATE DATABASE  IF NOT EXISTS `qrup` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `qrup`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: qrup
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contatos`
--

DROP TABLE IF EXISTS `contatos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contatos` (
  `cpf` varchar(14) NOT NULL,
  `contato1` varchar(20) NOT NULL,
  `contato2` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cpf`),
  CONSTRAINT `contatos_ibfk_1` FOREIGN KEY (`cpf`) REFERENCES `perfil` (`cpf`),
  CONSTRAINT `contatos_chk_1` CHECK (regexp_like(`cpf`,_utf8mb4'^[0-9]{3}.[0-9]{3}.[0-9]{3}-[0-9]{2}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contatos`
--

LOCK TABLES `contatos` WRITE;
/*!40000 ALTER TABLE `contatos` DISABLE KEYS */;
INSERT INTO `contatos` VALUES ('333.333.333-33','67999999999',NULL);
/*!40000 ALTER TABLE `contatos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens_pedido`
--

DROP TABLE IF EXISTS `itens_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_pedido` (
  `pedido_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade` int NOT NULL,
  PRIMARY KEY (`pedido_id`,`produto_id`),
  KEY `produto_id` (`produto_id`),
  CONSTRAINT `itens_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`pedido_id`),
  CONSTRAINT `itens_pedido_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`produto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_pedido`
--

LOCK TABLES `itens_pedido` WRITE;
/*!40000 ALTER TABLE `itens_pedido` DISABLE KEYS */;
INSERT INTO `itens_pedido` VALUES (1,1,1),(1,2,2),(1,5,1),(2,1,1),(2,2,1),(2,4,1);
/*!40000 ALTER TABLE `itens_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `pedido_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `processo_pedido` enum('cancelado','aguardando','concluido') DEFAULT 'aguardando',
  `valor_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `data_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pedido_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,3,'concluido',14.50,'2025-07-24 01:56:13'),(2,3,'concluido',11.00,'2025-07-24 01:58:32');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil`
--

DROP TABLE IF EXISTS `perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil` (
  `cpf` varchar(14) NOT NULL,
  `user_id` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `data_nascimento` date NOT NULL,
  `nome_rua` varchar(100) NOT NULL,
  `numero_casa` int NOT NULL,
  `bairro` varchar(50) NOT NULL,
  `cidade` varchar(50) NOT NULL,
  `UF` varchar(2) NOT NULL,
  `data_perfil` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cpf`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `perfil_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`user_id`),
  CONSTRAINT `perfil_chk_1` CHECK (regexp_like(`cpf`,_utf8mb4'^[0-9]{3}.[0-9]{3}.[0-9]{3}-[0-9]{2}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil`
--

LOCK TABLES `perfil` WRITE;
/*!40000 ALTER TABLE `perfil` DISABLE KEYS */;
INSERT INTO `perfil` VALUES ('333.333.333-33',3,'Robson','1999-01-23','Admin',123,'Admin','Campo Grande','MS','2025-07-24 00:58:17');
/*!40000 ALTER TABLE `perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `produto_id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `imagem` varchar(255) NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `quantidade_estoque` int NOT NULL,
  `data_produto` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `categoria` enum('bebidas','alimentos','outros') NOT NULL,
  PRIMARY KEY (`produto_id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (1,'Coca-Lata',4.00,'5428045930468','1753319993462.webp',1,8,'2025-07-24 01:58:32','bebidas'),(2,'Fanta Maracujá - Lata',3.50,'6771380640561','1753320252956.webp',1,7,'2025-07-24 01:58:32','bebidas'),(3,'Fanta Laranja - Lata',3.50,'2376313478590','1753320314964.webp',1,10,'2025-07-24 01:25:14','bebidas'),(4,'Fanta Uva- Lata',3.50,'0217005306505','1753320330708.png',1,9,'2025-07-24 01:58:32','bebidas'),(5,'Fanta Guaraná- Lata',3.50,'4335262221297','1753320363703.webp',1,9,'2025-07-24 01:56:13','bebidas'),(6,'Pepsi - Lata',4.00,'0111858879677','1753320441563.jpg',1,10,'2025-07-24 01:27:21','bebidas'),(7,'Sukita Laranja - Lata',3.00,'3374927181508','1753320510819.jpg',1,10,'2025-07-24 01:28:30','bebidas'),(8,'Sukita Uva - Lata',3.00,'9409460676380','1753320539511.webp',1,10,'2025-07-24 01:28:59','bebidas'),(9,'Sprite - Lata',3.50,'4015956820585','1753320661502.webp',1,10,'2025-07-24 01:31:01','bebidas'),(10,'Guaraná antarctica - Lata',2.50,'5778497132201','1753320695298.webp',1,10,'2025-07-24 01:31:35','bebidas'),(11,'Skol - 350ml',2.50,'5978085440019','1753320821726.webp',1,10,'2025-07-24 01:33:54','bebidas'),(12,'Petra - 473ml',3.50,'6199297233643','1753320887659.webp',1,10,'2025-07-24 01:34:47','bebidas'),(13,'Antarctica Subzero - 350ml',3.00,'1332405029836','1753320951007.png',1,10,'2025-07-24 01:35:51','bebidas'),(14,'Amstel - 473ml',3.50,'8955691614093','1753321029635.webp',1,10,'2025-07-24 01:37:09','bebidas'),(15,'Heineken - 330ml',7.00,'5400304560777','1753321076255.jpg',1,10,'2025-07-24 01:37:56','bebidas'),(16,'Coronita - 210ml',5.00,'1666238653945','1753321187009.webp',1,10,'2025-07-24 01:39:47','bebidas'),(17,'Budweiser - 330ml',6.00,'6429185815454','1753321317292.jpg',1,10,'2025-07-24 01:41:57','bebidas'),(18,'Espetinho de Linguiça',10.00,'9780254884441','1753321663246.webp',1,10,'2025-07-24 01:47:43','alimentos'),(19,'Espetinho de Carne',10.00,'3310599971221','1753321684262.jpg',1,10,'2025-07-24 01:48:04','alimentos'),(20,'Espetinho de Frango',10.00,'5416995603280','1753321698261.png',1,10,'2025-07-24 01:48:18','alimentos'),(21,'Salgadinho',3.00,'1996552939433','1753321769621.webp',1,10,'2025-07-24 01:49:29','bebidas'),(22,'Amendoim',4.00,'4295120546941','1753321834988.webp',1,10,'2025-07-24 01:50:34','alimentos'),(23,'Carvao',15.00,'3869518004811','1753321881092.webp',1,10,'2025-07-24 01:51:21','outros'),(24,'Gelo - 3kg',5.00,'1154694861658','1753321960898.webp',1,10,'2025-07-24 01:52:40','outros'),(25,'Baralho',12.00,'6534967469951','1753322121395.webp',1,10,'2025-07-24 01:55:21','outros');
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos_temporarios`
--

DROP TABLE IF EXISTS `produtos_temporarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos_temporarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `quantidade` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos_temporarios`
--

LOCK TABLES `produtos_temporarios` WRITE;
/*!40000 ALTER TABLE `produtos_temporarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos_temporarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `data_user` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` enum('admin','user') DEFAULT 'user',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (3,'Admin','admin@gmail.com','$2b$10$m2mRNO2rjlLGgFSdYC2Q1OMiiddVE4xSvp8ewvB4uRl/J0szZja7C','2025-07-24 00:55:47','admin'),(4,'Usuario','usuario@gmail.com','$2b$10$c8v4HylwnNJxgUaL1UwCFu.5WhnaBdc0Aa8xjtzcqtiz0lUr8Jn0S','2025-07-24 00:55:39','user'),(5,'dawd','norkingbr@gmail.com','$2b$10$CLB20jDuOAGW2EMuDrOfp.cA792rOU8SFDhEClRdD8Ss22m87x7Km','2025-07-24 02:01:53','user');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-23 22:06:42
