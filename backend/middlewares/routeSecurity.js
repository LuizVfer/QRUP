// middlewares/routeSecurity.js

/**
 * Middleware para validar métodos HTTP permitidos
 */
const validateHttpMethod = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({ 
        message: 'Método não permitido',
        allowedMethods 
      });
    }
    next();
  };
};

/**
 * Middleware para sanitizar e validar parâmetros de rota
 */
const validateRouteParams = (req, res, next) => {
  // Validar IDs numéricos
  if (req.params.id) {
    const id = req.params.id;
    
    // Verificar se é um número inteiro positivo
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ 
        message: 'ID inválido. Deve ser um número inteiro positivo.' 
      });
    }
    
    // Verificar tamanho razoável (prevenir overflow)
    if (parseInt(id) > 2147483647) {
      return res.status(400).json({ 
        message: 'ID muito grande.' 
      });
    }
    
    // Converter para número
    req.params.id = parseInt(id);
  }
  
  next();
};

/**
 * Middleware para validar Content-Type em requisições POST/PUT
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    // Permitir multipart/form-data (para uploads) e application/json
    const isJson = contentType && contentType.includes('application/json');
    const isMultipart = contentType && contentType.includes('multipart/form-data');
    const isUrlEncoded = contentType && contentType.includes('application/x-www-form-urlencoded');
    
    if (!isJson && !isMultipart && !isUrlEncoded) {
      return res.status(415).json({ 
        message: 'Content-Type não suportado. Use application/json ou multipart/form-data.' 
      });
    }
  }
  
  next();
};

/**
 * Middleware para prevenir Path Traversal
 */
const preventPathTraversal = (req, res, next) => {
  const url = req.url;
  
  // Detectar tentativas de path traversal
  if (url.includes('../') || url.includes('..\\') || url.includes('%2e%2e')) {
    console.warn(`⚠️ Tentativa de Path Traversal detectada: ${url} de IP: ${req.ip}`);
    return res.status(400).json({ 
      message: 'Requisição inválida.' 
    });
  }
  
  next();
};

/**
 * Middleware para validar tamanho do body
 */
const validateBodySize = (maxSizeKB = 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = maxSizeKB * 1024;
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({ 
        message: `Payload muito grande. Máximo permitido: ${maxSizeKB}KB` 
      });
    }
    
    next();
  };
};

/**
 * Middleware para sanitizar query strings
 */
const sanitizeQueryParams = (req, res, next) => {
  if (req.query) {
    for (const key in req.query) {
      let value = req.query[key];
      
      if (typeof value === 'string') {
        // Remover caracteres perigosos
        value = value.trim();
        
        // Detectar tentativas de SQL Injection básicas
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/gi,
          /(--|;|\/\*|\*\/|xp_|sp_)/gi,
          /('|"|`|<|>)/gi
        ];
        
        let isSuspicious = false;
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            isSuspicious = true;
            break;
          }
        }
        
        if (isSuspicious) {
          console.warn(`⚠️ Query suspeita detectada: ${key}=${value} de IP: ${req.ip}`);
          return res.status(400).json({ 
            message: 'Parâmetros de consulta inválidos.' 
          });
        }
        
        req.query[key] = value;
      }
    }
  }
  
  next();
};

/**
 * Middleware para rate limiting por rota específica
 */
const createRouteRateLimit = (maxRequests, windowMinutes = 15) => {
  const requests = new Map();
  
  // Limpar registros expirados a cada 5 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.firstRequest > windowMinutes * 60 * 1000) {
        requests.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  return (req, res, next) => {
    const identifier = `${req.ip}_${req.path}`;
    const now = Date.now();
    
    if (!requests.has(identifier)) {
      requests.set(identifier, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    const data = requests.get(identifier);
    const timeElapsed = now - data.firstRequest;
    
    // Se passou o tempo da janela, resetar contador
    if (timeElapsed > windowMinutes * 60 * 1000) {
      requests.set(identifier, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    // Incrementar contador
    data.count++;
    
    if (data.count > maxRequests) {
      const resetTime = Math.ceil((windowMinutes * 60 * 1000 - timeElapsed) / 1000 / 60);
      return res.status(429).json({ 
        message: `Muitas requisições para esta rota. Tente novamente em ${resetTime} minutos.` 
      });
    }
    
    next();
  };
};

/**
 * Middleware para logging de requisições suspeitas
 */
const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script>/i,  // XSS
    /javascript:/i,  // XSS
    /on\w+=/i,  // Event handlers
    /(union|select|insert|update|delete|drop)/i  // SQL keywords
  ];
  
  const checkString = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`🚨 Atividade suspeita detectada:
        IP: ${req.ip}
        Método: ${req.method}
        Rota: ${req.path}
        User-Agent: ${req.headers['user-agent']}
        Timestamp: ${new Date().toISOString()}
      `);
      break;
    }
  }
  
  next();
};

/**
 * Middleware para validar headers obrigatórios
 */
const validateRequiredHeaders = (requiredHeaders = []) => {
  return (req, res, next) => {
    const missingHeaders = [];
    
    for (const header of requiredHeaders) {
      if (!req.headers[header.toLowerCase()]) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        message: 'Headers obrigatórios ausentes',
        missing: missingHeaders
      });
    }
    
    next();
  };
};

module.exports = {
  validateHttpMethod,
  validateRouteParams,
  validateContentType,
  preventPathTraversal,
  validateBodySize,
  sanitizeQueryParams,
  createRouteRateLimit,
  logSuspiciousActivity,
  validateRequiredHeaders
};