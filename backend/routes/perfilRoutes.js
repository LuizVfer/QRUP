const express = require('express');
const router = express.Router();
const PerfilController = require('../controllers/perfilController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateHttpMethod } = require('../middlewares/routeSecurity.js');

// Obter perfil - GET apenas, autenticado
router.get('/', 
  validateHttpMethod(['GET']),
  authMiddleware, 
  PerfilController.getPerfil
);

// Atualizar perfil - PUT apenas, autenticado
router.put('/', 
  validateHttpMethod(['PUT']),
  authMiddleware, 
  PerfilController.updatePerfil
);

module.exports = router;