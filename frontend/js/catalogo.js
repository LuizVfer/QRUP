const API_URL = "http://localhost:3000";
var carrinhoVisivel = false;
let produtos = [];
let currentPage = 1;
let produtosCarregados = false;
let statusLojaCarregado = false;
let lojaAberta = false;

// Sistema de Sugestões de Compra
const SUGESTOES_PRODUTOS = {
  cerveja: ["gelo", "petisco", "amendoim", "batata"],
  refrigerante: ["gelo", "petisco", "salgadinho"],
  água: ["gelo"],
  suco: ["gelo", "biscoito"],
  energético: ["gelo", "barra de cereal"],
  bebidas: ["gelo", "petisco", "amendoim", "salgadinho", "batata"],
  alimentos: ["refrigerante", "água", "suco"],
  outros: ["refrigerante", "água"],
};

function getSuggestionForProduct(produto) {
  const titulo = produto.titulo.toLowerCase();
  const categoria = produto.categoria.toLowerCase();

  for (const [keyword, suggestions] of Object.entries(SUGESTOES_PRODUTOS)) {
    if (titulo.includes(keyword) && keyword !== categoria) {
      const produtosSugeridos = produtos.filter((p) => {
        const tituloSugerido = p.titulo.toLowerCase();
        return (
          suggestions.some((sugestao) => tituloSugerido.includes(sugestao)) &&
          p.produto_id !== produto.produto_id &&
          p.quantidade_estoque > 0 &&
          !verificarItemNoCarrinho(p.produto_id)
        );
      });

      if (produtosSugeridos.length > 0) {
        return produtosSugeridos[0];
      }
    }
  }

  if (SUGESTOES_PRODUTOS[categoria]) {
    const suggestions = SUGESTOES_PRODUTOS[categoria];
    const produtosSugeridos = produtos.filter((p) => {
      const tituloSugerido = p.titulo.toLowerCase();
      return (
        suggestions.some((sugestao) => tituloSugerido.includes(sugestao)) &&
        p.produto_id !== produto.produto_id &&
        p.quantidade_estoque > 0 &&
        !verificarItemNoCarrinho(p.produto_id)
      );
    });

    if (produtosSugeridos.length > 0) {
      return produtosSugeridos[0];
    }
  }

  return null;
}

function showSuggestionPopup(produtoOriginal, produtoSugerido) {
  const existingPopup = document.querySelector(".suggestion-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement("div");
  popup.classList.add("suggestion-popup");

  const precoFormatado = parseFloat(produtoSugerido.preco)
    .toFixed(2)
    .replace(".", ",");

  popup.innerHTML = `
    <div class="suggestion-content">
      <div class="suggestion-header">
        <h3>🎯 Que tal complementar sua compra?</h3>
        <button class="suggestion-close" aria-label="Fechar sugestão">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="suggestion-body">
        <div class="suggestion-product">
          <img src="/Uploads/${produtoSugerido.imagem}" alt="${produtoSugerido.titulo}" class="suggestion-image">
          <div class="suggestion-details">
            <h4 class="suggestion-title">${produtoSugerido.titulo}</h4>
            <p class="suggestion-price">R$ ${precoFormatado}</p>
            <p class="suggestion-stock">Estoque: ${produtoSugerido.quantidade_estoque}</p>
          </div>
        </div>
        <div class="suggestion-message">
          <p>Já que você adicionou <strong>${produtoOriginal.titulo}</strong>, que tal levar também <strong>${produtoSugerido.titulo}</strong>?</p>
        </div>
      </div>
      <div class="suggestion-actions">
        <button class="btn-add-suggestion" data-produto-id="${produtoSugerido.produto_id}">
          <i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho
        </button>
        <button class="btn-decline-suggestion">
          Não, obrigado
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add("show");
  }, 10);

  const closeBtn = popup.querySelector(".suggestion-close");
  const addBtn = popup.querySelector(".btn-add-suggestion");
  const declineBtn = popup.querySelector(".btn-decline-suggestion");

  const closePopup = () => {
    popup.classList.remove("show");
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 300);
  };

  closeBtn.addEventListener("click", closePopup);
  declineBtn.addEventListener("click", closePopup);

  addBtn.addEventListener("click", () => {
    const produtoId = addBtn.getAttribute("data-produto-id");
    const produto = produtos.find((p) => p.produto_id == produtoId);

    if (
      produto &&
      produto.quantidade_estoque > 0 &&
      !verificarItemNoCarrinho(produto.produto_id)
    ) {
      adicionarItemAoCarrinho(
        produto.titulo,
        produto.preco,
        produto.imagem,
        produto.produto_id,
        produto.quantidade_estoque
      );
      atualizarBadgeCarrinho();
      showToast(`${produto.titulo} adicionado ao carrinho!`, "success");
      closePopup();
    } else {
      showToast("Produto não disponível ou já está no carrinho.", "error");
      closePopup();
    }
  });

  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });

  setTimeout(() => {
    if (popup.parentNode) {
      closePopup();
    }
  }, 10000);
}

function getProductsPerPage() {
  return window.innerWidth > 850 ? 12 : 8;
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL - CORRIGIDA
// ============================================
document.addEventListener("DOMContentLoaded", ready);

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = "error") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.error("Container de toast não encontrado.");
    return;
  }
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function mostrarCarregamento() {
  const containerItens = document.getElementById("container-itens");
  if (containerItens) {
    containerItens.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; color: #2c3e50; margin-bottom: 20px;"></i>
        <p style="font-size: 18px; color: #34495e; font-weight: 500;">Carregando produtos...</p>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 10px;">Por favor, aguarde</p>
      </div>
    `;
  }
}

function atualizarStatusLoja() {
  return fetch(`${API_URL}/api/status-loja`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ao obter status da loja: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      statusLojaCarregado = true;
      lojaAberta = data.aberto;
      
      const statusElement = document.getElementById("status");
      const horarioElement = document.getElementById("horario");

      if (horarioElement) {
        horarioElement.textContent = `Horário de Funcionamento: ${data.horario.abertura} - ${data.horario.fechamento}`;
      }

      if (statusElement) {
        statusElement.textContent = data.aberto ? "Aberto" : "Fechado";
        statusElement.style.color = data.aberto ? "#00ff00" : "#ff0000";
      }

      controlarInteracoesCarrinho(data.aberto);
      return data;
    })
    .catch((error) => {
      console.error("Erro ao obter status da loja:", error);
      statusLojaCarregado = true;
      lojaAberta = false;
      
      const statusElement = document.getElementById("status");
      const horarioElement = document.getElementById("horario");

      if (statusElement) {
        statusElement.textContent = "Erro ao verificar";
        statusElement.style.color = "#ff0000";
      }

      if (horarioElement) {
        horarioElement.textContent = "Horário: Indisponível";
      }

      controlarInteracoesCarrinho(false);
      return { aberto: false, horario: { abertura: "N/A", fechamento: "N/A" } };
    });
}

function controlarInteracoesCarrinho(estaAberto) {
  const botoesCarrinho = document.querySelectorAll(".botao-item");
  const btnPagar = document.querySelector(".btn-pagar");
  const mensagemCarrinho = document.getElementById("mensagem-carrinho");

  if (!estaAberto) {
    botoesCarrinho.forEach((botao) => {
      botao.disabled = true;
      botao.style.opacity = "0.5";
      botao.style.cursor = "not-allowed";
    });
    if (btnPagar) {
      btnPagar.disabled = true;
      btnPagar.style.opacity = "0.5";
      btnPagar.style.cursor = "not-allowed";
    }
    if (!mensagemCarrinho) {
      const containerItens = document.querySelector(".container");
      if (containerItens) {
        const mensagem = document.createElement("p");
        mensagem.id = "mensagem-carrinho";
        mensagem.textContent =
          "A loja está fechada. Não é possível adicionar itens ao carrinho ou finalizar pedidos.";
        mensagem.style.color = "#ff0000";
        mensagem.style.fontWeight = "bold";
        mensagem.style.textAlign = "center";
        mensagem.style.padding = "1rem";
        mensagem.style.marginTop = "1rem";
        containerItens.insertBefore(mensagem, containerItens.firstChild);
      }
    }
  } else {
    botoesCarrinho.forEach((botao) => {
      if (!botao.hasAttribute('data-disabled-by-stock')) {
        botao.disabled = false;
        botao.style.opacity = "1";
        botao.style.cursor = "pointer";
      }
    });
    if (btnPagar) {
      btnPagar.disabled = false;
      btnPagar.style.opacity = "1";
      btnPagar.style.cursor = "pointer";
    }
    if (mensagemCarrinho) {
      mensagemCarrinho.remove();
    }
  }
}

function ready() {
  console.log("🚀 Página carregada - Iniciando setup");

  // Setup inicial da interface
  setupMenu();
  setupMobileCart();
  displayUserGreeting();
  verificarAdmin();

  // Configurar botão de pagar
  const btnPagar = document.querySelector(".btn-pagar");
  if (btnPagar) {
    btnPagar.addEventListener("click", pagarClicked);
  }

  // Configurar busca e filtros
  const buscaInput = document.getElementById("busca-produto");
  const filtroSelect = document.getElementById("filtro-categoria");
  const btnBuscar = document.getElementById("btn-buscar");

  if (buscaInput && filtroSelect && btnBuscar) {
    btnBuscar.addEventListener("click", filtrarProdutos);
    buscaInput.addEventListener("input", debounce(filtrarProdutos, 300));
    filtroSelect.addEventListener("change", filtrarProdutos);
  }

  // Mostrar indicador de carregamento
  mostrarCarregamento();

  // ============================================
  // SEQUÊNCIA DE CARREGAMENTO CORRIGIDA
  // ============================================
  console.log("📦 Iniciando carregamento sequencial...");
  
  // 1. Primeiro, carregar os produtos
  carregarProdutos()
    .then(() => {
      console.log("✅ Produtos carregados com sucesso");
      // 2. Depois, carregar o status da loja
      return atualizarStatusLoja();
    })
    .then(() => {
      console.log("✅ Status da loja carregado com sucesso");
      // 3. Por último, restaurar o carrinho
      carregarCarrinhoDoLocalStorage();
      console.log("✅ Carrinho restaurado");
    })
    .catch(error => {
      console.error("❌ Erro no carregamento:", error);
      mostrarErroCarregamento();
    });

  // Atualizar status a cada minuto
  setInterval(atualizarStatusLoja, 60000);

  // Listener para redimensionamento
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (produtosCarregados && produtos.length > 0) {
        currentPage = 1;
        renderizarProdutos(produtos);
        setupPagination();
      }
    }, 250);
  });
}

function mostrarErroCarregamento() {
  const containerItens = document.getElementById("container-itens");
  if (containerItens) {
    containerItens.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1;">
        <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
        <p style="color: #e74c3c; font-size: 18px; font-weight: 500; margin-bottom: 20px;">Erro ao carregar produtos</p>
        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 30px;">Não foi possível conectar ao servidor. Verifique sua conexão.</p>
        <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 500;">
          <i class="fa-solid fa-refresh"></i> Tentar Novamente
        </button>
      </div>
    `;
  }
}

function setupMobileCart() {
  const mobileCartToggle = document.getElementById("mobile-cart-toggle");
  const carrinho = document.querySelector(".carrinho");
  
  if (!mobileCartToggle || !carrinho) {
    console.warn("Botão de carrinho móvel ou carrinho não encontrado.");
    return;
  }

  let overlay = document.querySelector(".carrinho-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.classList.add("carrinho-overlay");
    document.body.appendChild(overlay);
  }

  mobileCartToggle.addEventListener("click", () => {
    carrinho.classList.add("active");
    overlay.classList.add("active");
    carrinhoVisivel = true;
  });

  overlay.addEventListener("click", () => {
    carrinho.classList.remove("active");
    overlay.classList.remove("active");
    carrinhoVisivel = false;
  });

  const headerCarrinho = carrinho.querySelector(".header-carrinho");
  if (headerCarrinho && !headerCarrinho.querySelector(".close-cart")) {
    const closeButton = document.createElement("button");
    closeButton.classList.add("close-cart");
    closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
    headerCarrinho.appendChild(closeButton);
    closeButton.addEventListener("click", () => {
      carrinho.classList.remove("active");
      overlay.classList.remove("active");
      carrinhoVisivel = false;
    });
  }

  atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;
  const carrinhoItens = document.querySelectorAll(".carrinho-item");
  const totalItens = Array.from(carrinhoItens).reduce((sum, item) => {
    const input = item.querySelector(".carrinho-item-quantidade");
    return sum + (input ? parseInt(input.value) || 0 : 0);
  }, 0);
  badge.textContent = totalItens;
}

function setupMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuLinks = sidebar ? sidebar.querySelectorAll("a[data-section]") : [];

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      
      if (section === "catalogo") {
        window.location.href = "./catalogo.html";
      } else if (section === "perfil") {
        window.location.href = "./perfil.html";
      } else if (section === "pedidos") {
        window.location.href = "./pedidos.html";
      } else if (section === "logout") {
        localStorage.clear();
        window.location.href = "./login.html";
      } else if (section === "admin") {
        window.location.href = "./adminPerfil.html";
      }
      
      if (sidebar && overlay) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      }
    });
  });
}

function verificarAdmin() {
  const token = localStorage.getItem("token");
  if (!token) return;
  
  fetch(`${API_URL}/api/verificar-admin`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erro na verificação");
      return response.json();
    })
    .then((data) => {
      if (data.role === "admin") {
        const adminLink = document.getElementById("admin-link");
        if (adminLink) {
          adminLink.style.display = "block";
        }
      }
    })
    .catch((error) => {
      console.error("Erro ao verificar admin:", error);
    });
}

function displayUserGreeting() {
  const username = localStorage.getItem("username");
  const greetingElement = document.getElementById("userGreeting");
  if (greetingElement) {
    greetingElement.textContent = username ? `Olá, ${username}` : "Olá, Visitante";
  }
}

function getUserId() {
  return localStorage.getItem("user_id");
}

function carregarProdutos() {
  console.log("📡 Requisitando produtos do servidor...");
  
  return fetch(`${API_URL}/produtos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-cache' // Evitar cache
  })
    .then((response) => {
      console.log("📨 Resposta recebida:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("✅ Dados recebidos:", data.length, "produtos");
      
      if (!Array.isArray(data)) {
        throw new Error("Resposta inválida: esperado array de produtos");
      }
      
      produtos = data;
      produtosCarregados = true;

      if (produtos.length === 0) {
        mostrarMensagemSemProdutos();
      } else {
        renderizarProdutos(produtos);
        setupPagination();
      }
      
      return produtos;
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar produtos:", error);
      produtosCarregados = false;
      throw error;
    });
}

function mostrarMensagemSemProdutos() {
  const containerItens = document.getElementById("container-itens");
  if (containerItens) {
    containerItens.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1;">
        <i class="fa-solid fa-box-open" style="font-size: 48px; color: #95a5a6; margin-bottom: 20px;"></i>
        <p style="font-size: 18px; color: #7f8c8d;">Nenhum produto disponível no momento</p>
      </div>
    `;
  }
}

function renderizarProdutos(lista) {
  const containerItens = document.getElementById("container-itens");
  if (!containerItens) {
    console.error("Container de itens não encontrado.");
    return;
  }
  
  containerItens.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const productsPerPage = getProductsPerPage();
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = lista.slice(start, end);

  paginatedProducts.forEach((produto) => {
    const item = document.createElement("div");
    item.classList.add("item");
    const precoFormatado = parseFloat(produto.preco).toFixed(2).replace(".", ",");
    const estoque = produto.quantidade_estoque || 0;

    item.innerHTML = `
      <span class="titulo-item">${produto.titulo}</span>
      <img src="/Uploads/${produto.imagem}" alt="${produto.titulo}" class="img-item">
      <span class="preco-item">R$ ${precoFormatado}</span>
      <span class="estoque-item ${estoque === 0 ? "out-of-stock" : ""}">Estoque: ${estoque}</span>
      <button class="botao-item" ${estoque === 0 ? 'disabled data-disabled-by-stock="true"' : ""}>${
      estoque === 0 ? "Indisponível" : "Adicionar ao Carrinho"
    }</button>
    `;

    if (estoque > 0) {
      const botao = item.querySelector(".botao-item");
      botao.addEventListener("click", () => adicionarAoCarrinhoClicked(produto));
    }
    
    fragment.appendChild(item);
  });

  containerItens.appendChild(fragment);
  
  // Aplicar controles de loja após renderizar
  if (statusLojaCarregado) {
    controlarInteracoesCarrinho(lojaAberta);
  }
}

function setupPagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = "";
  const productsPerPage = getProductsPerPage();
  const totalPages = Math.ceil(produtos.length / productsPerPage);

  if (totalPages <= 1) return;

  const prevButton = document.createElement("button");
  prevButton.textContent = "Anterior";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderizarProdutos(produtos);
      setupPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderizarProdutos(produtos);
      setupPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginationContainer.appendChild(pageButton);
  }

  const nextButton = document.createElement("button");
  nextButton.textContent = "Próxima";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderizarProdutos(produtos);
      setupPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(nextButton);
}

function filtrarProdutos() {
  if (!produtosCarregados || produtos.length === 0) {
    console.warn("Produtos ainda não foram carregados");
    return;
  }

  const buscaInput = document.getElementById("busca-produto");
  const filtroSelect = document.getElementById("filtro-categoria");

  if (!buscaInput || !filtroSelect) return;

  const termoBusca = buscaInput.value.toLowerCase();
  const categoriaSelecionada = filtroSelect.value;

  const produtosFiltrados = produtos.filter((produto) => {
    const nomeIncluiTermo = produto.titulo.toLowerCase().includes(termoBusca);
    const categoriaCorreta = categoriaSelecionada
      ? produto.categoria === categoriaSelecionada
      : true;
    return nomeIncluiTermo && categoriaCorreta;
  });

  currentPage = 1;
  renderizarProdutos(produtosFiltrados);
  setupPagination();
}

function adicionarAoCarrinhoClicked(produto) {
  // Verificar se a loja está aberta (usar variável global)
  if (!lojaAberta) {
    showToast("A loja está fechada. Não é possível adicionar itens ao carrinho.", "error");
    return;
  }

  const titulo = produto.titulo;
  const preco = produto.preco;
  const imagemSrc = produto.imagem;
  const id = produto.produto_id;
  const estoque = produto.quantidade_estoque || 0;

  if (estoque === 0) {
    showToast("Produto indisponível no estoque.", "error");
    return;
  }

  if (verificarItemNoCarrinho(id)) {
    showToast("O item já está no carrinho", "error");
    return;
  }

  adicionarItemAoCarrinho(titulo, preco, imagemSrc, id, estoque);
  atualizarBadgeCarrinho();
  showToast(`${titulo} adicionado ao carrinho!`, "success");

  const produtoSugerido = getSuggestionForProduct(produto);
  if (produtoSugerido) {
    setTimeout(() => {
      showSuggestionPopup(produto, produtoSugerido);
    }, 1000);
  }

  if (window.innerWidth > 53.125 * 16) {
    exibirCarrinho();
  }
}

function verificarItemNoCarrinho(produto_id) {
  if (!produto_id) {
    console.error("ID do produto não definido:", produto_id);
    return false;
  }

  const carrinhoItens = document.getElementsByClassName("carrinho-itens")[0];
  if (!carrinhoItens) {
    console.error("Container de itens do carrinho não encontrado.");
    return false;
  }
  
  const carrinhoItensArray = Array.from(
    carrinhoItens.getElementsByClassName("carrinho-item")
  );

  return carrinhoItensArray.some(
    (item) => item.getAttribute("data-produto-id") === produto_id.toString()
  );
}

function exibirCarrinho() {
  carrinhoVisivel = true;
  const carrinho = document.getElementsByClassName("carrinho")[0];
  if (carrinho) {
    carrinho.classList.add("active");
    const overlay = document.querySelector(".carrinho-overlay");
    if (overlay && window.innerWidth <= 53.125 * 16) {
      overlay.classList.add("active");
    }
  }
}

function adicionarItemAoCarrinho(titulo, preco, imagemSrc, produto_id, estoque) {
  const itensCarrinho = document.getElementsByClassName("carrinho-itens")[0];
  if (!itensCarrinho) {
    console.error("Container de itens do carrinho não encontrado.");
    showToast("Erro ao adicionar item ao carrinho.", "error");
    return;
  }
  
  const precoNumerico = parseFloat(preco);
  if (isNaN(precoNumerico)) {
    console.error("Preço inválido:", preco);
    showToast("Preço inválido para o item.", "error");
    return;
  }

  const item = document.createElement("div");
  item.classList.add("carrinho-item");
  item.setAttribute("data-produto-id", produto_id);
  item.setAttribute("data-estoque", estoque);

  item.innerHTML = `
    <img src="/Uploads/${imagemSrc}" width="80px" alt="${titulo}">
    <div class="carrinho-item-detalhes">
      <span class="carrinho-item-titulo">${titulo}</span>
      <div class="seletor-quantidade">
        <i class="fa-solid fa-minus subtrair-quantidade"></i>
        <input type="number" value="1" class="carrinho-item-quantidade" min="1" max="${estoque}">
        <i class="fa-solid fa-plus adicionar-quantidade"></i>
      </div>
      <span class="carrinho-item-preco">R$ ${precoNumerico.toFixed(2).replace(".", ",")}</span>
    </div>
    <button class="btn-remover">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;

  itensCarrinho.append(item);

  item.getElementsByClassName("btn-remover")[0].addEventListener("click", removerItemCarrinho);
  item.getElementsByClassName("adicionar-quantidade")[0].addEventListener("click", adicionarQuantidade);
  item.getElementsByClassName("subtrair-quantidade")[0].addEventListener("click", subtrairQuantidade);

  const inputQuantidade = item.getElementsByClassName("carrinho-item-quantidade")[0];
  inputQuantidade.addEventListener("blur", (event) => {
    let valor = parseInt(event.target.value);
    const maxEstoque = parseInt(event.target.closest(".carrinho-item").getAttribute("data-estoque"));
    if (isNaN(valor) || valor < 1) {
      event.target.value = 1;
      showToast("Quantidade mínima é 1.", "error");
    } else if (valor > maxEstoque) {
      event.target.value = maxEstoque;
      showToast(`Quantidade máxima disponível é ${maxEstoque}.`, "error");
    }
    atualizarTotalCarrinho();
    salvarCarrinhoNoLocalStorage();
    atualizarBadgeCarrinho();
  });

  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
}

function salvarCarrinhoNoLocalStorage() {
  const userId = getUserId();
  if (!userId) return;
  
  const chaveCarrinho = `carrinho_${userId}`;
  const carrinhoItens = Array.from(document.getElementsByClassName("carrinho-item")).map((item) => ({
    produto_id: item.getAttribute("data-produto-id"),
    titulo: item.querySelector(".carrinho-item-titulo").innerText,
    preco: parseFloat(
      item.querySelector(".carrinho-item-preco").innerText.replace("R$ ", "").replace(",", ".")
    ),
    quantidade: parseInt(item.querySelector(".carrinho-item-quantidade").value),
    imagem: item.querySelector("img").src.split("/").pop(),
    estoque: parseInt(item.getAttribute("data-estoque")),
  }));
  
  localStorage.setItem(chaveCarrinho, JSON.stringify(carrinhoItens));
  atualizarBadgeCarrinho();
}

function carregarCarrinhoDoLocalStorage() {
  console.log("🛒 Carregando carrinho do localStorage...");
  
  if (!produtosCarregados || produtos.length === 0) {
    console.warn("⚠️ Produtos ainda não carregados, aguardando...");
    return;
  }

  const userId = getUserId();
  const chaveCarrinho = userId ? `carrinho_${userId}` : "carrinho_temp";
  const carrinhoSalvo = JSON.parse(localStorage.getItem(chaveCarrinho)) || [];

  console.log(`📦 Restaurando ${carrinhoSalvo.length} itens do carrinho`);

  carrinhoSalvo.forEach((item) => {
    const produto = produtos.find((p) => p.produto_id == item.produto_id);
    const estoque = produto ? produto.quantidade_estoque : item.estoque || 0;
    
    if (estoque === 0) {
      console.warn(`❌ Produto ${item.titulo} sem estoque, removendo do carrinho`);
      return;
    }
    
    if (item.quantidade > estoque) {
      console.warn(`⚠️ Ajustando quantidade de ${item.titulo} para estoque disponível (${estoque})`);
      item.quantidade = estoque;
    }
    
    adicionarItemAoCarrinho(item.titulo, item.preco, item.imagem, item.produto_id, estoque);
    
    const ultimoItem = document.getElementsByClassName("carrinho-item")[
      document.getElementsByClassName("carrinho-item").length - 1
    ];
    
    if (ultimoItem) {
      const inputQuantidade = ultimoItem.querySelector(".carrinho-item-quantidade");
      if (inputQuantidade) {
        inputQuantidade.value = item.quantidade;
      }
    }
  });
  
  atualizarTotalCarrinho();
  atualizarBadgeCarrinho();
  
  if (carrinhoSalvo.length > 0 && window.innerWidth > 53.125 * 16) {
    exibirCarrinho();
  }
  
  console.log("✅ Carrinho restaurado com sucesso");
}

function removerItemCarrinho(event) {
  const buttonClicked = event.target;
  const item = buttonClicked.closest(".carrinho-item");
  if (item) {
    item.remove();
  }
  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
  atualizarBadgeCarrinho();
  ocultarCarrinho();
}

function ocultarCarrinho() {
  const carrinhoItens = document.getElementsByClassName("carrinho-itens")[0];
  if (carrinhoItens && carrinhoItens.childElementCount === 0) {
    const carrinho = document.getElementsByClassName("carrinho")[0];
    const overlay = document.querySelector(".carrinho-overlay");
    if (carrinho) carrinho.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    carrinhoVisivel = false;
  }
}

function atualizarTotalCarrinho() {
  const carrinhoItens = document.getElementsByClassName("carrinho-item");
  let total = 0;

  for (let i = 0; i < carrinhoItens.length; i++) {
    const item = carrinhoItens[i];
    const precoElemento = item.getElementsByClassName("carrinho-item-preco")[0].innerText;
    const preco = parseFloat(precoElemento.replace("R$", "").replace(",", "."));
    const quantidadeItem = item.getElementsByClassName("carrinho-item-quantidade")[0].value;
    total += preco * quantidadeItem;
  }

  total = Math.round(total * 100) / 100;
  const precoTotalElement = document.getElementsByClassName("carrinho-preco-total")[0];
  if (precoTotalElement) {
    precoTotalElement.innerText = "R$ " + total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return total;
}

function fetchPerfil() {
  const token = localStorage.getItem("token");
  if (!token) {
    return Promise.reject(new Error("Usuário não logado"));
  }
  return fetch(`${API_URL}/perfil`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (!response.ok) {
      return response.json().then((err) => {
        throw new Error(`Erro ao buscar perfil: ${err.message}`);
      });
    }
    return response.json();
  });
}

function createConfirmationPopup(itens, perfil, total) {
  const popup = document.createElement("div");
  popup.classList.add("confirmation-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h2>Confirmação do Pedido</h2>
      <h3>Itens do Carrinho</h3>
      <div class="itens-lista">
        ${itens.map((item) => `
          <div class="item-resumo">
            <span>${item.titulo}</span>
            <span>Quantidade: ${item.quantidade}</span>
            <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace(".", ",")}</span>
          </div>
        `).join("")}
      </div>
      <p class="total-pedido"><strong>Total do Pedido:</strong> R$ ${total.toFixed(2).replace(".", ",")}</p>
      <h3>Endereço de Entrega</h3>
      <div id="endereco-container">
        ${perfil && perfil.perfil && perfil.perfil.nome_rua ? `
          <p><strong>Endereço Cadastrado:</strong> ${perfil.perfil.nome_rua}, ${perfil.perfil.numero_casa}, ${perfil.perfil.bairro}, ${perfil.perfil.cidade} - ${perfil.perfil.UF}</p>
          <label><input type="radio" name="endereco" value="cadastrado" checked> Usar endereço cadastrado</label>
          <label><input type="radio" name="endereco" value="novo"> Usar outro endereço</label>
        ` : `
          <p>Nenhum endereço cadastrado.</p>
          <label><input type="radio" name="endereco" value="novo" checked> Cadastrar novo endereço</label>
        `}
      </div>
      <div id="novo-endereco" style="display: ${perfil && perfil.perfil && perfil.perfil.nome_rua ? "none" : "block"};">
        <h4>Novo Endereço</h4>
        <input type="text" id="nome_rua" placeholder="Rua" required>
        <input type="number" id="numero_casa" placeholder="Número" min="1" required>
        <input type="text" id="bairro" placeholder="Bairro" required>
        <input type="text" id="cidade" placeholder="Cidade" required>
        <input type="text" id="uf" placeholder="UF (2 letras)" maxlength="2" required>
      </div>
      <div class="popup-buttons">
        <button id="confirmar-pedido">Confirmar Pedido</button>
        <button id="cancelar-pedido">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  const enderecoRadios = popup.querySelectorAll('input[name="endereco"]');
  const novoEnderecoDiv = popup.querySelector("#novo-endereco");
  
  enderecoRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      novoEnderecoDiv.style.display = radio.value === "novo" ? "block" : "none";
    });
  });

  popup.querySelector("#cancelar-pedido").addEventListener("click", () => {
    popup.remove();
  });

  popup.querySelector("#confirmar-pedido").addEventListener("click", () => {
    const enderecoSelecionado = popup.querySelector('input[name="endereco"]:checked')?.value;
    let enderecoData = {};
    
    if (enderecoSelecionado === "novo") {
      const nome_rua = popup.querySelector("#nome_rua").value.trim();
      const numero_casa = popup.querySelector("#numero_casa").value;
      const bairro = popup.querySelector("#bairro").value.trim();
      const cidade = popup.querySelector("#cidade").value.trim();
      const uf = popup.querySelector("#uf").value.trim().toUpperCase();

      if (!nome_rua || !numero_casa || !bairro || !cidade || !uf) {
        showToast("Por favor, preencha todos os campos do novo endereço.", "error");
        return;
      }
      if (!/^\d+$/.test(numero_casa) || parseInt(numero_casa) <= 0) {
        showToast("Número da residência deve ser um número inteiro positivo.", "error");
        return;
      }
      if (!/^[A-Z]{2}$/.test(uf)) {
        showToast("UF deve conter exatamente 2 letras maiúsculas.", "error");
        return;
      }
      enderecoData = { nome_rua, numero_casa, bairro, cidade, UF: uf };
    } else if (perfil && perfil.perfil && perfil.perfil.nome_rua) {
      enderecoData = {
        nome_rua: perfil.perfil.nome_rua,
        numero_casa: perfil.perfil.numero_casa,
        bairro: perfil.perfil.bairro,
        cidade: perfil.perfil.cidade,
        UF: perfil.perfil.UF,
      };
    } else {
      showToast("Nenhum endereço disponível. Preencha um novo endereço.", "error");
      return;
    }
    
    confirmarPedido(itens, enderecoData, total);
    popup.remove();
  });
}

function confirmarPedido(itens, enderecoData, total) {
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  
  fetch(`${API_URL}/api/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id, itens, endereco: enderecoData }),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Erro ao finalizar pedido: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      showToast(
        `Compra realizada com sucesso! Pedido #${data.pedido_id} - Total: R$ ${data.valor_total.toFixed(2).replace(".", ",")}`,
        "success"
      );
      
      const chaveCarrinho = `carrinho_${user_id}`;
      localStorage.removeItem(chaveCarrinho);
      document.querySelector(".carrinho-itens").innerHTML = "";
      atualizarTotalCarrinho();
      atualizarBadgeCarrinho();
      ocultarCarrinho();
      
      const itensFormatados = itens.map((item) => {
        const precoTotalItem = (item.preco * item.quantidade).toFixed(2).replace(".", ",");
        return `- ${item.quantidade}x ${item.titulo} (R$ ${precoTotalItem})`;
      }).join("\n");
      
      const enderecoFormatado = `${enderecoData.nome_rua}, ${enderecoData.numero_casa}, ${enderecoData.bairro}, ${enderecoData.cidade} - ${enderecoData.UF}`;
      const mensagem = `Olá, vim pelo site do QRUP, fiz o pedido desses itens:\n${itensFormatados}\nPara o endereço: ${enderecoFormatado}\nNo valor de: R$ ${total.toFixed(2).replace(".", ",")}`;
      const mensagemCodificada = encodeURIComponent(mensagem);
      const whatsappLink = `https://wa.me/+5567992181941?text=${mensagemCodificada}`;
      window.location.href = whatsappLink;
    })
    .catch((error) => {
      console.error("Erro ao finalizar pedido:", error);
      showToast("Erro ao finalizar pedido. Tente novamente.", "error");
    });
}

function pagarClicked() {
  // Usar variável global em vez de fazer nova requisição
  if (!lojaAberta) {
    showToast("A loja está fechada. Não é possível finalizar pedidos agora.", "error");
    return;
  }
  
  const carrinhoItens = document.getElementsByClassName("carrinho-item");
  if (carrinhoItens.length === 0) {
    showToast("Seu carrinho está vazio!", "error");
    return;
  }

  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    showToast("Você precisa estar logado para finalizar a compra!", "error");
    return;
  }

  const itens = Array.from(carrinhoItens).map((item) => ({
    produto_id: item.getAttribute("data-produto-id"),
    quantidade: parseInt(item.querySelector(".carrinho-item-quantidade").value),
    titulo: item.querySelector(".carrinho-item-titulo").innerText,
    preco: parseFloat(
      item.querySelector(".carrinho-item-preco").innerText.replace("R$ ", "").replace(",", ".")
    ),
  }));

  const total = atualizarTotalCarrinho();

  fetchPerfil()
    .then((perfil) => {
      createConfirmationPopup(itens, perfil, total);
    })
    .catch((error) => {
      console.error("Erro ao buscar perfil:", error);
      createConfirmationPopup(itens, null, total);
    });
}

function adicionarQuantidade(event) {
  const buttonClicked = event.target;
  const seletor = buttonClicked.parentElement;
  const quantidadeAtual = parseInt(seletor.getElementsByClassName("carrinho-item-quantidade")[0].value);
  const item = seletor.closest(".carrinho-item");
  const maxEstoque = parseInt(item.getAttribute("data-estoque"));
  
  if (quantidadeAtual >= maxEstoque) {
    showToast(`Quantidade máxima disponível é ${maxEstoque}.`, "error");
    return;
  }
  
  seletor.getElementsByClassName("carrinho-item-quantidade")[0].value = quantidadeAtual + 1;
  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
  atualizarBadgeCarrinho();
}

function subtrairQuantidade(event) {
  const buttonClicked = event.target;
  const seletor = buttonClicked.parentElement;
  const quantidadeAtual = parseInt(seletor.getElementsByClassName("carrinho-item-quantidade")[0].value);
  
  if (quantidadeAtual > 1) {
    seletor.getElementsByClassName("carrinho-item-quantidade")[0].value = quantidadeAtual - 1;
    atualizarTotalCarrinho();
    salvarCarrinhoNoLocalStorage();
    atualizarBadgeCarrinho();
  }
}

function alterarFonte(action) {
  const body = document.body;
  let currentSize = parseFloat(window.getComputedStyle(body).fontSize);

  if (action === '+') {
    body.style.fontSize = `${currentSize + 2}px`;
  } else if (action === '-') {
    body.style.fontSize = `${currentSize - 2}px`;
  } else if (action === 'reset') {
    body.style.fontSize = "16px";
  }
}

// Expor funções globalmente se necessário
window.alterarFonte = alterarFonte;