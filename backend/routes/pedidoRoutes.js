const express = require("express");
const pedidoController = require("../controllers/pedidoController.js");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware.js");
const {
  validateHttpMethod,
  validateRouteParams,
  createRouteRateLimit,
} = require("../middlewares/routeSecurity.js");

const router = express.Router();

// ==================== ROTAS DE HORÁRIOS ====================
// Obter horários - GET, autenticado
router.get(
  "/horarios",
  validateHttpMethod(["GET"]),
  authMiddleware,
  pedidoController.getHorarios
);

// Atualizar horários - PUT, apenas admin
router.put(
  "/horarios",
  validateHttpMethod(["PUT"]),
  authMiddleware,
  isAdmin,
  pedidoController.updateHorarios
);

// ==================== ROTAS DE LOJA ====================
// Status da loja - GET apenas, público
router.get(
  "/status-loja",
  validateHttpMethod(["GET"]),
  pedidoController.getStoreStatus
);

// ==================== ROTAS DE STATUS DO ESTABELECIMENTO ====================
// Obter status do estabelecimento - GET, autenticado
router.get(
  "/status-estabelecimento",
  validateHttpMethod(["GET"]),
  authMiddleware,
  pedidoController.getStatusEstabelecimento
);

// Alterar status do estabelecimento - PUT, apenas admin
router.put(
  "/status-estabelecimento",
  validateHttpMethod(["PUT"]),
  authMiddleware,
  isAdmin,
  pedidoController.updateStatusEstabelecimento
);

// ==================== ROTAS DE PEDIDOS ====================
// Criar pedido - POST apenas, autenticado, rate limit
router.post(
  "/pedidos",
  validateHttpMethod(["POST"]),
  createRouteRateLimit(30, 60), // 30 pedidos por hora
  authMiddleware,
  pedidoController.create
);

// Listar todos pedidos - GET apenas, admin
router.get(
  "/pedidos",
  validateHttpMethod(["GET"]),
  authMiddleware,
  isAdmin,
  pedidoController.findAll
);

// Pedidos do usuário - GET apenas, autenticado
router.get(
  "/pedidos/usuario",
  validateHttpMethod(["GET"]),
  authMiddleware,
  pedidoController.findByUser
);

// Atualizar status - PUT apenas, admin, validar ID
router.put(
  "/pedidos/:id",
  validateHttpMethod(["PUT"]),
  validateRouteParams,
  authMiddleware,
  isAdmin,
  pedidoController.updateStatus
);

// Buscar por ID - GET apenas, autenticado, validar ID
router.get(
  "/pedidos/:id",
  validateHttpMethod(["GET"]),
  validateRouteParams,
  authMiddleware,
  pedidoController.findById
);

module.exports = router;
