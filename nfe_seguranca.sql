-- ============================================================
-- NOVAS TABELAS: Segurança da importação de NF-e
-- Execute este script no seu banco de dados MySQL
-- ============================================================

-- MELHORIA 4: Tabela para evitar importação duplicada de NF-e
CREATE TABLE IF NOT EXISTS nfe_importadas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  chave_acesso  CHAR(44) NOT NULL UNIQUE,   -- Chave de acesso tem sempre 44 dígitos
  admin_id      INT,
  importada_em  DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES usuarios(user_id) ON DELETE SET NULL
);

-- MELHORIA 3: Tabela de log de auditoria das importações
CREATE TABLE IF NOT EXISTS logs_importacao_nfe (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  admin_id            INT,
  chave_acesso        VARCHAR(50),
  nome_arquivo        VARCHAR(120),
  total_itens         INT DEFAULT 0,
  itens_atualizados   INT DEFAULT 0,
  itens_pendentes     INT DEFAULT 0,
  total_erros         INT DEFAULT 0,
  detalhes            JSON,                 -- Resultado completo em JSON
  importado_em        DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES usuarios(user_id) ON DELETE SET NULL
);

-- Índices para melhorar performance nas consultas
CREATE INDEX idx_nfe_chave       ON nfe_importadas (chave_acesso);
CREATE INDEX idx_log_admin       ON logs_importacao_nfe (admin_id);
CREATE INDEX idx_log_importado   ON logs_importacao_nfe (importado_em);
