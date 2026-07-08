const Produto = require('../models/produtoModels.js');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db.js');
const Joi = require('joi');
const xml2js = require('xml2js');

const CATEGORIAS_VALIDAS = ['bebidas', 'alimentos', 'outros'];

const isValidEAN13 = (barcode) => {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checksum = digits.pop();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return checksum === calculatedChecksum;
};

// ============================================================
// MELHORIA 2: Sanitização rigorosa do nome do arquivo
// ============================================================
const sanitizarNomeArquivo = (nomeOriginal) => {
  // Remove caracteres perigosos, mantém apenas letras, números, ponto e hífen
  return nomeOriginal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Remove acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Substitui caracteres inválidos
    .replace(/\.{2,}/g, '.')           // Previne path traversal com ..
    .replace(/^\./, '_')               // Não pode começar com ponto
    .substring(0, 100);                // Limite de 100 caracteres
};

// ============================================================
// MELHORIA 1: Validação do conteúdo do XML (é realmente NF-e?)
// Busca infNFe em todas as variações de namespace que o xml2js pode gerar
// ============================================================
const extrairInfNFe = (result) => {
  return (
    result?.nfeProc?.NFe?.infNFe       ||
    result?.NFe?.infNFe                ||
    result?.nfeProc?.['nfe:NFe']?.infNFe ||
    result?.['nfe:nfeProc']?.['nfe:NFe']?.infNFe ||
    result?.nfeProc?.NFe?.['nfe:infNFe'] ||
    null
  );
};

const validarEstruturaXML = (result) => {
  const erros = [];
  const nfe = extrairInfNFe(result);

  if (!nfe) {
    const temRaiz = result?.nfeProc || result?.NFe;
    if (!temRaiz) {
      erros.push('XML não é uma NF-e válida: estrutura nao reconhecida');
    } else {
      erros.push('Elemento infNFe nao encontrado dentro da NF-e');
    }
    return erros;
  }

  // Verifica apenas o essencial: precisa ter itens (det)
  if (!nfe.det) {
    erros.push('NF-e nao contém itens (campo "det" ausente)');
  }

  return erros;
};

// ============================================================
// MELHORIA 4: Extrair chave de acesso da NF-e (44 dígitos)
// Tenta todas as variações possíveis de onde a chave pode estar
// ============================================================
const extrairChaveAcesso = (result) => {
  try {
    // Tentativa 1: atributo Id do infNFe (formato: NFe + 44 dígitos)
    const infNFe = extrairInfNFe(result);
    if (infNFe?.$?.Id) {
      const chave = infNFe.$.Id.replace(/^NFe/, '');
      if (chave.length === 44) return chave;
    }

    // Tentativa 2: chNFe dentro do protNFe (NF-e com protocolo)
    const chaveProtNFe =
      result?.nfeProc?.protNFe?.infProt?.chNFe ||
      result?.nfeProc?.['nfe:protNFe']?.infProt?.chNFe;
    if (chaveProtNFe && chaveProtNFe.length === 44) return chaveProtNFe;

    // Tentativa 3: atributo Id do infProt
    const infProt = result?.nfeProc?.protNFe?.infProt;
    if (infProt?.$?.Id) {
      const chave = infProt.$.Id.replace(/^ID/, '');
      if (chave.length === 44) return chave;
    }

    // Tentativa 4: dentro do ide da NF-e (cNF + cDV compõem parte da chave)
    // Fallback: usar nome do arquivo como identificador único
    console.warn('[NF-e] Chave de acesso não encontrada nas posições padrão');
    console.warn('[NF-e] Estrutura recebida:', JSON.stringify(Object.keys(result)));

    return null;
  } catch (err) {
    console.error('[NF-e] Erro ao extrair chave de acesso:', err.message);
    return null;
  }
};

const produtoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required(),
  preco: Joi.number().positive().required(),
  categoria: Joi.string().valid(...CATEGORIAS_VALIDAS).required(),
  barcode: Joi.string().max(50).pattern(/^\d{13}$/).required()
    .custom((value, helpers) => {
      if (!isValidEAN13(value)) {
        return helpers.error('string.invalidEAN13');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Código de barras EAN-13 deve ter 13 dígitos numéricos',
      'string.invalidEAN13': 'Código de barras EAN-13 inválido. O checksum está incorreto.',
      'any.required': 'Código de barras é obrigatório',
    }),
  quantidade_estoque: Joi.number().integer().min(0).required()
    .messages({
      'number.base': 'Quantidade em estoque deve ser um número',
      'number.integer': 'Quantidade em estoque deve ser um número inteiro',
      'number.min': 'Quantidade em estoque não pode ser negativa',
      'any.required': 'Quantidade em estoque é obrigatória',
    }),
});

const produtoController = {
  findAll: async (req, res) => {
    try {
      const produtos = await Produto.findAll();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos', error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const [produto] = await Produto.findById(id);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      res.status(200).json(produto);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar produto', error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { titulo, preco, categoria, barcode, quantidade_estoque } = req.body;
      const imagem = req.file ? req.file.filename : null;

      if (!titulo || typeof titulo !== 'string' || titulo.length > 100) {
        return res.status(400).json({ message: 'Título deve ser uma string até 100 caracteres' });
      }
      if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo' });
      }
      if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ message: 'Categoria inválida. Use: bebidas, alimentos, outros' });
      }
      if (!imagem) {
        return res.status(400).json({ message: 'Imagem é obrigatória' });
      }
      if (quantidade_estoque === undefined || isNaN(quantidade_estoque) || parseInt(quantidade_estoque) < 0) {
        return res.status(400).json({ message: 'Quantidade em estoque deve ser um número inteiro não negativo' });
      }
      const [existing] = await Produto.findByBarcode(barcode);
      if (existing) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
      if (barcode && !/^\d{13}$/.test(barcode)) {
        return res.status(400).json({ message: 'Código de barras EAN-13 deve ter 13 dígitos numéricos' });
      }
      const result = await Produto.create(titulo, parseFloat(preco), imagem, categoria, barcode, parseInt(quantidade_estoque));
      res.status(201).json({ id: result.insertId, titulo, preco, imagem, categoria, barcode, quantidade_estoque });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao criar produto', error: err.message });
    }
  },

  findAllActive: async (req, res) => {
    try {
      const produtos = await Produto.findAllActive();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos ativos', error: err.message });
    }
  },

  alterarStatus: async (req, res) => {
    try {
      const { id } = req.params;
      let { ativo } = req.body;

      ativo = parseInt(ativo);
      if (isNaN(ativo) || (ativo !== 0 && ativo !== 1)) {
        return res.status(400).json({ message: 'O campo ativo deve ser 0 ou 1' });
      }

      const [produto] = await Produto.findById(id);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      await Produto.toggleActive(id, ativo);
      res.status(200).json({ message: `Produto ${ativo ? 'ativado' : 'desativado'} com sucesso` });
    } catch (err) {
      console.error('Erro no alterarStatus:', err);
      res.status(500).json({ message: 'Erro ao alterar status do produto', error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = produtoSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const { titulo, preco, categoria, barcode, quantidade_estoque } = req.body;
      const imagem = req.file ? req.file.filename : null;

      const [produto] = await Produto.findById(id);
      if (!produto) return res.status(404).json({ message: 'Produto não encontrado' });

      const [existing] = await Produto.findByBarcode(barcode);
      if (existing && existing.produto_id !== parseInt(id)) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }

      const imagemAntiga = produto.imagem;
      if (imagem && imagemAntiga) {
        const caminhoImagemAntiga = path.join(__dirname, '../../Uploads', imagemAntiga);
        if (await fs.stat(caminhoImagemAntiga).catch(() => false)) {
          await fs.unlink(caminhoImagemAntiga);
        }
      }

      await Produto.update(id, titulo, parseFloat(preco), imagem || imagemAntiga, categoria, barcode, parseInt(quantidade_estoque));
      res.status(200).json({ id, titulo, preco, imagem: imagem || imagemAntiga, categoria, quantidade_estoque });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao atualizar produto', error: err.message });
    }
  },

  incrementStock: async (req, res) => {
    try {
      const { barcode, quantidade } = req.body;

      const schema = Joi.object({
        barcode: Joi.string().max(50).pattern(/^\d{13}$/).required()
          .custom((value, helpers) => {
            if (!isValidEAN13(value)) {
              return helpers.error('string.invalidEAN13');
            }
            return value;
          })
          .messages({
            'string.pattern.base': 'Código de barras EAN-13 deve ter 13 dígitos numéricos',
            'string.invalidEAN13': 'Código de barras EAN-13 inválido. O checksum está incorreto.',
            'any.required': 'Código de barras é obrigatório',
          }),
        quantidade: Joi.number().integer().min(1).required()
          .messages({
            'number.base': 'Quantidade deve ser um número',
            'number.integer': 'Quantidade deve ser um número inteiro',
            'number.min': 'Quantidade deve ser um número inteiro positivo',
            'any.required': 'Quantidade é obrigatória',
          }),
      });

      const { error } = schema.validate({ barcode, quantidade });
      if (error) return res.status(400).json({ message: error.details[0].message });

      const [produto] = await Produto.findByBarcode(barcode);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      await Produto.incrementStock(barcode, parseInt(quantidade));
      res.status(200).json({ message: 'Estoque atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao incrementar estoque:', err);
      res.status(500).json({ message: 'Erro ao atualizar estoque', error: err.message });
    }
  },

  // ============================================================
  // importNFe COM AS 4 MELHORIAS IMPLEMENTADAS
  // ============================================================
  importNFe: async (req, res) => {
    let xmlPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Arquivo XML da NF-e é obrigatório' });
      }

      // --------------------------------------------------------
      // MELHORIA 2: Sanitização rigorosa do nome do arquivo
      // --------------------------------------------------------
      const nomeSanitizado = sanitizarNomeArquivo(req.file.filename);
      xmlPath = path.join(__dirname, '../../Uploads', nomeSanitizado);

      // Renomear o arquivo para o nome sanitizado (se diferente)
      const xmlPathOriginal = path.join(__dirname, '../../Uploads', req.file.filename);
      if (nomeSanitizado !== req.file.filename) {
        await fs.rename(xmlPathOriginal, xmlPath).catch(() => {
          xmlPath = xmlPathOriginal; // fallback se rename falhar
        });
      } else {
        xmlPath = xmlPathOriginal;
      }

      const xmlContent = await fs.readFile(xmlPath, 'utf-8');

      // --------------------------------------------------------
      // MELHORIA 1: Validação do conteúdo do XML
      // --------------------------------------------------------
      // Verificação básica antes de parsear
      if (!xmlContent.includes('infNFe') && !xmlContent.includes('nfeProc') && !xmlContent.includes('<NFe')) {
        await fs.unlink(xmlPath);
        return res.status(400).json({
          message: 'Arquivo enviado não é uma NF-e válida. Certifique-se de enviar o XML correto.',
        });
      }

      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlContent);

      // Validação estrutural completa da NF-e
      const errosEstrutura = validarEstruturaXML(result);
      if (errosEstrutura.length > 0) {
        await fs.unlink(xmlPath);
        return res.status(400).json({
          message: 'Estrutura da NF-e inválida',
          erros: errosEstrutura,
        });
      }

      const nfe = extrairInfNFe(result);
      if (!nfe || !nfe.det) {
        await fs.unlink(xmlPath);
        return res.status(400).json({ message: 'NF-e sem itens para processar' });
      }

      // --------------------------------------------------------
      // MELHORIA 4: Verificar se NF-e já foi importada (chave de acesso)
      // Usa a chave de acesso (44 dígitos) como identificador único.
      // Se a chave não for encontrada no XML, usa um hash do conteúdo
      // como fallback para evitar importações duplicadas.
      // --------------------------------------------------------
      let chaveAcesso = extrairChaveAcesso(result);

      // Fallback: se não achou a chave no XML, gera hash do conteúdo
      if (!chaveAcesso) {
        const crypto = require('crypto');
        chaveAcesso = 'HASH_' + crypto.createHash('md5').update(xmlContent).digest('hex');
        console.warn('[NF-e] Usando hash do conteúdo como chave:', chaveAcesso);
      }

      const jaImportada = await Produto.findNFeByChave(chaveAcesso);
      if (jaImportada) {
        await fs.unlink(xmlPath);
        return res.status(409).json({
          message: `Esta NF-e já foi importada anteriormente em ${new Date(jaImportada.importada_em).toLocaleString('pt-BR')}`,
          chave_acesso: chaveAcesso,
        });
      }

      const itens = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
      const resultados = [];
      const erros = [];
      const itensProcessados = []; // Para o log de auditoria

      for (const item of itens) {
        const produtoNFe = item.prod;
        const barcode = produtoNFe.cEAN && produtoNFe.cEAN !== 'SEM GTIN' ? produtoNFe.cEAN : produtoNFe.cProd;
        const quantidade = parseInt(produtoNFe.qCom);
        const nome = produtoNFe.xProd;
        const valorUnitario = parseFloat(produtoNFe.vUnCom);

        if (!barcode) {
          erros.push(`Código de barras ausente para o produto ${nome}`);
          continue;
        }

        if (isNaN(quantidade) || quantidade <= 0) {
          erros.push(`Quantidade inválida para o produto ${nome} (${quantidade})`);
          continue;
        }

        const [produto] = await Produto.findByBarcode(barcode);

        if (!produto) {
          try {
            await Produto.createTempProduct(nome, barcode, valorUnitario, quantidade);
            resultados.push(`Produto ${nome} (${barcode}) adicionado à lista de pendentes`);
            itensProcessados.push({ barcode, nome, quantidade, acao: 'pendente' });
          } catch (tempErr) {
            erros.push(`Erro ao salvar produto pendente ${nome}: ${tempErr.message}`);
          }
          continue;
        }

        try {
          await Produto.incrementStock(barcode, quantidade);
          resultados.push({ barcode, nome, quantidade, message: `Estoque de ${nome} atualizado` });
          itensProcessados.push({ barcode, nome, quantidade, acao: 'estoque_atualizado' });
        } catch (stockErr) {
          erros.push(`Erro ao incrementar estoque de ${nome}: ${stockErr.message}`);
        }
      }

      // --------------------------------------------------------
      // MELHORIA 3: Registrar log de auditoria
      // --------------------------------------------------------
      const adminId = req.user?.id || null;
      await Produto.registrarLogNFe({
        admin_id: adminId,
        chave_acesso: chaveAcesso || 'NAO_EXTRAIDA',
        nome_arquivo: nomeSanitizado,
        total_itens: itens.length,
        itens_atualizados: itensProcessados.filter(i => i.acao === 'estoque_atualizado').length,
        itens_pendentes: itensProcessados.filter(i => i.acao === 'pendente').length,
        erros: erros.length,
        detalhes: JSON.stringify({ resultados, erros, itensProcessados }),
      });

      // --------------------------------------------------------
      // MELHORIA 4: Registrar chave de acesso como importada
      // --------------------------------------------------------
      if (chaveAcesso) {
        await Produto.registrarNFeImportada(chaveAcesso, adminId).catch(err => {
          console.error('Erro ao registrar chave de acesso:', err.message);
        });
      }

      await fs.unlink(xmlPath);

      res.status(200).json({
        message: 'Processamento da NF-e concluído',
        chave_acesso: chaveAcesso || null,
        resultados,
        erros: erros.length > 0 ? erros : undefined,
      });

    } catch (err) {
      console.error('Erro ao processar NF-e:', err);
      if (xmlPath) {
        await fs.unlink(xmlPath).catch(e => console.error('Erro ao excluir XML:', e.message));
      }
      res.status(500).json({ message: 'Erro ao processar NF-e', error: err.message });
    }
  },

  findAllTempProducts: async (req, res) => {
    try {
      const produtos = await Produto.findAllTempProducts();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos temporários', error: err.message });
    }
  },

  deleteTempProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await Produto.deleteTempProduct(id);
      res.status(200).json({ message: 'Produto temporário excluído com sucesso' });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao excluir produto temporário', error: err.message });
    }
  },

  // MELHORIA 3: Endpoint para visualizar logs de auditoria (admin)
  getLogsNFe: async (req, res) => {
    try {
      const logs = await Produto.findLogsNFe();
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar logs de NF-e', error: err.message });
    }
  },
};

module.exports = produtoController;