// controllers/nfeController.js
// ============================================================
// Lógica de negócio da API de NF-e
// Cada função aqui é chamada por uma rota
// ============================================================

const xml2js = require('xml2js');
const fs = require('fs');
const dbPool = require('../config/db');
const db = dbPool.promise();
const nfeModel = require('../models/nfeModel');

// ============================================================
// PARSER XML → OBJETO JAVASCRIPT
// Converte o XML bruto da NF-e em um objeto com NotaFiscal e Produtos
// ============================================================
const parseXmlNfe = async (xmlString) => {
  // xml2js converte o XML para um objeto JS
  const parser = new xml2js.Parser({
    explicitArray: false, // Não força tudo como array
    ignoreAttrs: false,   // Mantém os atributos (ex: nItem="1")
    tagNameProcessors: [xml2js.processors.stripPrefix], // Remove namespaces (xmlns:...)
  });

  const resultado = await parser.parseStringPromise(xmlString);

  // O XML pode vir com ou sem o wrapper <nfeProc>
  const nfeProc = resultado.nfeProc || resultado;
  const infNFe = nfeProc?.NFe?.infNFe;

  if (!infNFe) {
    throw new Error('XML inválido: estrutura infNFe não encontrada');
  }

  // --------------------------------------------------------
  // Extrai os campos do cabeçalho da nota
  // --------------------------------------------------------
  const ide  = infNFe.ide  || {};
  const emit = infNFe.emit || {};

  const cabecalho = {
    numero_nf:     ide.nNF     || 'N/A',
    cnpj_emitente: emit.CNPJ   || emit.CPF || 'N/A',
    nome_emitente: emit.xNome  || 'N/A',
    data_emissao:  ide.dhEmi   ? new Date(ide.dhEmi) : new Date(),
  };

  // --------------------------------------------------------
  // Extrai os itens (det pode ser um array ou um único objeto)
  // --------------------------------------------------------
  let itensRaw = infNFe.det || [];
  if (!Array.isArray(itensRaw)) {
    itensRaw = [itensRaw]; // Garante sempre ser um array
  }

  const produtos = itensRaw.map((det) => {
    const prod = det.prod || {};
    const quantidade    = parseFloat(prod.qCom)   || 0;
    const valorUnitario = parseFloat(prod.vUnCom) || 0;

    return {
      barcode:        prod.cEAN    || '',
      nome_produto:   prod.xProd   || 'Produto sem nome',
      quantidade,
      valor_unitario: valorUnitario,
      valor_total_item: parseFloat((quantidade * valorUnitario).toFixed(2)),
    };
  });

  // --------------------------------------------------------
  // Calcula o valor total somando todos os itens
  // --------------------------------------------------------
  const valor_total = parseFloat(
    produtos.reduce((acc, p) => acc + p.valor_total_item, 0).toFixed(2)
  );

  return {
    cabecalho,
    produtos,
    valor_total,
    total_itens: produtos.length,
  };
};


// ============================================================
// POST /api/nfe/importar
// Recebe o XML, processa e salva tudo no banco
// ============================================================
const importarNfe = async (req, res) => {
  // Verifica se o arquivo foi enviado
  if (!req.file) {
    return res.status(400).json({ message: 'Arquivo XML não enviado.' });
  }

  const xmlString = fs.readFileSync(req.file.path, 'utf-8');
  const user_id   = req.user.id; // Vem do authMiddleware

  try {
    // ----------------------------------------------------------
    // 1. FAZ O PARSE DO XML
    // ----------------------------------------------------------
    let dadosNfe;
    try {
      dadosNfe = await parseXmlNfe(xmlString);
    } catch (parseError) {
      fs.unlinkSync(req.file.path); // Remove o arquivo após processar
      return res.status(400).json({ message: `Erro ao ler o XML: ${parseError.message}` });
    }

    const { cabecalho, produtos, valor_total, total_itens } = dadosNfe;

    // ----------------------------------------------------------
    // 2. VERIFICA SE ESSA NOTA JÁ FOI IMPORTADA
    // ----------------------------------------------------------
    const notaDuplicada = await nfeModel.notaJaImportada(
      cabecalho.numero_nf,
      cabecalho.cnpj_emitente
    );

    if (notaDuplicada) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        message: `NF-e número ${cabecalho.numero_nf} já foi importada anteriormente.`,
        nota_existente_id: notaDuplicada.id,
      });
    }

    // ----------------------------------------------------------
    // 3. PROCESSA CADA PRODUTO
    // Verifica se existe no catálogo e atualiza ou manda pro temp
    // ----------------------------------------------------------
    let itens_atualizados = 0;
    let itens_temporarios = 0;

    const itensParaSalvar = [];

    for (const produto of produtos) {
      // Busca o produto pelo barcode no catálogo
      const [[produtoCadastrado]] = await db.query(
        'SELECT produto_id, preco, quantidade_estoque FROM produtos WHERE barcode = ? AND ativo = 1',
        [produto.barcode]
      );

      if (produtoCadastrado) {
        // PRODUTO ENCONTRADO → Atualiza o estoque
        await db.query(
          'UPDATE produtos SET quantidade_estoque = quantidade_estoque + ? WHERE produto_id = ?',
          [produto.quantidade, produtoCadastrado.produto_id]
        );

        const precoCadastrado  = parseFloat(produtoCadastrado.preco);
        const divergenciaPreco = precoCadastrado !== produto.valor_unitario;

        itensParaSalvar.push({
          ...produto,
          produto_id:        produtoCadastrado.produto_id,
          preco_cadastrado:  precoCadastrado,
          divergencia_preco: divergenciaPreco,
          status_item:       'atualizado',
        });

        itens_atualizados++;
      } else {
        // PRODUTO NÃO ENCONTRADO → Vai para produtos_temporarios
        await db.query(
          `INSERT INTO produtos_temporarios (nome, barcode, valor_unitario, quantidade)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             quantidade    = quantidade + VALUES(quantidade),
             valor_unitario = VALUES(valor_unitario)`,
          [produto.nome_produto, produto.barcode, produto.valor_unitario, produto.quantidade]
        );

        itensParaSalvar.push({
          ...produto,
          produto_id:        null,
          preco_cadastrado:  null,
          divergencia_preco: false,
          status_item:       'temporario',
        });

        itens_temporarios++;
      }
    }

    // ----------------------------------------------------------
    // 4. DEFINE O STATUS GERAL DA NOTA
    // ----------------------------------------------------------
    let statusNota = 'processada';
    if (itens_temporarios > 0 && itens_atualizados > 0) statusNota = 'parcial';
    if (itens_atualizados === 0 && itens_temporarios > 0) statusNota = 'parcial';

    // ----------------------------------------------------------
    // 5. SALVA A NOTA E OS ITENS NO BANCO
    // ----------------------------------------------------------
    const notaFiscalId = await nfeModel.salvarNotaFiscal({
      numero_nf:        cabecalho.numero_nf,
      cnpj_emitente:    cabecalho.cnpj_emitente,
      nome_emitente:    cabecalho.nome_emitente,
      data_emissao:     cabecalho.data_emissao,
      valor_total,
      total_itens,
      itens_atualizados,
      itens_temporarios,
      status:           statusNota,
      xml_original:     xmlString,
      importado_por:    user_id,
    });

    await nfeModel.salvarItensNfe(notaFiscalId, itensParaSalvar);

    // ----------------------------------------------------------
    // 6. REMOVE O ARQUIVO TEMPORÁRIO E RESPONDE
    // ----------------------------------------------------------
    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      message:          'NF-e importada com sucesso!',
      nota_fiscal_id:   notaFiscalId,
      numero_nf:        cabecalho.numero_nf,
      emitente:         cabecalho.nome_emitente,
      data_emissao:     cabecalho.data_emissao,
      valor_total,
      total_itens,
      itens_atualizados,
      itens_temporarios,
      status:           statusNota,
    });

  } catch (error) {
    // Remove arquivo se ainda existir
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erro ao importar NF-e:', error);
    return res.status(500).json({ message: 'Erro interno ao processar a NF-e.' });
  }
};


// ============================================================
// GET /api/nfe
// Lista todas as NF-es importadas (com filtros e paginação)
// ============================================================
const listarNfe = async (req, res) => {
  try {
    const { page, limit, dataInicio, dataFim, status, cnpj_emitente } = req.query;

    const resultado = await nfeModel.listarNotasFiscais({
      page:          page  || 1,
      limit:         limit || 10,
      dataInicio,
      dataFim,
      status,
      cnpj_emitente,
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Erro ao listar NF-es:', error);
    return res.status(500).json({ message: 'Erro ao listar notas fiscais.' });
  }
};


// ============================================================
// GET /api/nfe/:id
// Retorna uma NF-e completa com todos os seus itens
// ============================================================
const buscarNfePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const nota = await nfeModel.buscarNotaPorId(id);

    if (!nota) {
      return res.status(404).json({ message: 'Nota fiscal não encontrada.' });
    }

    return res.status(200).json(nota);
  } catch (error) {
    console.error('Erro ao buscar NF-e:', error);
    return res.status(500).json({ message: 'Erro ao buscar nota fiscal.' });
  }
};


// ============================================================
// GET /api/nfe/:id/divergencias
// Retorna os itens com preço diferente do cadastrado no sistema
// ============================================================
const buscarDivergencias = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se a nota existe
    const nota = await nfeModel.buscarNotaPorId(id);
    if (!nota) {
      return res.status(404).json({ message: 'Nota fiscal não encontrada.' });
    }

    const divergencias = await nfeModel.buscarDivergencias(id);

    return res.status(200).json({
      nota_fiscal_id: Number(id),
      numero_nf:      nota.numero_nf,
      total_divergencias: divergencias.length,
      itens: divergencias,
    });
  } catch (error) {
    console.error('Erro ao buscar divergências:', error);
    return res.status(500).json({ message: 'Erro ao buscar divergências de preço.' });
  }
};


// ============================================================
// GET /api/nfe/estatisticas
// Retorna números gerais sobre todas as NF-es importadas
// ============================================================
const buscarEstatisticas = async (req, res) => {
  try {
    const stats = await nfeModel.buscarEstatisticas();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
  }
};


module.exports = {
  importarNfe,
  listarNfe,
  buscarNfePorId,
  buscarDivergencias,
  buscarEstatisticas,
};