// middlewares/inputValidation.js

/**
 * Middlewares para validação específica de inputs
 */

/**
 * Validar dados de registro
 */
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Validar username
  if (!username || typeof username !== 'string') {
    errors.push('Username é obrigatório');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username deve ter entre 3 e 50 caracteres');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username deve conter apenas letras, números, underscore e hífen');
  }

  // Validar email
  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email inválido');
  } else if (email.length > 100) {
    errors.push('Email muito longo');
  }

  // Validar senha
  if (!password || typeof password !== 'string') {
    errors.push('Senha é obrigatória');
  } else if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  } else if (password.length > 100) {
    errors.push('Senha muito longa');
  } else if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados inválidos', errors });
  }

  next();
};

/**
 * Validar dados de login
 */
const validateLogin = (req, res, next) => {
  const { email, password, recaptchaToken } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Senha é obrigatória');
  }

  if (!recaptchaToken || typeof recaptchaToken !== 'string') {
    errors.push('Token reCAPTCHA é obrigatório');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados inválidos', errors });
  }

  next();
};

/**
 * Validar dados de pedido
 */
const validatePedido = (req, res, next) => {
  const { user_id, itens, endereco } = req.body;
  const errors = [];

  // Validar user_id
  if (!user_id || !Number.isInteger(user_id) || user_id <= 0) {
    errors.push('ID do usuário inválido');
  }

  // Validar itens
  if (!itens || !Array.isArray(itens)) {
    errors.push('Itens devem ser um array');
  } else if (itens.length === 0) {
    errors.push('Pedido deve conter pelo menos um item');
  } else if (itens.length > 50) {
    errors.push('Pedido não pode ter mais de 50 itens');
  } else {
    itens.forEach((item, index) => {
      if (!item.produto_id || !Number.isInteger(item.produto_id) || item.produto_id <= 0) {
        errors.push(`Item ${index + 1}: ID do produto inválido`);
      }
      if (!item.quantidade || !Number.isInteger(item.quantidade) || item.quantidade <= 0) {
        errors.push(`Item ${index + 1}: Quantidade inválida`);
      } else if (item.quantidade > 1000) {
        errors.push(`Item ${index + 1}: Quantidade máxima é 1000`);
      }
    });
  }

  // Validar endereço
  if (!endereco || typeof endereco !== 'object') {
    errors.push('Endereço é obrigatório');
  } else {
    const { nome_rua, numero_casa, bairro, cidade, UF } = endereco;

    if (!nome_rua || typeof nome_rua !== 'string' || nome_rua.trim().length === 0) {
      errors.push('Nome da rua é obrigatório');
    } else if (nome_rua.length > 100) {
      errors.push('Nome da rua muito longo');
    }

    if (!numero_casa || !/^\d+$/.test(numero_casa)) {
      errors.push('Número da casa deve ser um número');
    }

    if (!bairro || typeof bairro !== 'string' || bairro.trim().length === 0) {
      errors.push('Bairro é obrigatório');
    } else if (bairro.length > 100) {
      errors.push('Bairro muito longo');
    }

    if (!cidade || typeof cidade !== 'string' || cidade.trim().length === 0) {
      errors.push('Cidade é obrigatória');
    } else if (cidade.length > 100) {
      errors.push('Cidade muito longa');
    }

    if (!UF || !/^[A-Z]{2}$/.test(UF)) {
      errors.push('UF deve ter 2 letras maiúsculas');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados do pedido inválidos', errors });
  }

  next();
};

/**
 * Validar dados de produto
 */
const validateProduto = (req, res, next) => {
  const { titulo, preco, categoria, barcode, quantidade_estoque } = req.body;
  const errors = [];

  // Validar título
  if (!titulo || typeof titulo !== 'string') {
    errors.push('Título é obrigatório');
  } else if (titulo.length < 3 || titulo.length > 100) {
    errors.push('Título deve ter entre 3 e 100 caracteres');
  }

  // Validar preço
  if (preco === undefined || preco === null) {
    errors.push('Preço é obrigatório');
  } else if (isNaN(preco) || parseFloat(preco) <= 0) {
    errors.push('Preço deve ser um número positivo');
  } else if (parseFloat(preco) > 999999.99) {
    errors.push('Preço muito alto');
  }

  // Validar categoria
  const CATEGORIAS_VALIDAS = ['bebidas', 'alimentos', 'outros'];
  if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
    errors.push(`Categoria deve ser uma de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  // Validar barcode
  if (!barcode || typeof barcode !== 'string') {
    errors.push('Código de barras é obrigatório');
  } else if (!/^\d{13}$/.test(barcode)) {
    errors.push('Código de barras deve ter 13 dígitos');
  }

  // Validar quantidade em estoque
  if (quantidade_estoque === undefined || quantidade_estoque === null) {
    errors.push('Quantidade em estoque é obrigatória');
  } else if (!Number.isInteger(parseInt(quantidade_estoque)) || parseInt(quantidade_estoque) < 0) {
    errors.push('Quantidade em estoque deve ser um número inteiro não negativo');
  } else if (parseInt(quantidade_estoque) > 999999) {
    errors.push('Quantidade em estoque muito alta');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados do produto inválidos', errors });
  }

  next();
};

/**
 * Validar dados de perfil
 */
const validatePerfil = (req, res, next) => {
  const { nome, data_nascimento, cpf, contato1, contato2, nome_rua, numero_casa, bairro, cidade, UF } = req.body;
  const errors = [];

  // Validar nome
  if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
    errors.push('Nome é obrigatório');
  } else if (nome.length > 100) {
    errors.push('Nome muito longo');
  }

  // Validar data de nascimento
  if (!data_nascimento) {
    errors.push('Data de nascimento é obrigatória');
  } else {
    const birthDate = new Date(data_nascimento);
    if (isNaN(birthDate.getTime())) {
      errors.push('Data de nascimento inválida');
    } else {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.push('Usuário deve ter pelo menos 18 anos');
      } else if (age > 120) {
        errors.push('Data de nascimento inválida');
      }
    }
  }

  // Validar CPF
  if (!cpf || typeof cpf !== 'string') {
    errors.push('CPF é obrigatório');
  } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
    errors.push('CPF deve estar no formato xxx.xxx.xxx-xx');
  }

  // Validar contato1
  if (!contato1 || typeof contato1 !== 'string') {
    errors.push('Contato 1 é obrigatório');
  } else if (contato1.length < 10 || contato1.length > 20) {
    errors.push('Contato 1 deve ter entre 10 e 20 caracteres');
  }

  // Validar contato2 (opcional)
  if (contato2 && (typeof contato2 !== 'string' || contato2.length > 20)) {
    errors.push('Contato 2 inválido');
  }

  // Validar endereço
  if (!nome_rua || typeof nome_rua !== 'string' || nome_rua.trim().length === 0) {
    errors.push('Nome da rua é obrigatório');
  } else if (nome_rua.length > 100) {
    errors.push('Nome da rua muito longo');
  }

  if (numero_casa === undefined || numero_casa === null || !/^\d+$/.test(numero_casa.toString())) {
    errors.push('Número da casa deve ser um número');
  }

  if (!bairro || typeof bairro !== 'string' || bairro.trim().length === 0) {
    errors.push('Bairro é obrigatório');
  } else if (bairro.length > 100) {
    errors.push('Bairro muito longo');
  }

  if (!cidade || typeof cidade !== 'string' || cidade.trim().length === 0) {
    errors.push('Cidade é obrigatória');
  } else if (cidade.length > 100) {
    errors.push('Cidade muito longa');
  }

  if (!UF || !/^[A-Z]{2}$/.test(UF)) {
    errors.push('UF deve ter 2 letras maiúsculas');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados do perfil inválidos', errors });
  }

  next();
};

/**
 * Validar parâmetros de relatório
 */
const validateRelatorioParams = (req, res, next) => {
  const { dataInicio, dataFim, periodo } = req.query;
  const errors = [];

  // Validar datas
  if (!dataInicio) {
    errors.push('Data de início é obrigatória');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
    errors.push('Data de início deve estar no formato YYYY-MM-DD');
  }

  if (!dataFim) {
    errors.push('Data de fim é obrigatória');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
    errors.push('Data de fim deve estar no formato YYYY-MM-DD');
  }

  // Validar que dataFim >= dataInicio
  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (fim < inicio) {
      errors.push('Data de fim deve ser maior ou igual à data de início');
    }
    // Validar período máximo (1 ano)
    const diffTime = Math.abs(fim - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      errors.push('Período máximo para relatórios é de 1 ano');
    }
  }

  // Validar período se existir
  if (periodo && !['diario', 'mensal', 'anual'].includes(periodo)) {
    errors.push('Período deve ser: diario, mensal ou anual');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Parâmetros de relatório inválidos', errors });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePedido,
  validateProduto,
  validatePerfil,
  validateRelatorioParams
};