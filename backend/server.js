// backend/server.js
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const produtosRouter = require("./routes/produtosRoutes.js");
const perfilRouter = require("./routes/perfilRoutes.js");
const pedidoRouter = require("./routes/pedidoRoutes.js");
const relatorioRoutes = require("./routes/relatorioRoutes.js");
const rateLimit = require("express-rate-limit");
const {
  preventPathTraversal,
  validateContentType,
  sanitizeQueryParams,
  logSuspiciousActivity,
  validateBodySize
} = require("./middlewares/routeSecurity.js");
require("dotenv").config();

const app = express();

// ============================================
// MIDDLEWARES DE SEGURANÇA GLOBAIS
// ============================================

// 1. Prevenir Path Traversal
app.use(preventPathTraversal);

// 2. Logging de atividades suspeitas
app.use(logSuspiciousActivity);

// 3. Sanitizar query parameters
app.use(sanitizeQueryParams);

// 4. Validar Content-Type
app.use(validateContentType);

// 5. Limitar tamanho do body (exceto para uploads)
app.use((req, res, next) => {
  // Não aplicar limite para rotas de upload
  if (req.path.includes('/produtos') && req.method === 'POST') {
    return next();
  }
  return validateBodySize(1024)(req, res, next); // 1MB para rotas normais
});

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================

// Parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configurado via .env
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000", "http://127.0.0.1:5500"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Origem bloqueada pelo CORS: ${origin}`);
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400 // Cache preflight por 24h
  })
);

// Arquivos estáticos
app.use("/uploads", express.static("uploads"));
app.use(express.static("../frontend"));

// ============================================
// RATE LIMITING GLOBAL
// ============================================

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const limiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: { message: "Muitas requisições deste IP, tente novamente mais tarde." },
  standardHeaders: true, // Retornar info rate limit nos headers
  legacyHeaders: false, // Desabilitar headers X-RateLimit-*
  // Função para gerar chave única (usa IP + user-agent)
  keyGenerator: (req) => {
    return `${req.ip}_${req.headers['user-agent']}`;
  },
  // Handler customizado para logging
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit excedido: IP ${req.ip} - Rota: ${req.path}`);
    res.status(429).json({ 
      message: "Muitas requisições deste IP, tente novamente mais tarde.",
      retryAfter: Math.ceil(windowMs / 1000 / 60) + " minutos"
    });
  }
});

app.use(limiter);

// ============================================
// HEADERS DE SEGURANÇA
// ============================================

app.use((req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (browsers antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy básico
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  // Remover header que expõe tecnologia
  res.removeHeader('X-Powered-By');
  
  next();
});

// ============================================
// ROTAS
// ============================================

app.use("/api", authRoutes);
app.use("/api", pedidoRouter);
app.use("/produtos", produtosRouter);
app.use("/perfil", perfilRouter);
app.use("/relatorios", relatorioRoutes);

// ============================================
// ROTA DE HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS (404)
// ============================================

app.use((req, res, next) => {
  console.warn(`⚠️ Rota não encontrada: ${req.method} ${req.path} - IP: ${req.ip}`);
  res.status(404).json({ 
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// ============================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================

app.use((err, req, res, next) => {
  // Logging detalhado do erro
  console.error(`❌ Erro [${new Date().toISOString()}]:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body
  });

  // Tratar erros específicos
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Token inválido ou ausente' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: 'Origem não permitida' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Arquivo muito grande' });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    message: err.message || "Erro interno no servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Servidor QRUP Backend Iniciado   ║
╠═══════════════════════════════════════╣
║  Porta: ${PORT}                        
║  Ambiente: ${process.env.NODE_ENV || "development"}       
║  CORS: ${corsOrigins.join(", ")}
║  Rate Limit: ${maxRequests} req/${Math.ceil(windowMs/60000)}min
╚═══════════════════════════════════════╝
  `);
});

// ============================================
// TRATAMENTO DE ENCERRAMENTO GRACIOSO
// ============================================

const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} recebido, encerrando servidor...`);
  
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado');
    
    // Fechar conexões com banco de dados
    const db = require('./config/db');
    db.end((err) => {
      if (err) {
        console.error('❌ Erro ao fechar pool do banco:', err);
        process.exit(1);
      }
      console.log('✅ Conexões com banco encerradas');
      process.exit(0);
    });
  });

  // Forçar encerramento após 10 segundos
  setTimeout(() => {
    console.error('⚠️ Forçando encerramento após timeout');
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown('SIGTERM'));
process.on("SIGINT", () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não capturada:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  gracefulShutdown('unhandledRejection');
});