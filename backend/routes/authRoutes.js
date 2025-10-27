const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');
const { 
  validateHttpMethod, 
  createRouteRateLimit,
  validateRouteParams 
} = require('../middlewares/routeSecurity.js');

// Rate limit mais rigoroso para rotas de autenticação
const authRateLimit = createRouteRateLimit(5, 15); // 5 tentativas a cada 15 minutos

// Registro - POST apenas
router.post('/registro', 
  validateHttpMethod(['POST']),
  authRateLimit,
  authController.register
);

// Login - POST apenas, rate limit mais rigoroso
router.post('/login', 
  validateHttpMethod(['POST']),
  createRouteRateLimit(10, 15), // 10 tentativas a cada 15 min
  authController.login
);

// Verificar admin - GET apenas, requer autenticação
router.get('/verificar-admin', 
  validateHttpMethod(['GET']),
  authMiddleware, 
  authController.verificarAdmin
);

// Recuperação de senha - rate limit rigoroso
router.post('/solicitar-recuperacao', 
  validateHttpMethod(['POST']),
  createRouteRateLimit(3, 60), // 3 tentativas por hora
  authController.requestPasswordReset
);

router.post('/verificar-codigo', 
  validateHttpMethod(['POST']),
  authRateLimit,
  authController.verifyCode
);

router.post('/recuperar-senha', 
  validateHttpMethod(['POST']),
  authRateLimit,
  authController.resetPassword
);

module.exports = router;