// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware para proteger rotas autenticadas.
 * Verifica se o token JWT está presente e válido.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Acesso negado: token não fornecido." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado: token mal formatado." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Middleware para proteger rotas de administrador.
 * Só permite acesso se o usuário for admin.
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acesso negado: apenas administradores." });
  }
  next();
};

module.exports = { authMiddleware, isAdmin };
