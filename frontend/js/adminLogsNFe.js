// adminLogsNFe.js — Lógica da página de gestão de NF-e

const API_URL = "http://localhost:3000/api/nfe";
let todoLogs = []; // cache dos logs carregados
let paginaAtual = 1;
const LIMITE_POR_PAGINA = 10;

// ============================================================
// UTILITÁRIOS
// ============================================================
function showToast(message, type = "error") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getToken() {
  return localStorage.getItem("token");
}

function formatarData(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarChave(chave) {
  if (!chave) return "—";
  if (chave.startsWith("HASH_")) return "Hash interno";
  // Formata a chave de 44 dígitos em blocos legíveis
  return chave.replace(/(\d{4})/g, "$1 ").trim();
}

function formatarCnpj(cnpj) {
  if (!cnpj) return "—";
  const s = cnpj.replace(/\D/g, "");
  if (s.length !== 14) return cnpj;
  return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function calcularStatus(log) {
  if (log.total_erros > 0) return "erros";
  if (log.itens_pendentes > 0) return "parcial";
  return "sucesso";
}

function badgeStatus(status) {
  const mapa = {
    sucesso: `<span class="badge badge-sucesso"><i class="fa-solid fa-circle-check"></i> Sucesso</span>`,
    parcial: `<span class="badge badge-parcial"><i class="fa-solid fa-circle-exclamation"></i> Parcial</span>`,
    erros: `<span class="badge badge-erros"><i class="fa-solid fa-circle-xmark"></i> Com erros</span>`,
  };
  return mapa[status] || "—";
}

// ============================================================
// CARREGAR LOGS DO BACKEND — usa a nova API /api/nfe
// ============================================================

function montarQueryFiltros() {
  const di = document.getElementById("filtro-data-inicio")?.value;
  const df = document.getElementById("filtro-data-fim")?.value;
  const st = document.getElementById("filtro-status")?.value;
  let q = "";
  if (di) q += `&dataInicio=${encodeURIComponent(di)}`;
  if (df) q += `&dataFim=${encodeURIComponent(df)}`;
  if (st && st !== "sucesso" && st !== "erros")
    q += `&status=${encodeURIComponent(st)}`;
  if (st === "sucesso") q += "&status=processada";
  if (st === "erros") q += "&status=erro";
  return q;
}

async function carregarLogs() {
  const token = getToken();
  if (!token) {
    window.location.href = "../html/login.html";
    return;
  }

  mostrarEstado("carregando");

  try {
    const [resStats, resNotas] = await Promise.all([
      fetch(`${API_URL}/estatisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(
        `${API_URL}?page=${paginaAtual}&limit=${LIMITE_POR_PAGINA}${montarQueryFiltros()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    ]);

    if (
      [401, 403].includes(resStats.status) ||
      [401, 403].includes(resNotas.status)
    ) {
      window.location.href = "../html/login.html";
      return;
    }

    if (!resStats.ok || !resNotas.ok)
      throw new Error(`Erro ${resNotas.status}`);

    const stats = await resStats.json();
    const payload = await resNotas.json();

    todoLogs = payload.notas || [];
    atualizarResumoEstatisticas(stats);
    renderizarTabela(todoLogs);
    renderizarPaginacao(payload.total, payload.page, payload.totalPages);
  } catch (err) {
    console.error("Erro ao carregar logs:", err);
    mostrarEstado("erro", err.message);
  }
}

// ============================================================
// RESUMO — agora usa as estatísticas reais da API
// ============================================================
function atualizarResumoEstatisticas(stats) {
  const el = (id) => document.getElementById(id);
  if (el("total-importacoes"))
    el("total-importacoes").textContent = stats.total_notas ?? "0";
  if (el("total-atualizados"))
    el("total-atualizados").textContent = stats.total_atualizados ?? "0";
  if (el("total-pendentes"))
    el("total-pendentes").textContent = stats.total_temporarios ?? "0";
  if (el("total-erros"))
    el("total-erros").textContent = stats.notas_erro ?? "0";
  if (el("total-valor"))
    el("total-valor").textContent =
      stats.valor_total_importado != null
        ? `R$ ${parseFloat(stats.valor_total_importado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "—";
}

// Mantém compatibilidade com chamadas antigas
function atualizarResumo(logs) {
  if (!logs) return;
  document.getElementById("total-importacoes").textContent = logs.length;
  document.getElementById("total-atualizados").textContent = logs.reduce(
    (s, l) => s + (l.itens_atualizados || 0),
    0,
  );
  document.getElementById("total-pendentes").textContent = logs.reduce(
    (s, l) => s + (l.itens_temporarios || 0),
    0,
  );
  document.getElementById("total-erros").textContent = logs.reduce(
    (s, l) => (l.status === "erro" ? s + 1 : s),
    0,
  );
}

// ============================================================
// PAGINAÇÃO
// ============================================================
function renderizarPaginacao(total, page, totalPages) {
  let container = document.getElementById("paginacao");
  if (!container) return;
  if (!totalPages || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let html = "";
  if (page > 1)
    html += `<button class="btn-pagina" data-p="${page - 1}">&#8249; Anterior</button>`;
  html += `<span class="pagina-info">Página ${page} de ${totalPages} (${total} notas)</span>`;
  if (page < totalPages)
    html += `<button class="btn-pagina" data-p="${page + 1}">Próxima &#8250;</button>`;
  container.innerHTML = html;
  container.querySelectorAll(".btn-pagina").forEach((btn) => {
    btn.addEventListener("click", () => {
      paginaAtual = parseInt(btn.dataset.p, 10);
      carregarLogs();
    });
  });
}

// ============================================================
// RENDERIZAR TABELA
// ============================================================
function renderizarTabela(logs) {
  const tabela = document.getElementById("logs-tabela");
  const tbody = document.getElementById("logs-tbody");
  const estado = document.getElementById("logs-estado");

  if (logs.length === 0) {
    mostrarEstado("vazio");
    return;
  }

  estado.style.display = "none";
  tabela.style.display = "table";
  tbody.innerHTML = "";

  const fragment = document.createDocumentFragment();

  logs.forEach((log, index) => {
    // A nova API retorna: id, numero_nf, nome_emitente, cnpj_emitente,
    // data_emissao, valor_total, total_itens, itens_atualizados,
    // itens_temporarios, status, created_at, importado_por_nome
    const statusMap = {
      processada: "sucesso",
      parcial: "parcial",
      erro: "erros",
    };
    const status = statusMap[log.status] || "parcial";
    const valor =
      log.valor_total != null
        ? `R$ ${parseFloat(log.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.id}</td>
      <td>${formatarData(log.created_at)}</td>
      <td>${log.importado_por_nome || "Admin"}</td>
      <td title="${log.numero_nf || ""}">${log.numero_nf || "—"}</td>
      <td title="${log.nome_emitente || ""}" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${log.nome_emitente || "—"}</td>
      <td>${log.total_itens ?? "—"}</td>
      <td class="num-success">${log.itens_atualizados ?? 0}</td>
      <td class="num-warning">${log.itens_temporarios ?? 0}</td>
      <td>${valor}</td>
      <td>${badgeStatus(status)}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="btn-detalhes-log" data-id="${log.id}" title="Ver detalhes">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn-divergencias" data-id="${log.id}" title="Ver divergências de preço">
            <i class="fa-solid fa-scale-unbalanced"></i>
          </button>
          <a class="btn-xml" href="${"http://localhost:3000"}/api/nfe/${log.id}/xml" target="_blank" title="Baixar XML">
            <i class="fa-solid fa-file-code"></i>
          </a>
        </div>
      </td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  // Eventos botão detalhes
  tbody.querySelectorAll(".btn-detalhes-log").forEach((btn) => {
    btn.addEventListener("click", () =>
      abrirModalDetalhesPorId(parseInt(btn.dataset.id, 10)),
    );
  });

  // Eventos botão divergências
  tbody.querySelectorAll(".btn-divergencias").forEach((btn) => {
    btn.addEventListener("click", () =>
      abrirModalDivergencias(parseInt(btn.dataset.id, 10)),
    );
  });
}

// ============================================================
// ESTADO DA TABELA (loading / vazio / erro)
// ============================================================
function mostrarEstado(tipo, mensagem = "") {
  const tabela = document.getElementById("logs-tabela");
  const estado = document.getElementById("logs-estado");

  tabela.style.display = "none";
  estado.style.display = "block";

  const conteudo = {
    carregando: `<i class="fa-solid fa-spinner fa-spin"></i><p>Carregando logs...</p>`,
    vazio: `<i class="fa-solid fa-inbox"></i><p>Nenhum log de importação encontrado.</p>`,
    erro: `<i class="fa-solid fa-triangle-exclamation" style="color:#dc2626"></i>
           <p style="color:#dc2626">Erro ao carregar logs: ${mensagem}</p>`,
  };

  estado.innerHTML = conteudo[tipo] || conteudo.vazio;
}

// ============================================================
// FILTROS — agora delega para o back-end via query params
// ============================================================
function aplicarFiltros() {
  paginaAtual = 1;
  carregarLogs();
}

function limparFiltros() {
  document.getElementById("filtro-data-inicio").value = "";
  document.getElementById("filtro-data-fim").value = "";
  document.getElementById("filtro-status").value = "";
  paginaAtual = 1;
  carregarLogs();
}

// ============================================================
// MODAL DE DETALHES — busca a nota completa por ID
// ============================================================
async function abrirModalDetalhesPorId(notaId) {
  const token = getToken();
  if (!token) return;

  const modal = document.getElementById("modal-detalhes-log");
  const body  = document.getElementById("modal-detalhes-body");
  const tituloEl = modal.querySelector(".modal-detalhes-header h3");

  if (tituloEl) tituloEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';
  body.innerHTML = '<div class="logs-estado" style="padding:2rem"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando detalhes...</p></div>';
  modal.style.display = "flex";

  try {
    const res = await fetch(`${API_URL}/${notaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const nota = await res.json();

    // Atualiza título com número da NF-e
    if (tituloEl) {
      const nfeNum = nota.numero_nf ? `NF-e ${nota.numero_nf}` : 'Detalhes da Importação';
      tituloEl.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${nfeNum} <span class="modal-subtitulo">${nota.nome_emitente || ''}</span>`;
    }

    const atualizados = (nota.itens || []).filter(i => i.status_item === 'atualizado');
    const temporarios = (nota.itens || []).filter(i => i.status_item === 'temporario');
    const comDiverg   = (nota.itens || []).filter(i => i.divergencia_preco);

    const totalItens = nota.total_itens || (nota.itens || []).length || 0;
    const pct = totalItens > 0 ? Math.round((atualizados.length / totalItens) * 100) : 0;
    const statusBadge = nota.status === 'processada'
      ? `<span class="badge badge-sucesso"><i class="fa-solid fa-circle-check"></i> Processada</span>`
      : nota.status === 'parcial'
        ? `<span class="badge badge-parcial"><i class="fa-solid fa-circle-exclamation"></i> Parcial</span>`
        : `<span class="badge badge-erros"><i class="fa-solid fa-circle-xmark"></i> Erro</span>`;

    const infoGrid = `
      <div class="detalhe-info-grid">
        <div class="detalhe-info-item"><span>NF-e Número</span><strong>${nota.numero_nf || '—'}</strong></div>
        <div class="detalhe-info-item"><span>Emitente</span><strong>${nota.nome_emitente || '—'}</strong></div>
        <div class="detalhe-info-item"><span>CNPJ Emitente</span><strong>${formatarCnpj(nota.cnpj_emitente)}</strong></div>
        <div class="detalhe-info-item"><span>Data de Emissão</span><strong>${formatarData(nota.data_emissao)}</strong></div>
        <div class="detalhe-info-item"><span>Valor Total da Nota</span><strong>R$\u00a0${parseFloat(nota.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
        <div class="detalhe-info-item"><span>Importado por</span><strong>${nota.importado_por_nome || '—'}</strong></div>
        <div class="detalhe-info-item"><span>Data da Importação</span><strong>${formatarData(nota.created_at)}</strong></div>
        <div class="detalhe-info-item"><span>Status</span><strong>${statusBadge}</strong></div>
      </div>`;

    const barraProgresso = `
      <div class="nfe-progresso">
        <div class="nfe-progresso-label">
          <span><i class="fa-solid fa-boxes-stacked"></i> Itens processados</span>
          <span>${atualizados.length} de ${totalItens} atualizado(s) — ${temporarios.length} temporário(s)${comDiverg.length > 0 ? ` — <span style="color:#c2410c">${comDiverg.length} divergente(s)</span>` : ''}</span>
        </div>
        <div class="nfe-progresso-bar">
          <div class="nfe-progresso-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;

    const secaoAtual = atualizados.length > 0 ? `
      <div class="detalhe-secao">
        <h4 class="detalhe-secao-titulo detalhe-titulo-success">
          <i class="fa-solid fa-circle-check"></i> Estoque Atualizado (${atualizados.length})
        </h4>
        <ul class="detalhe-lista">
          ${atualizados.map(i => `
            <li class="detalhe-item">
              <span class="detalhe-item-nome">${i.nome_produto}</span>
              <span class="detalhe-item-qtd">+${i.quantidade}\u00a0un. — R$\u00a0${parseFloat(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un.</span>
              ${i.divergencia_preco ? '<span class="detalhe-item-badge-warn">⚠ preço divergente</span>' : ''}
            </li>`).join('')}
        </ul>
      </div>` : '';

    const secaoTemp = temporarios.length > 0 ? `
      <div class="detalhe-secao">
        <h4 class="detalhe-secao-titulo detalhe-titulo-warning">
          <i class="fa-solid fa-circle-exclamation"></i> Itens Temporários — não cadastrados (${temporarios.length})
        </h4>
        <ul class="detalhe-lista">
          ${temporarios.map(i => `
            <li class="detalhe-item detalhe-item-warn">
              <span class="detalhe-item-nome">${i.nome_produto}</span>
              <span class="temp-barcode">${i.barcode}</span>
            </li>`).join('')}
        </ul>
      </div>` : '';

    const secaoDiverg = comDiverg.length > 0 ? `
      <div class="detalhe-secao">
        <h4 class="detalhe-secao-titulo detalhe-titulo-diverg">
          <i class="fa-solid fa-scale-unbalanced"></i> Divergências de Preço (${comDiverg.length})
        </h4>
        <ul class="detalhe-lista">
          ${comDiverg.map(i => `
            <li class="detalhe-item detalhe-item-diverg">
              <strong class="detalhe-item-nome">${i.nome_produto}</strong>
              <span class="detalhe-item-preco">Preço na nota: <b>R$\u00a0${parseFloat(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> &nbsp;&mdash;&nbsp; Sistema: <b>R$\u00a0${parseFloat(i.preco_cadastrado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
            </li>`).join('')}
        </ul>
        <button class="btn-atualizar-precos" data-id="${notaId}">
          <i class="fa-solid fa-arrow-rotate-right"></i> Aplicar preços da nota no catálogo
        </button>
      </div>` : '';

    body.innerHTML = infoGrid + barraProgresso + secaoAtual + secaoTemp + secaoDiverg;

    // Evento do botão de atualizar preços
    body.querySelector('.btn-atualizar-precos')?.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Atualizar os preços do catálogo com os valores desta nota?')) return;
      await atualizarPrecosDivergentes(id);
      abrirModalDetalhesPorId(notaId); // Recarrega modal
    });

  } catch (err) {
    body.innerHTML = `<p style="color:#dc2626;text-align:center"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar detalhes: ${err.message}</p>`;
  }
}

// ============================================================
// MODAL DE DIVERGÊNCIAS
// ============================================================
async function abrirModalDivergencias(notaId) {
  const token = getToken();
  if (!token) return;

  const modal = document.getElementById("modal-detalhes-log");
  const body  = document.getElementById("modal-detalhes-body");
  const tituloEl = modal.querySelector(".modal-detalhes-header h3");

  if (tituloEl) tituloEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';
  body.innerHTML = '<div class="logs-estado" style="padding:2rem"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando divergências...</p></div>';
  modal.style.display = "flex";

  try {
    const res = await fetch(`${API_URL}/${notaId}/divergencias`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();

    if (tituloEl) {
      tituloEl.innerHTML = `<i class="fa-solid fa-scale-unbalanced"></i> Diverg&ecirc;ncias de Pre&ccedil;o <span class="modal-subtitulo">NF-e ${data.numero_nf || notaId}</span>`;
    }

    if (data.total_divergencias === 0) {
      body.innerHTML = '<div class="logs-estado" style="padding:2rem"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i><p style="color:#16a34a">Nenhuma divergência de preço encontrada.</p></div>';
      return;
    }

    body.innerHTML = `
      <div class="diverg-cabecalho">
        <h4><i class="fa-solid fa-scale-unbalanced"></i> NF-e ${data.numero_nf}</h4>
        <span class="badge badge-parcial">${data.total_divergencias} divergência(s)</span>
      </div>
      <table class="diverg-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th class="right">Preço na Nota</th>
            <th class="right">Preço no Sistema</th>
            <th class="right">Diferença</th>
            <th class="right">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${data.itens.map(i => {
            const diff = parseFloat(i.diferenca || 0);
            const cls  = diff > 0 ? 'diverg-maior' : 'diverg-menor';
            return `<tr>
              <td>${i.nome_no_sistema || i.nome_produto}</td>
              <td class="right">R$\u00a0${parseFloat(i.preco_na_nota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td class="right">R$\u00a0${parseFloat(i.preco_no_sistema).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td class="right ${cls}">${diff > 0 ? '+' : ''}R$\u00a0${diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td class="right">${i.quantidade}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <button class="btn-atualizar-precos" data-id="${notaId}">
        <i class="fa-solid fa-arrow-rotate-right"></i> Aplicar preços da nota no catálogo
      </button>`;

    body.querySelector('.btn-atualizar-precos')?.addEventListener('click', async (e) => {
      if (!confirm('Atualizar os preços do catálogo com os valores desta nota?')) return;
      await atualizarPrecosDivergentes(e.currentTarget.dataset.id);
      fecharModalDetalhes();
      carregarLogs();
    });

  } catch (err) {
    body.innerHTML = `<p style="color:#dc2626;text-align:center"><i class="fa-solid fa-triangle-exclamation"></i> Erro: ${err.message}</p>`;
  }
}

// ============================================================
// AÇÃO: ATUALIZAR PREÇOS DIVERGENTES
// ============================================================
async function atualizarPrecosDivergentes(notaId) {
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}/${notaId}/atualizar-precos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Preços atualizados!', 'success');
    } else {
      showToast(data.message || 'Erro ao atualizar preços.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão.', 'error');
  }
}

// ============================================================
// SEÇÃO: PRODUTOS TEMPORÁRIOS
// ============================================================
async function carregarProdutosTemporarios() {
  const token = getToken();
  if (!token) return;

  const container = document.getElementById('lista-temporarios');
  if (!container) return;

  container.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</p>';

  try {
    const res = await fetch(`${API_URL}/produtos-temporarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();

    const contador = document.getElementById('contador-temporarios');
    if (contador) contador.textContent = data.total > 0 ? `(${data.total})` : '';

    if (data.total === 0) {
      container.innerHTML = '<p style="color:#6b7280;text-align:center"><i class="fa-solid fa-check"></i> Nenhum produto pendente</p>';
      return;
    }

    container.innerHTML = `
      <table class="temp-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Barcode</th>
            <th class="right">Preço</th>
            <th class="right">Qtd</th>
            <th>Recebido em</th>
            <th>Catálogo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${data.produtos.map(p => `
            <tr data-temp-id="${p.id}">
              <td>${p.nome}</td>
              <td><span class="temp-barcode">${p.barcode}</span></td>
              <td class="right">R$\u00a0${parseFloat(p.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td class="right">${p.quantidade}</td>
              <td>${formatarData(p.created_at)}</td>
              <td>${p.ja_cadastrado > 0 ? '<span class="temp-ja-existe">⚠ já existe</span>' : '<span class="temp-novo">novo</span>'}</td>
              <td>
                <div class="temp-acoes">
                  <button class="btn-aprovar btn-aprovar-temp" data-id="${p.id}" title="Aprovar e cadastrar no catálogo">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button class="btn-rejeitar btn-rejeitar-temp" data-id="${p.id}" title="Rejeitar">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    // Eventos de aprovação
    container.querySelectorAll('.btn-aprovar-temp').forEach(btn => {
      btn.addEventListener('click', () => aprovarTemporario(parseInt(btn.dataset.id, 10)));
    });

    // Eventos de rejeição
    container.querySelectorAll('.btn-rejeitar-temp').forEach(btn => {
      btn.addEventListener('click', () => rejeitarTemporario(parseInt(btn.dataset.id, 10)));
    });

  } catch (err) {
    container.innerHTML = `<p style="color:#dc2626">Erro: ${err.message}</p>`;
  }
}

async function aprovarTemporario(id) {
  const token = getToken();
  if (!confirm('Aprovar este produto e cadastrá-lo no catálogo?')) return;
  const categoria = prompt('Categoria do produto (bebidas / alimentos / outros):', 'outros') || 'outros';
  try {
    const res = await fetch(`${API_URL}/produtos-temporarios/${id}/aprovar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Produto cadastrado!', 'success');
      carregarProdutosTemporarios();
      carregarLogs();
    } else {
      showToast(data.message || 'Erro ao aprovar produto.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão.', 'error');
  }
}

async function rejeitarTemporario(id) {
  const token = getToken();
  if (!confirm('Remover este produto da lista de pendentes?')) return;
  try {
    const res = await fetch(`${API_URL}/produtos-temporarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Produto removido.', 'success');
      carregarProdutosTemporarios();
    } else {
      showToast(data.message || 'Erro ao remover.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão.', 'error');
  }
}

// Mantém compatibilidade com chamada antiga
function abrirModalDetalhes(log) {
  if (log?.id) abrirModalDetalhesPorId(log.id);
}


  const body = document.getElementById("modal-detalhes-body");
  const status = calcularStatus(log);

  // Parsear detalhes JSON
  let detalhes = null;
  try {
    detalhes =
      typeof log.detalhes === "string"
        ? JSON.parse(log.detalhes)
        : log.detalhes;
  } catch {
    detalhes = null;
  }

  const atualizados =
    detalhes?.itensProcessados?.filter(
      (i) => i.acao === "estoque_atualizado",
    ) || [];
  const pendentes =
    detalhes?.itensProcessados?.filter((i) => i.acao === "pendente") || [];
  const erros = detalhes?.erros || [];

  // Grid de informações gerais
  const infoGrid = `
    <div class="detalhe-info-grid">
      <div class="detalhe-info-item">
        <span>Data / Hora</span>
        <strong>${formatarData(log.importado_em)}</strong>
      </div>
      <div class="detalhe-info-item">
        <span>Admin</span>
        <strong>${log.admin_nome || "Admin"}</strong>
      </div>
      <div class="detalhe-info-item">
        <span>Arquivo</span>
        <strong>${log.nome_arquivo || "—"}</strong>
      </div>
      <div class="detalhe-info-item">
        <span>Status</span>
        <strong>${badgeStatus(status)}</strong>
      </div>
      <div class="detalhe-info-item" style="grid-column: 1 / -1;">
        <span>Chave de Acesso</span>
        <strong style="font-family:monospace;font-size:0.8rem;word-break:break-all;">
          ${log.chave_acesso || "—"}
        </strong>
      </div>
    </div>
  `;

  // Seção de atualizados
  const secaoAtualizados =
    atualizados.length > 0
      ? `
    <div class="detalhe-secao">
      <h4 class="detalhe-secao-titulo detalhe-titulo-success">
        <i class="fa-solid fa-circle-check"></i> Estoque Atualizado (${atualizados.length})
      </h4>
      <ul class="detalhe-lista">
        ${atualizados
          .map(
            (i) => `
          <li class="detalhe-item">
            <span class="detalhe-item-nome">${i.nome}</span>
            <span class="detalhe-item-qtd">+${i.quantidade} un.</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `
      : "";

  // Seção de pendentes
  const secaoPendentes =
    pendentes.length > 0
      ? `
    <div class="detalhe-secao">
      <h4 class="detalhe-secao-titulo detalhe-titulo-warning">
        <i class="fa-solid fa-circle-exclamation"></i> Pendentes (${pendentes.length})
      </h4>
      <ul class="detalhe-lista">
        ${pendentes
          .map(
            (i) => `
          <li class="detalhe-item detalhe-item-warn">
            <span class="detalhe-item-nome">${i.nome}</span>
            <span>${i.barcode}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `
      : "";

  // Seção de erros
  const secaoErros =
    erros.length > 0
      ? `
    <div class="detalhe-secao">
      <h4 class="detalhe-secao-titulo detalhe-titulo-error">
        <i class="fa-solid fa-circle-xmark"></i> Erros (${erros.length})
      </h4>
      <ul class="detalhe-lista">
        ${erros
          .map(
            (e) => `
          <li class="detalhe-item detalhe-item-err">
            <i class="fa-solid fa-xmark"></i>
            <span>${e}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `
      : "";

  body.innerHTML = infoGrid + secaoAtualizados + secaoPendentes + secaoErros;
  modal.style.display = "flex";
}

function fecharModalDetalhes() {
  document.getElementById("modal-detalhes-log").style.display = "none";
}

// ============================================================
// EXPORTAR PDF
// ============================================================
function exportarPDF() {
  if (!window.jspdf?.jsPDF) {
    showToast("Biblioteca jsPDF não carregada.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 15;

  // Título
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Logs de Importação NF-e — QRUP", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, y);
  y += 10;

  // Resumo
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0);
  doc.text("Resumo", 14, y);
  y += 6;

  const totalAtualizados = todoLogs.reduce(
    (s, l) => s + (l.itens_atualizados || 0),
    0,
  );
  const totalPendentes = todoLogs.reduce(
    (s, l) => s + (l.itens_pendentes || 0),
    0,
  );
  const totalErros = todoLogs.reduce((s, l) => s + (l.total_erros || 0), 0);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Total de importações: ${todoLogs.length}`, 14, y);
  y += 5;
  doc.text(`Itens atualizados: ${totalAtualizados}`, 14, y);
  y += 5;
  doc.text(`Itens pendentes: ${totalPendentes}`, 14, y);
  y += 5;
  doc.text(`Total de erros: ${totalErros}`, 14, y);
  y += 10;

  // Tabela
  const linhas = todoLogs.map((log, i) => [
    todoLogs.length - i,
    formatarData(log.importado_em),
    log.admin_nome || "Admin",
    log.nome_arquivo || "—",
    log.total_itens ?? "—",
    log.itens_atualizados ?? 0,
    log.itens_pendentes ?? 0,
    log.total_erros ?? 0,
    calcularStatus(log).charAt(0).toUpperCase() + calcularStatus(log).slice(1),
  ]);

  doc.autoTable({
    startY: y,
    head: [
      [
        "#",
        "Data/Hora",
        "Admin",
        "Arquivo",
        "Itens",
        "Atualiz.",
        "Pend.",
        "Erros",
        "Status",
      ],
    ],
    body: linhas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [27, 92, 80] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  doc.save(`logs-nfe-${new Date().toISOString().slice(0, 10)}.pdf`);
  showToast("PDF exportado com sucesso!", "success");
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  carregarLogs();
  carregarProdutosTemporarios();

  document.getElementById("btn-filtrar")?.addEventListener("click", aplicarFiltros);
  document.getElementById("btn-limpar-filtros")?.addEventListener("click", limparFiltros);
  document.getElementById("btn-exportar-pdf")?.addEventListener("click", exportarPDF);
  document.getElementById("fechar-modal-detalhes")?.addEventListener("click", fecharModalDetalhes);
  document.getElementById("btn-recarregar-temporarios")?.addEventListener("click", carregarProdutosTemporarios);

  document.getElementById("modal-detalhes-log")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-detalhes-log")) fecharModalDetalhes();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModalDetalhes();
  });
});
