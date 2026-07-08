const express = require('express');
const multer = require('multer');
const produtoController = require('../controllers/produtoController.js');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware.js');
const { 
  validateHttpMethod, 
  validateRouteParams,
  createRouteRateLimit 
} = require('../middlewares/routeSecurity.js');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '../Uploads/'),
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '_' + sanitizedName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Apenas imagens JPEG/PNG/WEBP são permitidas'));
  },
});

const uploadXML = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, '../Uploads/'),
    filename: (req, file, cb) => {
      // MELHORIA 2: Nome do arquivo sanitizado desde o início
      const sanitizedName = file.originalname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\.{2,}/g, '.')
        .substring(0, 100);
      cb(null, `nfe_${Date.now()}_${sanitizedName}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (mime === 'text/xml' || mime === 'application/xml' || ext === '.xml') {
      return cb(null, true);
    }
    cb(new Error('Apenas arquivos XML são permitidos'));
  },
});

const router = express.Router();

// Criar produto - POST apenas, admin
router.post('/', 
  validateHttpMethod(['POST']),
  authMiddleware, 
  isAdmin, 
  upload.single('imagem'), 
  produtoController.create
);

// Listar produtos ativos - GET apenas, público
router.get('/', 
  validateHttpMethod(['GET']),
  produtoController.findAllActive
);

// Listar todos (admin) - GET apenas, admin
router.get('/admin', 
  validateHttpMethod(['GET']),
  authMiddleware, 
  isAdmin, 
  produtoController.findAll
);

// Incrementar estoque - POST apenas, admin
router.post('/increment-stock', 
  validateHttpMethod(['POST']),
  authMiddleware, 
  isAdmin, 
  produtoController.incrementStock
);

// Importar NFe - POST apenas, admin, rate limit
router.post('/import-nfe', 
  validateHttpMethod(['POST']),
  createRouteRateLimit(10, 60), // 10 imports por hora
  authMiddleware, 
  isAdmin, 
  uploadXML.single('nfe'), 
  produtoController.importNFe
);

// MELHORIA 3: Logs de auditoria das importações - GET apenas, admin
router.get('/logs-nfe', 
  validateHttpMethod(['GET']),
  authMiddleware, 
  isAdmin, 
  produtoController.getLogsNFe
);

// Produtos temporários - GET apenas, admin
router.get('/temp-products', 
  validateHttpMethod(['GET']),
  authMiddleware, 
  isAdmin, 
  produtoController.findAllTempProducts
);

// Deletar produto temporário - DELETE apenas, admin, validar ID
router.delete('/temp-products/:id', 
  validateHttpMethod(['DELETE']),
  validateRouteParams,
  authMiddleware, 
  isAdmin, 
  produtoController.deleteTempProduct
);

// Atualizar produto - PUT apenas, admin, validar ID
router.put('/:id', 
  validateHttpMethod(['PUT']),
  validateRouteParams,
  authMiddleware, 
  isAdmin, 
  upload.single('imagem'), 
  produtoController.update
);

// Alterar status - PUT apenas, admin, validar ID
router.put('/:id/status', 
  validateHttpMethod(['PUT']),
  validateRouteParams,
  authMiddleware, 
  isAdmin, 
  produtoController.alterarStatus
);

module.exports = router;