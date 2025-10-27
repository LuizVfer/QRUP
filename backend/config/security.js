// config/security.js

/**
 * Configurações centralizadas de segurança
 */

module.exports = {
  // Rate Limits por tipo de rota
  rateLimits: {
    auth: {
      login: { maxRequests: 10, windowMinutes: 15 },
      register: { maxRequests: 5, windowMinutes: 15 },
      passwordReset: { maxRequests: 3, windowMinutes: 60 }
    },
    pedidos: {
      create: { maxRequests: 30, windowMinutes: 60 }
    },
    relatorios: {
      default: { maxRequests: 20, windowMinutes: 60 }
    },
    imports: {
      nfe: { maxRequests: 10, windowMinutes: 60 }
    }
  },

  // Tamanhos máximos de body
  bodySizes: {
    default: 1024, // 1MB em KB
    upload: 5120,  // 5MB em KB
    xml: 10240     // 10MB em KB
  },

  // Headers obrigatórios por rota
  requiredHeaders: {
    authenticated: ['authorization'],
    upload: ['content-type']
  },

  // Padrões suspeitos para logging
  suspiciousPatterns: [
    /\.\./,                    // Path traversal
    /<script>/i,               // XSS
    /javascript:/i,            // XSS
    /on\w+=/i,                 // Event handlers
    /(union|select|insert|update|delete|drop|create|alter|exec)/i, // SQL
    /(--|;|\/\*|\*\/)/,        // SQL comments
    /(\b(xp_|sp_)\w+)/i,       // SQL stored procedures
    /<iframe/i,                // Iframe injection
    /base64/i,                 // Possível payload codificado
    /eval\(/i,                 // Code injection
    /expression\(/i            // CSS expression
  ],

  // Extensões de arquivo permitidas
  allowedFileExtensions: {
    images: ['jpg', 'jpeg', 'png', 'webp'],
    documents: ['xml']
  },

  // MIME types permitidos
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp'],
    xml: ['text/xml', 'application/xml']
  },

  // Configurações de CORS
  cors: {
    maxAge: 86400, // 24 horas
    credentials: true
  },

  // Headers de segurança
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src https://www.google.com;"
  },

  // Validações de ID
  idValidation: {
    maxValue: 2147483647, // MAX INT em MySQL
    pattern: /^\d+$/
  },

  // Timeouts
  timeouts: {
    gracefulShutdown: 10000, // 10 segundos
    requestTimeout: 30000     // 30 segundos
  }
};