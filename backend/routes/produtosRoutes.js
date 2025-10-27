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
    // Sanitizar nome do arquivo
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
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `nfe_${Date.now()}_${sanitizedName}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || path.extname(file.originalname).toLowerCase() === '.xml') {
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

module.exports = router;