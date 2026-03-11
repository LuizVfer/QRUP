// routes/nfeRoutes.js
// ============================================================
// Define todas as rotas da API de NF-e
// Segue o padrão dos outros arquivos de rota do projeto
// ============================================================

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const nfeController               = require('../controllers/nfeController');

// ------------------------------------------------------------
// RATE LIMITING específico para importação
// Impede spam de uploads (mesmo limite do import-nfe existente)
// ------------------------------------------------------------
const limiteImportacao = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: { message: 'Limite de importações atingido. Tente novamente em 1 hora.' },
});

// ------------------------------------------------------------
// CONFIGURAÇÃO DO MULTER
// Aceita apenas .xml, salva com timestamp no nome
// ------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const timestamp = Date.now();
    const ext       = path.extname(file.originalname);
    cb(null, `nfe_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.xml') {
      return cb(new Error('Apenas arquivos .xml são aceitos.'));
    }
    cb(null, true);
  },
});

// ============================================================
// ROTAS
// ============================================================

/**
 * POST /api/nfe/importar
 * Importa uma NF-e via upload de arquivo XML
 * Requer: admin | Arquivo: XML
 *
 * Body (multipart/form-data):
 *   arquivo_nfe: [arquivo .xml]
 *
 * Resposta 201:
 *   { nota_fiscal_id, numero_nf, emitente, valor_total,
 *     total_itens, itens_atualizados, itens_temporarios, status }
 */
router.post(
  '/importar',
  authMiddleware,
  isAdmin,
  limiteImportacao,
  upload.single('arquivo_nfe'),
  nfeController.importarNfe
);

/**
 * GET /api/nfe/estatisticas
 * Retorna números gerais sobre todas as NF-es
 * Requer: admin
 *
 * Resposta 200:
 *   { total_notas, valor_total_importado, total_itens_processados,
 *     total_atualizados, total_temporarios, notas_ok, notas_parciais,
 *     notas_erro, ultima_importacao }
 *
 * IMPORTANTE: essa rota deve ficar ANTES de /:id
 * para o Express não confundir "estatisticas" com um ID
 */
router.get(
  '/estatisticas',
  authMiddleware,
  isAdmin,
  nfeController.buscarEstatisticas
);

/**
 * GET /api/nfe
 * Lista todas as NF-es importadas com filtros opcionais
 * Requer: admin
 *
 * Query params (todos opcionais):
 *   page         - página atual (padrão: 1)
 *   limit        - itens por página (padrão: 10)
 *   dataInicio   - YYYY-MM-DD
 *   dataFim      - YYYY-MM-DD
 *   status       - processada | parcial | erro
 *   cnpj_emitente - CNPJ do fornecedor
 *
 * Resposta 200:
 *   { notas: [...], total, page, totalPages }
 */
router.get(
  '/',
  authMiddleware,
  isAdmin,
  nfeController.listarNfe
);

/**
 * GET /api/nfe/:id
 * Retorna uma NF-e completa com todos os seus itens
 * Requer: admin
 *
 * Resposta 200:
 *   { id, numero_nf, emitente, ..., itens: [...] }
 */
router.get(
  '/:id',
  authMiddleware,
  isAdmin,
  nfeController.buscarNfePorId
);

/**
 * GET /api/nfe/:id/divergencias
 * Retorna os itens onde o preço da nota != preço do sistema
 * Requer: admin
 *
 * Resposta 200:
 *   { nota_fiscal_id, numero_nf, total_divergencias, itens: [...] }
 */
router.get(
  '/:id/divergencias',
  authMiddleware,
  isAdmin,
  nfeController.buscarDivergencias
);

module.exports = router;