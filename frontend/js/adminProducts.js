let produtos = [];
let produtosTemporarios = [];
let paginaAtual = 1;
const produtosPorPagina = 18;

// Recupera o token de autenticação do localStorage
function getToken() {
  const token = localStorage.getItem("token");
  if (!token || typeof token !== "string" || token.trim() === "") {
    console.error("Token inválido ou não encontrado.");
    return null;
  }
  return token;
}

// Exibe notificações toast para feedback do usuário
function showToast(message, type = "error") {
  if (!message || typeof message !== "string" || message.trim() === "") {
    console.error("Mensagem de toast inválida ou vazia.");
    return;
  }
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.error("Contêiner de toast não encontrado.");
    return;
  }
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message.trim();
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Exibe um popup de confirmação para ações
function showConfirmationPopup(message, onConfirm, onCancel) {
  if (!message || typeof message !== "string" || message.trim() === "") {
    console.error("Mensagem de confirmação inválida ou vazia.");
    return;
  }
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <p>${message.trim()}</p>
      <div class="confirmation-modal-buttons">
        <button id="confirmar-acao">Confirmar</button>
        <button id="cancelar-acao">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("confirmar-acao").addEventListener("click", () => {
    document.body.removeChild(modal);
    if (onConfirm) onConfirm();
  });
  document.getElementById("cancelar-acao").addEventListener("click", () => {
    document.body.removeChild(modal);
    if (onCancel) onCancel();
  });
}

// Valida se um código de barras é EAN-13 válido
function isValidEAN13(barcode) {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split("").map(Number);
  const checksum = digits.pop();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return checksum === calculatedChecksum;
}

// Gera um código de barras EAN-13 válido
function gerarEAN13() {
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}

// Carrega a lista de produtos do servidor
function carregarProdutos() {
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado como administrador.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  if (!document.getElementById("container-itens")) {
    console.warn("Página não requer carregamento de produtos.");
    return;
  }

  fetch(`${API_URL}/produtos/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        return response.text().then((text) => {
          throw new Error(`Erro ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      produtos = data;
      paginaAtual = 1; // Reseta para a primeira página ao carregar
      renderizarProdutos(produtos);
      renderizarPaginacao(produtos);
    })
    .catch((error) => {
      console.error("Erro ao carregar produtos:", error);
      const container = document.getElementById("container-itens");
      if (container) {
        container.innerHTML = `<p>Erro ao carregar produtos: ${error.message}</p>`;
      }
      showToast(`Erro ao carregar produtos: ${error.message}`, "error");
      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    });
}

// Carrega a lista de produtos temporários
function carregarProdutosTemporarios() {
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado como administrador.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  fetch(`${API_URL}/produtos/temp-products`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        return response.text().then((text) => {
          throw new Error(`Erro ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      produtosTemporarios = data;
      renderizarProdutosTemporarios(produtosTemporarios);
    })
    .catch((error) => {
      console.error("Erro ao carregar produtos temporários:", error);
      showToast(
        `Erro ao carregar produtos temporários: ${error.message}`,
        "error",
      );
      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    });
}

// Renderiza os produtos na interface com filtros e paginação
function renderizarProdutos(lista) {
  const buscaProduto = document.getElementById("busca-produto");
  const filtroCategoria = document.getElementById("filtro-categoria");
  const filtroStatus = document.getElementById("filtro-status-produto");
  const containerItens = document.getElementById("container-itens");

  if (!containerItens) {
    console.warn("Container de itens não encontrado.");
    showToast("Container de itens não encontrado.", "error");
    return;
  }

  const termoBusca = buscaProduto ? buscaProduto.value.toLowerCase() : "";
  const categoriaSelecionada = filtroCategoria ? filtroCategoria.value : "";
  const statusSelecionado = filtroStatus ? filtroStatus.value : "";

  const produtosFiltrados = lista.filter((produto) => {
    const nomeIncluiTermo = produto.titulo.toLowerCase().includes(termoBusca);
    const categoriaCorreta = categoriaSelecionada
      ? produto.categoria === categoriaSelecionada
      : true;
    const statusCorreto =
      statusSelecionado === ""
        ? true
        : produto.ativo === parseInt(statusSelecionado);
    return nomeIncluiTermo && categoriaCorreta && statusCorreto;
  });

  // Calcula o índice inicial e final para a página atual
  const indiceInicio = (paginaAtual - 1) * produtosPorPagina;
  const indiceFim = indiceInicio + produtosPorPagina;
  const produtosPagina = produtosFiltrados.slice(indiceInicio, indiceFim);

  containerItens.innerHTML = "";
  if (produtosPagina.length === 0) {
    containerItens.innerHTML =
      "<p>Nenhum produto encontrado com os filtros aplicados.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  produtosPagina.forEach((produto) => {
    const item = document.createElement("div");
    item.classList.add("item");
    item.setAttribute("data-produto-id", produto.produto_id);
    const precoFormatado = parseFloat(produto.preco)
      .toFixed(2)
      .replace(".", ",");

    item.innerHTML = `
      <span class="titulo-item">${produto.titulo}</span>
      <img src="/Uploads/${produto.imagem}" alt="${
        produto.titulo
      }" class="img-item">
      <span class="preco-item">R$ ${precoFormatado}</span>
      <span class="estoque-item">Estoque: ${produto.quantidade_estoque}</span>
      <span class="status-item">${produto.ativo ? "Ativo" : "Desativado"}</span>
      <canvas class="barcode-canvas" data-barcode="${
        produto.barcode || ""
      }"></canvas>
      <button class="botao-item-alterar">Alterar</button>
      <button class="botao-item-status ${
        produto.ativo ? "botao-ativo" : "botao-inativo"
      }">
        ${produto.ativo ? "Desativar" : "Ativar"}
      </button>
    `;

    item
      .querySelector(".botao-item-alterar")
      .addEventListener("click", () => editarProduto(produto));
    item
      .querySelector(".botao-item-status")
      .addEventListener("click", () =>
        alterarStatusProduto(produto.produto_id, produto.ativo),
      );
    fragment.appendChild(item);
  });

  containerItens.appendChild(fragment);

  if (typeof JsBarcode === "undefined") {
    import("./gerarBarcode.js")
      .then(() => {
        document.querySelectorAll(".barcode-canvas").forEach((canvas) => {
          const barcodeValue = canvas.dataset.barcode;
          if (barcodeValue && isValidEAN13(barcodeValue)) {
            try {
              JsBarcode(canvas, barcodeValue, {
                format: "EAN13",
                lineColor: "#000",
                width: 2,
                height: 50,
                displayValue: true,
              });
            } catch (err) {
              console.error(
                `Erro ao gerar código de barras para ${barcodeValue}:`,
                err,
              );
              canvas.replaceWith(
                document.createTextNode("Código de barras inválido"),
              );
            }
          } else {
            canvas.replaceWith(document.createTextNode("Sem código de barras"));
          }
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar JsBarcode:", err);
        showToast(
          `Erro ao carregar códigos de barras: ${err.message}`,
          "error",
        );
      });
  } else {
    document.querySelectorAll(".barcode-canvas").forEach((canvas) => {
      const barcodeValue = canvas.dataset.barcode;
      if (barcodeValue && isValidEAN13(barcodeValue)) {
        try {
          JsBarcode(canvas, barcodeValue, {
            format: "EAN13",
            lineColor: "#000",
            width: 2,
            height: 50,
            displayValue: true,
          });
        } catch (err) {
          console.error(
            `Erro ao gerar código de barras para ${barcodeValue}:`,
            err,
          );
          canvas.replaceWith(
            document.createTextNode("Código de barras inválido"),
          );
        }
      } else {
        canvas.replaceWith(document.createTextNode("Sem código de barras"));
      }
    });
  }

  // Renderiza os controles de paginação
  renderizarPaginacao(produtosFiltrados);
}

// Renderiza os botões de paginação
function renderizarPaginacao(produtosFiltrados) {
  const paginacaoContainer = document.getElementById("paginacao-container");
  if (!paginacaoContainer) {
    console.warn("Container de paginação não encontrado.");
    return;
  }

  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);
  paginacaoContainer.innerHTML = "";

  if (totalPaginas <= 1) {
    return; // Não renderiza paginação se houver apenas uma página
  }

  const fragment = document.createDocumentFragment();

  // Botão "Anterior"
  const botaoAnterior = document.createElement("button");
  botaoAnterior.classList.add("botao-paginacao");
  botaoAnterior.textContent = "Anterior";
  botaoAnterior.disabled = paginaAtual === 1;
  botaoAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarProdutos(produtos);
    }
  });
  fragment.appendChild(botaoAnterior);

  // Botões de número de página
  for (let i = 1; i <= totalPaginas; i++) {
    const botaoPagina = document.createElement("button");
    botaoPagina.classList.add("botao-paginacao");
    if (i === paginaAtual) {
      botaoPagina.classList.add("ativo");
    }
    botaoPagina.textContent = i;
    botaoPagina.addEventListener("click", () => {
      paginaAtual = i;
      renderizarProdutos(produtos);
    });
    fragment.appendChild(botaoPagina);
  }

  // Botão "Próximo"
  const botaoProximo = document.createElement("button");
  botaoProximo.classList.add("botao-paginacao");
  botaoProximo.textContent = "Próximo";
  botaoProximo.disabled = paginaAtual === totalPaginas;
  botaoProximo.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarProdutos(produtos);
    }
  });
  fragment.appendChild(botaoProximo);

  paginacaoContainer.appendChild(fragment);
}

// Renderiza os produtos temporários na tabela regl
function renderizarProdutosTemporarios(lista) {
  const tabelaCorpo = document.getElementById(
    "tabela-corpo-produtos-temporarios",
  );

  if (!tabelaCorpo) {
    console.warn(
      "Elemento para tabela de produtos temporários não encontrado.",
    );
    return;
  }

  tabelaCorpo.innerHTML = "";
  if (lista.length === 0) {
    tabelaCorpo.innerHTML =
      "<tr><td colspan='5'>Nenhum produto temporário encontrado.</td></tr>";
    return;
  }

  const fragment = document.createDocumentFragment();
  lista.forEach((produto) => {
    const row = document.createElement("tr");
    const valorFormatado = parseFloat(produto.valor_unitario)
      .toFixed(2)
      .replace(".", ",");
    row.innerHTML = `
      <td>${produto.nome}</td>
      <td><canvas class="barcode-canvas" data-barcode="${produto.barcode}"></canvas></td>
      <td>R$ ${valorFormatado}</td>
      <td>${produto.quantidade}</td>
      <td><button class="botao-excluir-temp" data-id="${produto.id}">Excluir</button></td>
    `;
    fragment.appendChild(row);
  });
  tabelaCorpo.appendChild(fragment);

  // Gera códigos de barras
  document.querySelectorAll(".barcode-canvas").forEach((canvas) => {
    const barcodeValue = canvas.dataset.barcode;
    if (barcodeValue && isValidEAN13(barcodeValue)) {
      try {
        JsBarcode(canvas, barcodeValue, {
          format: "EAN13",
          lineColor: "#000",
          width: 2,
          height: 50,
        });
      } catch (err) {
        console.error(
          `Erro ao gerar código de barras para ${barcodeValue}:`,
          err,
        );
        canvas.replaceWith(
          document.createTextNode("Código de barras inválido"),
        );
      }
    } else {
      canvas.replaceWith(document.createTextNode("Sem código de barras"));
    }
  });
}

// Exclui um produto temporário
function excluirProdutoTemporario(id) {
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  showConfirmationPopup(
    "Tem certeza que deseja excluir este produto temporário?",
    () => {
      fetch(`${API_URL}/produtos/temp-products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error("Sessão inválida. Faça login novamente.");
            }
            return response.text().then((text) => {
              throw new Error(`Erro ${response.status}: ${text}`);
            });
          }
          return response.json();
        })
        .then(() => {
          showToast("Produto temporário excluído com sucesso!", "success");
          carregarProdutosTemporarios();
        })
        .catch((error) => {
          console.error("Erro ao excluir produto temporário:", error);
          showToast(
            `Erro ao excluir produto temporário: ${error.message}`,
            "error",
          );
          if (error.message.includes("Sessão inválida")) {
            window.location.href = "../html/login.html";
          }
        });
    },
    () => showToast("Ação cancelada.", "info"),
  );
}

// Aplica filtros aos produtos
function filtrarProdutos() {
  paginaAtual = 1; // Reseta para a primeira página ao filtrar
  renderizarProdutos(produtos);
}

// Altera o status (ativo/desativado) de um produto
function alterarStatusProduto(id, ativo) {
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  showConfirmationPopup(
    `Tem certeza que deseja ${ativo ? "desativar" : "ativar"} este produto?`,
    () => {
      fetch(`${API_URL}/produtos/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ativo: ativo ? 0 : 1 }),
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error("Sessão inválida. Faça login novamente.");
            }
            return response.json().then((err) => {
              throw new Error(
                err.message ||
                  `Erro ${response.status}: ${response.statusText}`,
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          showToast(
            data.message ||
              `Produto ${ativo ? "desativado" : "ativado"} com sucesso!`,
            "success",
          );
          carregarProdutos();
        })
        .catch((error) => {
          console.error("Erro ao alterar status do produto:", error);
          showToast(
            `Erro ao alterar status do produto: ${error.message}`,
            "error",
          );
          if (error.message.includes("Sessão inválida")) {
            window.location.href = "../html/login.html";
          }
        });
    },
    () => showToast("Ação cancelada.", "info"),
  );
}

// Cadastra um novo produto
function adicionarProduto(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const preco = parseFloat(document.getElementById("preco").value);
  const categoria = document.getElementById("categoria").value;
  let barcode = document.getElementById("barcode").value;
  const quantidade_estoque = parseInt(
    document.getElementById("quantidade_estoque").value,
  );

  if (!titulo) {
    showToast("O nome do produto é obrigatório.", "error");
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    showToast("O preço deve ser um número positivo.", "error");
    return;
  }
  if (!categoria) {
    showToast("A categoria é obrigatória.", "error");
    return;
  }
  if (!barcode) {
    barcode = gerarEAN13();
    document.getElementById("barcode").value = barcode;
  }
  if (!isValidEAN13(barcode)) {
    showToast(
      "Código de barras EAN-13 inválido. Deve ter 13 dígitos com checksum válido.",
      "error",
    );
    return;
  }
  if (isNaN(quantidade_estoque) || quantidade_estoque < 0) {
    showToast(
      "Quantidade em estoque deve ser um número inteiro não negativo.",
      "error",
    );
    return;
  }

  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("preco", preco);
  formData.append("barcode", barcode);
  formData.append("categoria", categoria);
  formData.append("quantidade_estoque", quantidade_estoque);
  const imagem = document.getElementById("imagem").files[0];
  if (imagem) formData.append("imagem", imagem);

  fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        throw new Error("Erro ao cadastrar produto");
      }
      return response.json();
    })
    .then(() => {
      showToast("Produto cadastrado com sucesso!", "success");
      document.getElementById("form-adicionar-produto").reset();
      carregarProdutos();
      carregarProdutosTemporarios();
    })
    .catch((error) => {
      console.error("Erro ao cadastrar produto:", error);
      showToast(`Erro ao cadastrar produto: ${error.message}`, "error");
      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    });
}

// Abre um modal para edição de um produto
function editarProduto(produto) {
  if (!produto || !produto.produto_id || !produto.titulo) {
    showToast("Dados do produto inválidos.", "error");
    return;
  }
  const existingModal = document.querySelector(".modal");
  if (existingModal) {
    existingModal.parentNode.removeChild(existingModal);
  }

  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Alterar Produto</h2>
      <label>Nome do Produto:</label>
      <input type="text" id="novoTitulo" value="${produto.titulo}" required>
      <label>Preço:</label>
      <input type="number" id="novoPreco" step="0.01" value="${
        produto.preco
      }" required>
      <label>Código de barras:</label>
      <input type="text" id="novoBarcode" value="${
        produto.barcode || ""
      }" pattern="\d{13}" title="Código de barras deve ter 13 dígitos numéricos" required>
      <label>Quantidade em Estoque:</label>
      <input type="number" id="novaQuantidadeEstoque" min="0" value="${
        produto.quantidade_estoque || 0
      }" required>
      <label>Imagem:</label>
      <input type="file" id="novaImagem">
      <label>Categoria:</label>
      <select id="novaCategoria">
        <option value="">Selecione a categoria</option>
        <option value="bebidas" ${
          produto.categoria === "bebidas" ? "selected" : ""
        }>Bebidas</option>
        <option value="alimentos" ${
          produto.categoria === "alimentos" ? "selected" : ""
        }>Alimentos</option>
        <option value="outros" ${
          produto.categoria === "outros" ? "selected" : ""
        }>Outros</option>
      </select>
      <button class="salvarAlteracao" id="salvarAlteracao">Salvar</button>
      <button class="cancelarAlteracao" id="cancelarAlteracao">Cancelar</button>
    </div>
  `;

  document.body.appendChild(modal);
  document
    .getElementById("salvarAlteracao")
    .addEventListener("click", () =>
      salvarAlteracaoProduto(produto.produto_id, modal),
    );
  document
    .getElementById("cancelarAlteracao")
    .addEventListener("click", () => fecharModal(modal, true));
}

// Salva as alterações de um produto
function salvarAlteracaoProduto(id, modal) {
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const titulo = document.getElementById("novoTitulo").value.trim();
  const preco = parseFloat(document.getElementById("novoPreco").value);
  const categoria = document.getElementById("novaCategoria").value;
  const barcode = document.getElementById("novoBarcode").value;
  const quantidade_estoque = parseInt(
    document.getElementById("novaQuantidadeEstoque").value,
  );

  if (!titulo) {
    showToast("O nome do produto é obrigatório.", "error");
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    showToast("O preço deve ser um número positivo.", "error");
    return;
  }
  if (!categoria) {
    showToast("A categoria é obrigatória.", "error");
    return;
  }
  if (!isValidEAN13(barcode)) {
    showToast(
      "Código de barras EAN-13 inválido. Deve ter 13 dígitos com checksum válido.",
      "error",
    );
    return;
  }
  if (isNaN(quantidade_estoque) || quantidade_estoque < 0) {
    showToast(
      "Quantidade em estoque deve ser um número inteiro não negativo.",
      "error",
    );
    return;
  }

  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("preco", preco);
  formData.append("categoria", categoria);
  formData.append("barcode", barcode);
  formData.append("quantidade_estoque", quantidade_estoque);
  const novaImagem = document.getElementById("novaImagem").files[0];
  if (novaImagem) formData.append("imagem", novaImagem);

  fetch(`${API_URL}/produtos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        throw new Error("Erro ao atualizar produto");
      }
      return response.json();
    })
    .then(() => {
      showToast("Produto atualizado com sucesso!", "success");
      fecharModal(modal, true);
      carregarProdutos();
    })
    .catch((error) => {
      console.error("Erro ao atualizar produto:", error);
      showToast(`Erro ao atualizar produto: ${error.message}`, "error");
      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    });
}

// Incrementa o estoque de um produto
function incrementarEstoque(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const barcode = document.getElementById("incrementarBarcode").value;
  const quantidade = parseInt(
    document.getElementById("incrementarQuantidade").value,
  );

  if (!isValidEAN13(barcode)) {
    showToast(
      "Código de barras EAN-13 inválido. Deve ter 13 dígitos com checksum válido.",
      "error",
    );
    return;
  }
  if (isNaN(quantidade) || quantidade <= 0) {
    showToast("Quantidade deve ser um número inteiro positivo.", "error");
    return;
  }

  fetch(`${API_URL}/produtos/increment-stock`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ barcode, quantidade }),
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        return response.text().then((text) => {
          try {
            const err = JSON.parse(text);
            throw new Error(err.message || "Erro ao atualizar estoque");
          } catch (e) {
            throw new Error(text || "Erro ao atualizar estoque");
          }
        });
      }
      return response.json();
    })
    .then(() => {
      showToast("Estoque atualizado com sucesso!", "success");
      document.getElementById("form-incrementar-estoque").reset();
      fecharModal(document.getElementById("modal-incrementar-estoque"));
      carregarProdutos();
    })
    .catch((error) => {
      console.error("Erro ao atualizar estoque:", error);
      showToast(`Erro ao atualizar estoque: ${error.message}`, "error");
      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    });
}

// Parseia o XML da NF-e no lado do cliente para montar o preview de confirmação
function parsearXmlNfeClientSide(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const getText = (el, tag) => {
    if (!el) return null;
    const node = el.getElementsByTagName(tag)[0];
    return node ? node.textContent.trim() : null;
  };

  const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];
  if (!infNFe)
    throw new Error("XML inválido: estrutura infNFe não encontrada.");

  const ide = infNFe.getElementsByTagName("ide")[0];
  const emit = infNFe.getElementsByTagName("emit")[0];
  const dets = infNFe.getElementsByTagName("det");

  const numeroNf = getText(ide, "nNF") || "—";
  const dhEmi = getText(ide, "dhEmi");
  const cnpjEmitente = getText(emit, "CNPJ") || getText(emit, "CPF") || "—";
  const nomeEmitente = getText(emit, "xNome") || "—";

  const itens = [];
  let valorTotal = 0;
  for (const det of dets) {
    const prod = det.getElementsByTagName("prod")[0];
    const nome = getText(prod, "xProd") || "Produto";
    const ean = getText(prod, "cEAN") || "—";
    const qtd = parseFloat(getText(prod, "qCom") || "0");
    const vUnit = parseFloat(getText(prod, "vUnCom") || "0");
    const vProd = parseFloat(
      getText(prod, "vProd") || (qtd * vUnit).toFixed(2),
    );
    valorTotal += vProd;
    itens.push({ nome, ean, qtd, vUnit, vProd });
  }

  return {
    numeroNf,
    dhEmi: dhEmi ? new Date(dhEmi) : null,
    cnpjEmitente,
    nomeEmitente,
    itens,
    valorTotal,
  };
}

// Exibe o modal de confirmação com os dados da NF-e antes de dar entrada
function mostrarConfirmacaoNFe(dadosNfe, formData, token) {
  const modalExistente = document.getElementById("modal-confirmacao-nfe");
  if (modalExistente) modalExistente.remove();

  const fmt = (v) =>
    parseFloat(v).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtCnpj = (cnpj) => {
    const s = (cnpj || "").replace(/\D/g, "");
    return s.length === 14
      ? s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : cnpj || "—";
  };
  const fmtData = (d) =>
    d instanceof Date && !isNaN(d)
      ? d.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const linhasItens = dadosNfe.itens
    .map(
      (item, i) => `
    <tr class="nfe-confirm-row${i % 2 === 1 ? " nfe-confirm-row-alt" : ""}">
      <td class="nfe-confirm-td nfe-confirm-nome">${item.nome}</td>
      <td class="nfe-confirm-td nfe-confirm-ean">${item.ean}</td>
      <td class="nfe-confirm-td nfe-confirm-right">${item.qtd}</td>
      <td class="nfe-confirm-td nfe-confirm-right">R$\u00a0${fmt(item.vUnit)}</td>
      <td class="nfe-confirm-td nfe-confirm-right nfe-confirm-bold">R$\u00a0${fmt(item.vProd)}</td>
    </tr>`,
    )
    .join("");

  const modal = document.createElement("div");
  modal.id = "modal-confirmacao-nfe";
  modal.className = "modal-resultado-nfe";
  modal.innerHTML = `
    <div class="modal-resultado-nfe-content" style="max-width:700px">
      <div class="modal-resultado-nfe-header">
        <h2>
          <i class="fa-solid fa-file-invoice" style="color:#1b5c50"></i>
          Confirmar Entrada da NF-e
        </h2>
        <button class="modal-resultado-nfe-fechar" id="fechar-confirmacao-nfe" aria-label="Fechar modal">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-resultado-nfe-body">
        <div class="nfe-confirm-grid">
          <div class="nfe-confirm-info-item">
            <span>NF-e N\u00ba</span>
            <strong>${dadosNfe.numeroNf}</strong>
          </div>
          <div class="nfe-confirm-info-item">
            <span>Fornecedor (Emitente)</span>
            <strong>${dadosNfe.nomeEmitente}</strong>
          </div>
          <div class="nfe-confirm-info-item">
            <span>CNPJ Emitente</span>
            <strong>${fmtCnpj(dadosNfe.cnpjEmitente)}</strong>
          </div>
          <div class="nfe-confirm-info-item">
            <span>Data de Emiss\u00e3o</span>
            <strong>${fmtData(dadosNfe.dhEmi)}</strong>
          </div>
          <div class="nfe-confirm-info-item">
            <span>Total de Itens</span>
            <strong>${dadosNfe.itens.length} produto(s)</strong>
          </div>
          <div class="nfe-confirm-info-item">
            <span>Valor Total da Nota</span>
            <strong style="color:#1b5c50">R$\u00a0${fmt(dadosNfe.valorTotal)}</strong>
          </div>
        </div>

        <div class="nfe-secao" style="margin-top:1.25rem">
          <h4 class="nfe-secao-titulo" style="background:#f1f5f9;color:#334155">
            <i class="fa-solid fa-list-ul"></i> Produtos na Nota (${dadosNfe.itens.length})
          </h4>
          <div style="overflow-x:auto">
            <table class="nfe-confirm-tabela">
              <thead>
                <tr>
                  <th class="nfe-confirm-th">Produto</th>
                  <th class="nfe-confirm-th">EAN / C\u00f3digo</th>
                  <th class="nfe-confirm-th nfe-confirm-right">Qtd</th>
                  <th class="nfe-confirm-th nfe-confirm-right">Vl. Unit.</th>
                  <th class="nfe-confirm-th nfe-confirm-right">Total Item</th>
                </tr>
              </thead>
              <tbody>${linhasItens}</tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="nfe-confirm-td nfe-confirm-total-label">Total Geral</td>
                  <td class="nfe-confirm-td nfe-confirm-right nfe-confirm-total-valor">R$\u00a0${fmt(dadosNfe.valorTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p class="nfe-confirm-aviso">
          <i class="fa-solid fa-circle-info"></i>
          Ao confirmar, os estoques dos produtos j\u00e1 cadastrados ser\u00e3o atualizados automaticamente.
          Produtos n\u00e3o cadastrados ser\u00e3o salvos como pendentes.
        </p>
      </div>
      <div class="modal-resultado-nfe-footer">
        <button class="btn-nfe-pendentes" id="cancelar-confirmacao-nfe">
          <i class="fa-solid fa-arrow-left"></i> Cancelar
        </button>
        <button class="btn-nfe-fechar" id="confirmar-entrada-nfe">
          <i class="fa-solid fa-check"></i> Confirmar Entrada
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modal.classList.add("show"));

  const fecharConfirmacao = () => {
    document.body.style.overflow = "";
    modal.classList.remove("show");
    setTimeout(() => {
      if (modal.parentNode) modal.remove();
      // Restaura o form para nova tentativa
      const formNfe = document.getElementById("form-importar-nfe");
      if (formNfe) formNfe.reset();
    }, 250);
  };

  document
    .getElementById("fechar-confirmacao-nfe")
    .addEventListener("click", fecharConfirmacao);
  document
    .getElementById("cancelar-confirmacao-nfe")
    .addEventListener("click", fecharConfirmacao);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharConfirmacao();
  });
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      fecharConfirmacao();
      document.removeEventListener("keydown", escHandler);
    }
  });

  // Confirmar → envia ao backend
  document
    .getElementById("confirmar-entrada-nfe")
    .addEventListener("click", () => {
      const btnConfirmar = document.getElementById("confirmar-entrada-nfe");
      btnConfirmar.disabled = true;
      btnConfirmar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processando...`;

      fetch(`${API_URL}/produtos/import-nfe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error("Sessão inválida. Faça login novamente.");
            }
            if (response.status === 409) {
              return response.json().then((err) => {
                throw new Error(
                  err.message || "NF-e já foi importada anteriormente.",
                );
              });
            }
            return response.json().then((err) => {
              throw new Error(err.message || "Erro ao importar NF-e");
            });
          }
          return response.json();
        })
        .then((data) => {
          fecharConfirmacao();
          setTimeout(() => {
            mostrarResultadoNFe(data, () => {
              carregarProdutos();
              carregarProdutosTemporarios();
            });
          }, 50);
        })
        .catch((error) => {
          console.error("Erro ao importar NF-e:", error);
          showToast(`Erro: ${error.message}`, "error");
          if (error.message.includes("Sessão inválida")) {
            window.location.href = "../html/login.html";
          }
          btnConfirmar.disabled = false;
          btnConfirmar.innerHTML = `<i class="fa-solid fa-check"></i> Confirmar Entrada`;
        });
    });
}

// Importa NF-e — lê o XML no cliente, exibe preview e só envia ao confirmar
function importarNFe(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    showToast("Você precisa estar logado.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const arquivo = document.getElementById("arquivo-nfe").files[0];
  if (!arquivo) {
    showToast("Selecione um arquivo XML.", "error");
    return;
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    showToast("Arquivo muito grande. Tamanho máximo: 10MB.", "error");
    return;
  }

  if (!arquivo.name.toLowerCase().endsWith(".xml")) {
    showToast("Apenas arquivos .xml são permitidos.", "error");
    return;
  }

  const btnSubmit = document.querySelector(
    "#form-importar-nfe button[type='submit']",
  );
  const textoOriginal = btnSubmit ? btnSubmit.innerHTML : "Importar";
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lendo...`;
  }

  const formData = new FormData();
  formData.append("nfe", arquivo);

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dadosNfe = parsearXmlNfeClientSide(e.target.result);

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
      }

      // Fechar modal de seleção e abrir modal de confirmação
      fecharModal(document.getElementById("modal-importar-nfe"));
      setTimeout(() => mostrarConfirmacaoNFe(dadosNfe, formData, token), 50);
    } catch (err) {
      showToast(`Erro ao ler XML: ${err.message}`, "error");
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
      }
    }
  };
  reader.onerror = () => {
    showToast("Não foi possível ler o arquivo.", "error");
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = textoOriginal;
    }
  };
  reader.readAsText(arquivo, "UTF-8");
}

// Exibe modal com resultado detalhado da importação da NF-e
function mostrarResultadoNFe(data, onFechar) {
  // Separar resultados de estoque atualizado e pendentes
  const atualizados = (data.resultados || []).filter(
    (r) => typeof r === "object" && r.message,
  );
  const pendentes = (data.resultados || []).filter(
    (r) => typeof r === "string",
  );
  const erros = data.erros || [];

  const totalAtualizados = atualizados.length;
  const totalPendentes = pendentes.length;
  const totalErros = erros.length;
  const totalItens = totalAtualizados + totalPendentes + totalErros;

  // Montar HTML dos cards de resumo
  const resumoHTML = `
    <div class="nfe-resultado-resumo">
      <div class="nfe-card nfe-card-success">
        <i class="fa-solid fa-box"></i>
        <span class="nfe-card-numero">${totalAtualizados}</span>
        <span class="nfe-card-label">Estoque atualizado</span>
      </div>
      <div class="nfe-card nfe-card-warning">
        <i class="fa-solid fa-clock"></i>
        <span class="nfe-card-numero">${totalPendentes}</span>
        <span class="nfe-card-label">Pendentes (não encontrados)</span>
      </div>
      <div class="nfe-card nfe-card-error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span class="nfe-card-numero">${totalErros}</span>
        <span class="nfe-card-label">Erros</span>
      </div>
    </div>
  `;

  // Montar lista de itens atualizados
  const atualizadosHTML =
    totalAtualizados > 0
      ? `
    <div class="nfe-secao">
      <h4 class="nfe-secao-titulo nfe-titulo-success">
        <i class="fa-solid fa-circle-check"></i> Estoque Atualizado (${totalAtualizados})
      </h4>
      <ul class="nfe-lista">
        ${atualizados
          .map(
            (r) => `
          <li class="nfe-item nfe-item-success">
            <span class="nfe-item-nome">${r.nome || "Produto"}</span>
            <span class="nfe-item-detalhe">
              <i class="fa-solid fa-plus"></i> ${r.quantidade} unidade(s) adicionada(s)
            </span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `
      : "";

  // Montar lista de pendentes
  const pendentesHTML =
    totalPendentes > 0
      ? `
    <div class="nfe-secao">
      <h4 class="nfe-secao-titulo nfe-titulo-warning">
        <i class="fa-solid fa-circle-exclamation"></i> Pendentes — produto não cadastrado (${totalPendentes})
      </h4>
      <p class="nfe-secao-info">Esses itens foram salvos na lista de produtos pendentes. Cadastre-os manualmente.</p>
      <ul class="nfe-lista">
        ${pendentes
          .map(
            (msg) => `
          <li class="nfe-item nfe-item-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${msg}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `
      : "";

  // Montar lista de erros
  const errosHTML =
    totalErros > 0
      ? `
    <div class="nfe-secao">
      <h4 class="nfe-secao-titulo nfe-titulo-error">
        <i class="fa-solid fa-circle-xmark"></i> Erros (${totalErros})
      </h4>
      <ul class="nfe-lista">
        ${erros
          .map(
            (e) => `
          <li class="nfe-item nfe-item-error">
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

  // Chave de acesso (se disponível)
  const chaveHTML = data.chave_acesso
    ? `
    <p class="nfe-chave">
      <i class="fa-solid fa-key"></i>
      <strong>Chave de acesso:</strong>
      <code>${data.chave_acesso}</code>
    </p>
  `
    : "";

  // Mensagem geral com ícone baseado no resultado
  const iconeGeral =
    totalErros === 0 && totalPendentes === 0
      ? `<i class="fa-solid fa-circle-check" style="color:#10b981"></i>`
      : totalAtualizados > 0
        ? `<i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b"></i>`
        : `<i class="fa-solid fa-circle-xmark" style="color:#ef4444"></i>`;

  // Criar modal
  const modalExistente = document.getElementById("modal-resultado-nfe");
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement("div");
  modal.id = "modal-resultado-nfe";
  modal.className = "modal-resultado-nfe";
  modal.innerHTML = `
    <div class="modal-resultado-nfe-content">
      <div class="modal-resultado-nfe-header">
        <h2>${iconeGeral} Resultado da Importação</h2>
        <button class="modal-resultado-nfe-fechar" id="fechar-resultado-nfe" aria-label="Fechar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-resultado-nfe-body">
        ${chaveHTML}
        ${resumoHTML}
        <div class="nfe-detalhes">
          ${atualizadosHTML}
          ${pendentesHTML}
          ${errosHTML}
          ${totalItens === 0 ? '<p class="nfe-vazio">Nenhum item foi processado.</p>' : ""}
        </div>
      </div>
      <div class="modal-resultado-nfe-footer">
        ${
          totalPendentes > 0
            ? `<button class="btn-nfe-pendentes" onclick="document.getElementById('modal-resultado-nfe').remove(); window.location.href='./adminCadastrarProdutos.html'">
              <i class="fa-solid fa-list"></i> Ver Produtos Pendentes
            </button>`
            : ""
        }
        <button class="btn-nfe-fechar" id="btn-fechar-resultado-nfe">
          <i class="fa-solid fa-check"></i> Entendido
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Bloqueia scroll do body enquanto modal está aberto
  document.body.style.overflow = "hidden";

  // Eventos de fechar — chama callback após fechar para recarregar produtos
  const fechar = () => {
    document.body.style.overflow = "";
    modal.classList.remove("show");
    // Aguarda a animação de saída antes de remover do DOM
    setTimeout(() => {
      if (modal.parentNode) modal.remove();
      if (typeof onFechar === "function") onFechar();
    }, 250);
  };

  document
    .getElementById("fechar-resultado-nfe")
    .addEventListener("click", fechar);
  document
    .getElementById("btn-fechar-resultado-nfe")
    .addEventListener("click", fechar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });

  const escListener = (e) => {
    if (e.key === "Escape") {
      fechar();
      document.removeEventListener("keydown", escListener);
    }
  };
  document.addEventListener("keydown", escListener);

  // Animação de entrada com requestAnimationFrame para garantir render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
  });
}

// Fecha um modal na interface
function fecharModal(modal, remove = false) {
  if (modal) {
    if (remove) {
      modal.parentNode.removeChild(modal);
    } else {
      modal.style.display = "none";
    }
  }
}

// =============================================
// FUNÇÕES PARA GERENCIAMENTO DE HORÁRIOS PROFISSIONAL
// =============================================

function atualizarHorarios(event) {
  event.preventDefault();
  const token = getToken();

  if (!token) {
    showToast("Você precisa estar logado como administrador.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const horarioAbertura = document.getElementById("horario-abertura").value;
  const horarioFechamento = document.getElementById("horario-fechamento").value;
  const btnSalvar = document.querySelector(".btn-salvar");

  // Validação dos campos
  if (!horarioAbertura || !horarioFechamento) {
    showToast("Todos os campos de horário são obrigatórios.", "error");
    marcarCampoErro(!horarioAbertura ? "horario-abertura" : null);
    marcarCampoErro(!horarioFechamento ? "horario-fechamento" : null);
    return;
  }

  // Converter horários para minutos para comparação
  const [horaAbertura, minutoAbertura] = horarioAbertura.split(":").map(Number);
  const [horaFechamento, minutoFechamento] = horarioFechamento
    .split(":")
    .map(Number);

  const minutosAbertura = horaAbertura * 60 + minutoAbertura;
  const minutosFechamento = horaFechamento * 60 + minutoFechamento;

  if (minutosAbertura >= minutosFechamento) {
    showToast(
      "O horário de abertura deve ser anterior ao horário de fechamento.",
      "error",
    );
    marcarCampoErro("horario-abertura");
    marcarCampoErro("horario-fechamento");
    return;
  }

  // Adicionar estado de loading
  btnSalvar.classList.add("loading");
  btnSalvar.disabled = true;

  // Limpar estados de erro
  limparEstadosValidacao();

  fetch(`${API_URL}/api/horarios`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      horaAbertura,
      minutoAbertura,
      horaFechamento,
      minutoFechamento,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        return response.json().then((err) => {
          throw new Error(err.message || "Erro ao atualizar horários");
        });
      }
      return response.json();
    })
    .then((data) => {
      // Toast de sucesso mais informativo
      const horarioAberturaFormatado =
        document.getElementById("horario-abertura").value;
      const horarioFechamentoFormatado =
        document.getElementById("horario-fechamento").value;

      showToast(
        `✅ Horários atualizados com sucesso! Funcionamento: ${horarioAberturaFormatado} às ${horarioFechamentoFormatado}`,
        "success",
      );

      // Marcar campos como sucesso antes de fechar
      marcarCampoSucesso("horario-abertura");
      marcarCampoSucesso("horario-fechamento");

      // Aguardar um pouco para mostrar o feedback visual
      setTimeout(() => {
        fecharModalHorarios();
        limparEstadosValidacao();
      }, 1500);
    })
    .catch((error) => {
      console.error("Erro ao atualizar horários:", error);
      showToast(`Erro ao atualizar horários: ${error.message}`, "error");

      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    })
    .finally(() => {
      // Remover estado de loading
      btnSalvar.classList.remove("loading");
      btnSalvar.disabled = false;
    });
}

function marcarCampoErro(campoId) {
  if (campoId) {
    const campo = document.getElementById(campoId);
    if (campo) {
      campo.classList.remove("success");
      campo.classList.add("error");
    }
  }
}

function marcarCampoSucesso(campoId) {
  const campo = document.getElementById(campoId);
  if (campo) {
    campo.classList.remove("error");
    campo.classList.add("success");
  }
}

function limparEstadosValidacao() {
  const campos = ["horario-abertura", "horario-fechamento"];
  campos.forEach((campoId) => {
    const campo = document.getElementById(campoId);
    if (campo) {
      campo.classList.remove("error", "success");
    }
  });
}

function atualizarPreviewHorario() {
  const horarioAbertura = document.getElementById("horario-abertura").value;
  const horarioFechamento = document.getElementById("horario-fechamento").value;
  const previewContent = document.getElementById("preview-horario");

  if (horarioAbertura && horarioFechamento) {
    // Validar se horário de abertura é anterior ao fechamento
    const [horaAbertura, minutoAbertura] = horarioAbertura
      .split(":")
      .map(Number);
    const [horaFechamento, minutoFechamento] = horarioFechamento
      .split(":")
      .map(Number);

    const minutosAbertura = horaAbertura * 60 + minutoAbertura;
    const minutosFechamento = horaFechamento * 60 + minutoFechamento;

    if (minutosAbertura >= minutosFechamento) {
      previewContent.innerHTML = `
        <span class="preview-text" style="color: #ef4444;">
          ⚠️ Horário de abertura deve ser anterior ao fechamento
        </span>
      `;
      return;
    }

    // Calcular duração
    const duracaoMinutos = minutosFechamento - minutosAbertura;
    const duracaoHoras = Math.floor(duracaoMinutos / 60);
    const duracaoMinutosResto = duracaoMinutos % 60;

    let texturaDuracao = `${duracaoHoras}h`;
    if (duracaoMinutosResto > 0) {
      texturaDuracao += ` ${duracaoMinutosResto}min`;
    }

    previewContent.innerHTML = `
      <div class="preview-horario-ativo">
        <div class="preview-horario-item">
          <i class="fa-solid fa-door-open"></i>
          Abertura: ${horarioAbertura}
        </div>
        <span class="preview-separador">→</span>
        <div class="preview-horario-item">
          <i class="fa-solid fa-door-closed"></i>
          Fechamento: ${horarioFechamento}
        </div>
      </div>
      <div style="margin-top: 1rem; text-align: center; color: #64748b; font-size: 0.95rem;">
        ⏱️ Funcionamento: ${texturaDuracao} por dia
      </div>
    `;
  } else {
    previewContent.innerHTML = `
      <span class="preview-text">Selecione os horários para visualizar</span>
    `;
  }
}

function abrirModalHorarios() {
  const modal = document.getElementById("modal-alterar-horarios");
  if (modal) {
    modal.style.display = "flex";

    // Configurar listeners para preview em tempo real
    const horarioAbertura = document.getElementById("horario-abertura");
    const horarioFechamento = document.getElementById("horario-fechamento");

    if (horarioAbertura && horarioFechamento) {
      horarioAbertura.addEventListener("input", atualizarPreviewHorario);
      horarioFechamento.addEventListener("input", atualizarPreviewHorario);

      // Carregar horários atuais se existirem
      carregarHorariosAtuais();
    }
  }
}

function fecharModalHorarios() {
  const modal = document.getElementById("modal-alterar-horarios");
  if (modal) {
    modal.style.display = "none";

    // Limpar formulário e estados
    const form = document.getElementById("form-alterar-horarios");
    if (form) {
      form.reset();
    }

    limparEstadosValidacao();

    // Resetar preview
    const previewContent = document.getElementById("preview-horario");
    if (previewContent) {
      previewContent.innerHTML = `<span class="preview-text">Selecione os horários para visualizar</span>`;
    }
  }
}

async function carregarHorariosAtuais() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/horarios`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.horarios) {
        const {
          horaAbertura,
          minutoAbertura,
          horaFechamento,
          minutoFechamento,
        } = data.horarios;

        // Formatar para input type="time"
        const horarioAberturaFormatado = `${horaAbertura
          .toString()
          .padStart(2, "0")}:${minutoAbertura.toString().padStart(2, "0")}`;
        const horarioFechamentoFormatado = `${horaFechamento
          .toString()
          .padStart(2, "0")}:${minutoFechamento.toString().padStart(2, "0")}`;

        document.getElementById("horario-abertura").value =
          horarioAberturaFormatado;
        document.getElementById("horario-fechamento").value =
          horarioFechamentoFormatado;

        // Atualizar preview
        atualizarPreviewHorario();
      }
    }
  } catch (error) {
    console.error("Erro ao carregar horários atuais:", error);
  }
}

// Configura eventos para as páginas de administração
document.addEventListener("DOMContentLoaded", () => {
  const isAlterarProdutosPage = window.location.pathname.includes(
    "adminAlterarProdutos.html",
  );
  const isCadastrarProdutosPage = window.location.pathname.includes(
    "adminCadastrarProdutos.html",
  );

  if (isAlterarProdutosPage) {
    carregarProdutos();

    const buscaProduto = document.getElementById("busca-produto");
    if (buscaProduto) {
      buscaProduto.addEventListener("input", () => filtrarProdutos());
    } else {
      console.warn(
        "Elemento busca-produto não encontrado (esperado em adminAlterarProdutos.html)",
      );
    }

    const filtroCategoria = document.getElementById("filtro-categoria");
    if (filtroCategoria) {
      filtroCategoria.addEventListener("change", () => filtrarProdutos());
    } else {
      console.warn(
        "Elemento filtro-categoria não encontrado (esperado em adminAlterarProdutos.html)",
      );
    }

    const filtroStatus = document.getElementById("filtro-status-produto");
    if (filtroStatus) {
      filtroStatus.addEventListener("change", () => filtrarProdutos());
    } else {
      console.warn(
        "Elemento filtro-status-produto não encontrado (esperado em adminAlterarProdutos.html)",
      );
    }

    const botaoAbrirIncrementar = document.getElementById(
      "abrir-incrementar-estoque",
    );
    if (botaoAbrirIncrementar) {
      botaoAbrirIncrementar.addEventListener("click", () => {
        const modal = document.getElementById("modal-incrementar-estoque");
        if (modal) {
          modal.style.display = "flex";
        }
      });
    }

    const botaoAbrirImportar = document.getElementById("abrir-importar-nfe");
    if (botaoAbrirImportar) {
      botaoAbrirImportar.addEventListener("click", () => {
        const modal = document.getElementById("modal-importar-nfe");
        if (modal) {
          modal.style.display = "flex";
        }
      });
    }

    const formIncrementar = document.getElementById("form-incrementar-estoque");
    if (formIncrementar) {
      formIncrementar.addEventListener("submit", incrementarEstoque);
    }

    const formImportarNFe = document.getElementById("form-importar-nfe");
    if (formImportarNFe) {
      formImportarNFe.addEventListener("submit", importarNFe);
    }

    const botaoCancelarIncrementar = document.getElementById(
      "cancelar-incrementar",
    );
    if (botaoCancelarIncrementar) {
      botaoCancelarIncrementar.addEventListener("click", () => {
        fecharModal(document.getElementById("modal-incrementar-estoque"));
      });
    }

    const botaoCancelarImportar = document.getElementById(
      "cancelar-importar-nfe",
    );
    if (botaoCancelarImportar) {
      botaoCancelarImportar.addEventListener("click", () => {
        fecharModal(document.getElementById("modal-importar-nfe"));
      });
    }
  }

  // Configurar modal de horários
  const botaoAbrirHorarios = document.getElementById("alterar-horarios");
  if (botaoAbrirHorarios) {
    botaoAbrirHorarios.addEventListener("click", abrirModalHorarios);
  }

  const formAlterarHorarios = document.getElementById("form-alterar-horarios");
  if (formAlterarHorarios) {
    formAlterarHorarios.addEventListener("submit", atualizarHorarios);
  }

  const botaoCancelarHorarios = document.getElementById(
    "cancelar-alterar-horarios",
  );
  if (botaoCancelarHorarios) {
    botaoCancelarHorarios.addEventListener("click", fecharModalHorarios);
  }

  const botaoFecharModalHorarios = document.getElementById(
    "fechar-modal-horarios",
  );
  if (botaoFecharModalHorarios) {
    botaoFecharModalHorarios.addEventListener("click", fecharModalHorarios);
  }

  // Fechar modal ao clicar fora dele
  const modalHorarios = document.getElementById("modal-alterar-horarios");
  if (modalHorarios) {
    modalHorarios.addEventListener("click", (e) => {
      if (e.target === modalHorarios) {
        fecharModalHorarios();
      }
    });

    // Adicionar suporte para teclas de atalho
    document.addEventListener("keydown", (e) => {
      const modalVisivel = modalHorarios.style.display === "flex";

      if (modalVisivel) {
        switch (e.key) {
          case "Escape":
            e.preventDefault();
            fecharModalHorarios();
            break;
          case "Enter":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const form = document.getElementById("form-alterar-horarios");
              if (form) {
                form.requestSubmit();
              }
            }
            break;
        }
      }
    });
  }

  // =============================================
  // CONFIGURAÇÃO DO MODAL DE FECHAMENTO DO ESTABELECIMENTO
  // =============================================

  const botaoFecharEstabelecimento = document.getElementById(
    "fechar-estabelecimento",
  );
  if (botaoFecharEstabelecimento) {
    botaoFecharEstabelecimento.addEventListener("click", abrirModalFechamento);
  }

  const formFechamento = document.getElementById("form-fechar-estabelecimento");
  if (formFechamento) {
    formFechamento.addEventListener("submit", alterarStatusEstabelecimento);
  }

  const botaoCancelarFechamento = document.getElementById(
    "cancelar-fechamento",
  );
  if (botaoCancelarFechamento) {
    botaoCancelarFechamento.addEventListener("click", fecharModalFechamento);
  }

  const botaoFecharModalFechamento = document.getElementById(
    "fechar-modal-fechamento",
  );
  if (botaoFecharModalFechamento) {
    botaoFecharModalFechamento.addEventListener("click", fecharModalFechamento);
  }

  // Toggle de fechamento
  const toggleFechamento = document.getElementById("toggle-fechamento");
  if (toggleFechamento) {
    toggleFechamento.addEventListener("change", toggleMotivoFechamento);
  }

  // Textarea do motivo
  const motivoTextarea = document.getElementById("motivo-fechamento");
  if (motivoTextarea) {
    motivoTextarea.addEventListener("input", atualizarContadorCaracteres);
  }

  // Botões de sugestão
  const sugestoesBtns = document.querySelectorAll(".sugestao-btn");
  sugestoesBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const motivo = btn.dataset.motivo;
      if (motivoTextarea) {
        motivoTextarea.value = motivo;
        atualizarContadorCaracteres();
      }
    });
  });

  // Fechar modal ao clicar fora dele
  const modalFechamento = document.getElementById(
    "modal-fechar-estabelecimento",
  );
  if (modalFechamento) {
    modalFechamento.addEventListener("click", (e) => {
      if (e.target === modalFechamento) {
        fecharModalFechamento();
      }
    });

    // Suporte para teclas de atalho
    document.addEventListener("keydown", (e) => {
      const modalVisivel = modalFechamento.style.display === "flex";

      if (modalVisivel) {
        switch (e.key) {
          case "Escape":
            e.preventDefault();
            fecharModalFechamento();
            break;
          case "Enter":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const form = document.getElementById(
                "form-fechar-estabelecimento",
              );
              if (form) {
                form.requestSubmit();
              }
            }
            break;
        }
      }
    });
  }

  if (isCadastrarProdutosPage) {
    const formAdicionar = document.getElementById("form-adicionar-produto");
    if (formAdicionar) {
      formAdicionar.addEventListener("submit", adicionarProduto);
    } else {
      console.warn(
        "Formulário de adicionar produto não encontrado (esperado em adminCadastrarProdutos.html)",
      );
    }
    carregarProdutosTemporarios();

    // Adiciona eventos de clique para botões de exclusão na tabela
    document
      .getElementById("tabela-corpo-produtos-temporarios")
      ?.addEventListener("click", (event) => {
        if (event.target.classList.contains("botao-excluir-temp")) {
          const id = event.target.dataset.id;
          excluirProdutoTemporario(id);
        }
      });
  }
});

// =============================================
// FUNÇÕES PARA GERENCIAMENTO DO FECHAMENTO DO ESTABELECIMENTO
// =============================================

function abrirModalFechamento() {
  const modal = document.getElementById("modal-fechar-estabelecimento");
  if (modal) {
    modal.style.display = "flex";
    carregarStatusAtual();

    // Reset form state
    const toggle = document.getElementById("toggle-fechamento");
    const motivoContainer = document.getElementById("motivo-container");
    const avisoContainer = document.getElementById("aviso-fechamento");

    if (toggle) {
      toggle.checked = false;
    }
    if (motivoContainer) {
      motivoContainer.style.display = "none";
    }
    if (avisoContainer) {
      avisoContainer.style.display = "none";
    }

    atualizarUIToggle();
  }
}

function fecharModalFechamento() {
  const modal = document.getElementById("modal-fechar-estabelecimento");
  if (modal) {
    modal.style.display = "none";

    // Limpar formulário
    const form = document.getElementById("form-fechar-estabelecimento");
    if (form) {
      form.reset();
    }

    // Reset contador
    const charCount = document.getElementById("char-count");
    if (charCount) {
      charCount.textContent = "0";
    }
  }
}

async function carregarStatusAtual() {
  const token = getToken();
  if (!token) return;

  const statusTexto = document.getElementById("status-texto");
  const statusDetalhes = document.getElementById("status-detalhes");
  const statusIcon = document.querySelector(".status-icon i");

  try {
    // Aqui você pode fazer uma chamada para a API para verificar o status atual
    // Por enquanto, vou simular um status aberto
    const response = await fetch(`${API_URL}/api/status-estabelecimento`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (statusTexto) {
        statusTexto.innerHTML = data.aberto
          ? '<strong style="color: #10b981;">Aberto</strong>'
          : '<strong style="color: #ef4444;">Fechado</strong>';
      }

      if (statusDetalhes) {
        statusDetalhes.textContent = data.aberto
          ? "Estabelecimento funcionando normalmente"
          : `Motivo: ${data.motivo || "Não informado"}`;
      }

      if (statusIcon) {
        statusIcon.className = data.aberto
          ? "fa-solid fa-store"
          : "fa-solid fa-store-slash";
        statusIcon.style.color = data.aberto ? "#10b981" : "#ef4444";
      }
    } else {
      throw new Error("Erro ao carregar status");
    }
  } catch (error) {
    console.error("Erro ao carregar status atual:", error);

    // Status padrão caso não consiga carregar
    if (statusTexto) {
      statusTexto.innerHTML = '<strong style="color: #10b981;">Aberto</strong>';
    }
    if (statusDetalhes) {
      statusDetalhes.textContent = "Estabelecimento funcionando normalmente";
    }
    if (statusIcon) {
      statusIcon.className = "fa-solid fa-store";
      statusIcon.style.color = "#10b981";
    }
  }
}

function toggleMotivoFechamento() {
  const toggle = document.getElementById("toggle-fechamento");
  const motivoContainer = document.getElementById("motivo-container");
  const avisoContainer = document.getElementById("aviso-fechamento");

  if (toggle && motivoContainer && avisoContainer) {
    if (toggle.checked) {
      // Fechando estabelecimento
      motivoContainer.style.display = "block";
      avisoContainer.style.display = "block";
    } else {
      // Abrindo estabelecimento
      motivoContainer.style.display = "none";
      avisoContainer.style.display = "none";
    }
  }

  atualizarUIToggle();
}

function atualizarUIToggle() {
  const toggle = document.getElementById("toggle-fechamento");
  const toggleDesc = document.getElementById("toggle-desc");
  const btnConfirmar = document.getElementById("btn-confirmar-fechamento");
  const btnText = document.getElementById("btn-text");

  if (toggle && toggleDesc && btnConfirmar && btnText) {
    if (toggle.checked) {
      // Modo fechamento
      toggleDesc.textContent = "Fechar estabelecimento temporariamente";
      btnConfirmar.classList.remove("abrir");
      btnText.textContent = "Fechar Estabelecimento";
    } else {
      // Modo abertura
      toggleDesc.textContent = "Manter estabelecimento aberto";
      btnConfirmar.classList.add("abrir");
      btnText.textContent = "Manter Aberto";
    }
  }
}

function atualizarContadorCaracteres() {
  const textarea = document.getElementById("motivo-fechamento");
  const charCount = document.getElementById("char-count");

  if (textarea && charCount) {
    const length = textarea.value.length;
    charCount.textContent = length;

    // Mudar cor baseado no limite
    if (length > 450) {
      charCount.style.color = "#ef4444";
    } else if (length > 400) {
      charCount.style.color = "#f59e0b";
    } else {
      charCount.style.color = "#9ca3af";
    }
  }
}

function alterarStatusEstabelecimento(event) {
  event.preventDefault();
  const token = getToken();

  if (!token) {
    showToast("Você precisa estar logado como administrador.", "error");
    window.location.href = "../html/login.html";
    return;
  }

  const toggle = document.getElementById("toggle-fechamento");
  const motivo = document.getElementById("motivo-fechamento").value.trim();
  const btnConfirmar = document.getElementById("btn-confirmar-fechamento");

  const fechando = toggle.checked;

  // Validação
  if (fechando && !motivo) {
    showToast("O motivo do fechamento é obrigatório.", "error");
    document.getElementById("motivo-fechamento").focus();
    return;
  }

  // Loading state
  btnConfirmar.classList.add("loading");
  btnConfirmar.disabled = true;

  const requestData = {
    aberto: !fechando,
    motivo: fechando ? motivo : null,
  };

  fetch(`${API_URL}/api/status-estabelecimento`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        return response.json().then((err) => {
          throw new Error(
            err.message || "Erro ao alterar status do estabelecimento",
          );
        });
      }
      return response.json();
    })
    .then((data) => {
      const status = fechando ? "fechado" : "aberto";
      const emoji = fechando ? "🔒" : "🔓";

      showToast(
        `${emoji} Estabelecimento ${status} com sucesso!${
          fechando && motivo ? ` Motivo: ${motivo}` : ""
        }`,
        "success",
      );

      setTimeout(() => {
        fecharModalFechamento();
      }, 1500);
    })
    .catch((error) => {
      console.error("Erro ao alterar status do estabelecimento:", error);
      showToast(`Erro ao alterar status: ${error.message}`, "error");

      if (error.message.includes("Sessão inválida")) {
        window.location.href = "../html/login.html";
      }
    })
    .finally(() => {
      // Remover loading state
      btnConfirmar.classList.remove("loading");
      btnConfirmar.disabled = false;
    });
}
