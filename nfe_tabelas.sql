-- Execute no banco qrup

USE qrup;

CREATE TABLE IF NOT EXISTS `notas_fiscais` (
  `id`                INT           NOT NULL AUTO_INCREMENT,
  `numero_nf`         VARCHAR(20)   NOT NULL,
  `cnpj_emitente`     VARCHAR(18)   NOT NULL,
  `nome_emitente`     VARCHAR(255)  NOT NULL,
  `data_emissao`      DATETIME      NOT NULL,
  `valor_total`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_itens`       INT           NOT NULL DEFAULT 0,
  `itens_atualizados` INT           NOT NULL DEFAULT 0,
  `itens_temporarios` INT           NOT NULL DEFAULT 0,
  `status`            ENUM('processada','erro','parcial') NOT NULL DEFAULT 'processada',
  `xml_original`      LONGTEXT      DEFAULT NULL,
  `importado_por`     INT           NOT NULL,
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_numero_nf`     (`numero_nf`),
  KEY `idx_cnpj`          (`cnpj_emitente`),
  KEY `idx_data_emissao`  (`data_emissao`),
  KEY `idx_importado_por` (`importado_por`),

  CONSTRAINT `nfe_ibfk_usuario`
    FOREIGN KEY (`importado_por`) REFERENCES `usuarios` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `itens_nfe` (
  `id`               INT           NOT NULL AUTO_INCREMENT,
  `nota_fiscal_id`   INT           NOT NULL,
  `barcode`          VARCHAR(50)   NOT NULL,
  `nome_produto`     VARCHAR(255)  NOT NULL,
  `quantidade`       DECIMAL(10,3) NOT NULL,
  `valor_unitario`   DECIMAL(10,2) NOT NULL,
  `valor_total_item` DECIMAL(10,2) NOT NULL,
  `produto_id`       INT           DEFAULT NULL,
  `preco_cadastrado` DECIMAL(10,2) DEFAULT NULL,
  `divergencia_preco` TINYINT(1)   DEFAULT 0,
  `status_item`      ENUM('atualizado','temporario','sem_estoque') NOT NULL DEFAULT 'temporario',

  PRIMARY KEY (`id`),
  KEY `idx_nota_fiscal_id` (`nota_fiscal_id`),
  KEY `idx_produto_id`     (`produto_id`),
  KEY `idx_barcode`        (`barcode`),

  CONSTRAINT `itens_nfe_ibfk_nota`
    FOREIGN KEY (`nota_fiscal_id`) REFERENCES `notas_fiscais` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `itens_nfe_ibfk_produto`
    FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`produto_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
