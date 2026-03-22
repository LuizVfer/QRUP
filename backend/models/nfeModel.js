// models/nfeModel.js
// ============================================================
// Todas as queries SQL relacionadas a NF-e
// Segue o mesmo padrão dos outros models do projeto
// ============================================================

const dbPool = require('../config/db');
const db = dbPool.promise();

// ------------------------------------------------------------
// SALVAR UMA NF-E COMPLETA
// Recebe o objeto já processado e salva no banco
// ------------------------------------------------------------
const salvarNotaFiscal = async (dadosNota) => {
  const {
    numero_nf,
    cnpj_emitente,
    nome_emitente,
    data_emissao,
    valor_total,
    total_itens,
    itens_atualizados,
    itens_temporarios,
    status,
    xml_original,
    importado_por,
  } = dadosNota;

  const [result] = await db.query(
    `INSERT INTO notas_fiscais
      (numero_nf, cnpj_emitente, nome_emitente, data_emissao,
       valor_total, total_itens, itens_atualizados, itens_temporarios,
       status, xml_original, importado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numero_nf,
      cnpj_emitente,
      nome_emitente,
      data_emissao,
      valor_total,
      total_itens,
      itens_atualizados,
      itens_temporarios,
      status,
      xml_original,
      importado_por,
    ]
  );

  return result.insertId; // Retorna o ID da nota criada
};

// ------------------------------------------------------------
// SALVAR OS ITENS DE UMA NF-E
// Chama após salvar a nota para registrar cada produto
// ------------------------------------------------------------
const salvarItensNfe = async (notaFiscalId, itens) => {
  if (!itens || itens.length === 0) return;

  // Monta os valores para um INSERT em lote (mais eficiente)
  const valores = itens.map((item) => [
    notaFiscalId,
    item.barcode,
    item.nome_produto,
    item.quantidade,
    item.valor_unitario,
    item.valor_total_item,
    item.produto_id || null,
    item.preco_cadastrado || null,
    item.divergencia_preco ? 1 : 0,
    item.status_item,
  ]);

  await db.query(
    `INSERT INTO itens_nfe
      (nota_fiscal_id, barcode, nome_produto, quantidade,
       valor_unitario, valor_total_item, produto_id,
       preco_cadastrado, divergencia_preco, status_item)
     VALUES ?`,
    [valores]
  );
};

// ------------------------------------------------------------
// LISTAR NF-ES (com paginação e filtros)
// ------------------------------------------------------------
const listarNotasFiscais = async (filtros = {}) => {
  const {
    page = 1,
    limit = 10,
    dataInicio,
    dataFim,
    status,
    cnpj_emitente,
  } = filtros;

  const offset = (page - 1) * limit;
  const params = [];
  const condicoes = [];

  if (dataInicio) {
    condicoes.push('nf.data_emissao >= ?');
    params.push(dataInicio + ' 00:00:00');
  }
  if (dataFim) {
    condicoes.push('nf.data_emissao <= ?');
    params.push(dataFim + ' 23:59:59');
  }
  if (status) {
    condicoes.push('nf.status = ?');
    params.push(status);
  }
  if (cnpj_emitente) {
    condicoes.push('nf.cnpj_emitente = ?');
    params.push(cnpj_emitente);
  }

  const where = condicoes.length > 0 ? 'WHERE ' + condicoes.join(' AND ') : '';

  // Busca o total de registros (para paginação)
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM notas_fiscais nf ${where}`,
    params
  );

  // Busca os registros da página atual
  const [notas] = await db.query(
    `SELECT
       nf.id,
       nf.numero_nf,
       nf.cnpj_emitente,
       nf.nome_emitente,
       nf.data_emissao,
       nf.valor_total,
       nf.total_itens,
       nf.itens_atualizados,
       nf.itens_temporarios,
       nf.status,
       nf.created_at,
       u.username AS importado_por_nome
     FROM notas_fiscais nf
     JOIN usuarios u ON u.user_id = nf.importado_por
     ${where}
     ORDER BY nf.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    notas,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// ------------------------------------------------------------
// BUSCAR UMA NF-E POR ID (com todos os itens)
// ------------------------------------------------------------
const buscarNotaPorId = async (id) => {
  // Busca os dados da nota
  const [[nota]] = await db.query(
    `SELECT
       nf.*,
       u.username AS importado_por_nome
     FROM notas_fiscais nf
     JOIN usuarios u ON u.user_id = nf.importado_por
     WHERE nf.id = ?`,
    [id]
  );

  if (!nota) return null;

  // Busca os itens dessa nota
  const [itens] = await db.query(
    `SELECT
       i.*,
       p.titulo AS produto_titulo_atual,
       p.preco  AS produto_preco_atual,
       p.quantidade_estoque AS estoque_atual
     FROM itens_nfe i
     LEFT JOIN produtos p ON p.produto_id = i.produto_id
     WHERE i.nota_fiscal_id = ?
     ORDER BY i.id ASC`,
    [id]
  );

  return { ...nota, itens };
};

// ------------------------------------------------------------
// BUSCAR DIVERGÊNCIAS DE PREÇO DE UMA NF-E
// Retorna apenas os itens onde o preço da nota != preço do sistema
// ------------------------------------------------------------
const buscarDivergencias = async (notaFiscalId) => {
  const [itens] = await db.query(
    `SELECT
       i.barcode,
       i.nome_produto,
       i.valor_unitario        AS preco_na_nota,
       i.preco_cadastrado      AS preco_no_sistema,
       (i.valor_unitario - i.preco_cadastrado) AS diferenca,
       i.quantidade,
       p.titulo                AS nome_no_sistema
     FROM itens_nfe i
     LEFT JOIN produtos p ON p.produto_id = i.produto_id
     WHERE i.nota_fiscal_id = ?
       AND i.divergencia_preco = 1`,
    [notaFiscalId]
  );

  return itens;
};

// ------------------------------------------------------------
// VERIFICAR SE UMA NF-E JÁ FOI IMPORTADA (evitar duplicatas)
// ------------------------------------------------------------
const notaJaImportada = async (numero_nf, cnpj_emitente) => {
  const [[result]] = await db.query(
    `SELECT id FROM notas_fiscais
     WHERE numero_nf = ? AND cnpj_emitente = ?
     LIMIT 1`,
    [numero_nf, cnpj_emitente]
  );

  return result || null; // Retorna a nota se já existe, null se não existe
};

// ------------------------------------------------------------
// ESTATÍSTICAS GERAIS
// ------------------------------------------------------------
const buscarEstatisticas = async () => {
  const [[stats]] = await db.query(
    `SELECT
       COUNT(*)                                        AS total_notas,
       SUM(valor_total)                                AS valor_total_importado,
       SUM(total_itens)                                AS total_itens_processados,
       SUM(itens_atualizados)                          AS total_atualizados,
       SUM(itens_temporarios)                          AS total_temporarios,
       SUM(CASE WHEN status = 'processada' THEN 1 ELSE 0 END) AS notas_ok,
       SUM(CASE WHEN status = 'parcial'    THEN 1 ELSE 0 END) AS notas_parciais,
       SUM(CASE WHEN status = 'erro'       THEN 1 ELSE 0 END) AS notas_erro
     FROM notas_fiscais`
  );

  // Última NF-e importada
  const [[ultima]] = await db.query(
    `SELECT numero_nf, nome_emitente, created_at
     FROM notas_fiscais
     ORDER BY created_at DESC
     LIMIT 1`
  );

  return { ...stats, ultima_importacao: ultima || null };
};

module.exports = {
  salvarNotaFiscal,
  salvarItensNfe,
  listarNotasFiscais,
  buscarNotaPorId,
  buscarDivergencias,
  notaJaImportada,
  buscarEstatisticas,
};