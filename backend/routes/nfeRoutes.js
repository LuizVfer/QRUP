// routes/nfeRoutes.js
// ============================================================
// Define todas as rotas da API de NF-e
// ============================================================
const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const nfeController               = require('../controllers/nfeController');
// ------------------------------------------------------------
// RATE LIMITING - importacao (10 por hora)
// ------------------------------------------------------------
const limiteImportacao = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Limite de importacoes atingido. Tente novamente em 1 hora.' },
});
// ------------------------------------------------------------
// MULTER - apenas .xml, max 5MB
// ------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `nfe_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.xml') {
      return cb(new Error('Apenas arquivos .xml sao aceitos.'));
    }
    cb(null, true);
  },
});
// ============================================================
// ROTAS — CAMINHOS FIXOS (devem vir ANTES das rotas com :id)
// ============================================================
// POST /api/nfe/importar
router.post('/importar', authMiddleware, isAdmin, limiteImportacao, upload.single('arquivo_nfe'), nfeController.importarNfe);
// GET /api/nfe/estatisticas
router.get('/estatisticas', authMiddleware, isAdmin, nfeController.buscarEstatisticas);
// GET /api/nfe/produtos-temporarios
router.get('/produtos-temporarios', authMiddleware, isAdmin, nfeController.listarProdutosTemporarios);
// POST /api/nfe/produtos-temporarios/:id/aprovar
router.post('/produtos-temporarios/:id/aprovar', authMiddleware, isAdmin, nfeController.aprovarProdutoTemporario);
// DELETE /api/nfe/produtos-temporarios/:id
router.delete('/produtos-temporarios/:id', authMiddleware, isAdmin, nfeController.rejeitarProdutoTemporario);
// ============================================================
// ROTAS — COM PARAMETRO :id
// ============================================================
// GET /api/nfe
router.get('/', authMiddleware, isAdmin, nfeController.listarNfe);
// GET /api/nfe/:id
router.get('/:id', authMiddleware, isAdmin, nfeController.buscarNfePorId);
// GET /api/nfe/:id/divergencias
router.get('/:id/divergencias', authMiddleware, isAdmin, nfeController.buscarDivergencias);
// POST /api/nfe/:id/atualizar-precos
router.post('/:id/atualizar-precos', authMiddleware, isAdmin, nfeController.atualizarPrecosDivergentes);
// GET /api/nfe/:id/xml
router.get('/:id/xml', authMiddleware, isAdmin, nfeController.baixarXml);
module.exports = router;