// Sistema de Acessibilidade QRUp
class AcessibilidadeQRup {
  constructor() {
    this.tamanhoFonteAtual = 100; // Padrão 100%
    this.tamanhoOriginal = {}; // Armazena tamanhos originais
    this.init();
  }

  init() {
    // Salva tamanhos originais ao carregar
    this.salvarTamanhosOriginais();

    // Carrega configuração salva
    this.carregarConfiguracoes();

    // Aplica configuração inicial
    this.aplicarTamanhoFonte();

    // Adiciona indicador visual
    this.criarIndicadorTamanho();
  }

  salvarTamanhosOriginais() {
    // Salva o tamanho original de elementos importantes
    const elementos = document.querySelectorAll("*");

    elementos.forEach((elemento) => {
      if (this.deveProcessarElemento(elemento)) {
        const computedStyle = window.getComputedStyle(elemento);
        const fontSize = parseFloat(computedStyle.fontSize);

        if (fontSize > 0) {
          elemento.setAttribute("data-font-original", fontSize);
        }
      }
    });
  }

  deveProcessarElemento(elemento) {
    const tagsIgnoradas = ["SCRIPT", "STYLE", "META", "LINK", "NOSCRIPT"];
    return !tagsIgnoradas.includes(elemento.tagName);
  }

  alterarFonte(acao) {
    const anterior = this.tamanhoFonteAtual;

    switch (acao) {
      case "+":
        if (this.tamanhoFonteAtual < 150) {
          // Máximo 150%
          this.tamanhoFonteAtual += 10;
        }
        break;
      case "-":
        if (this.tamanhoFonteAtual > 70) {
          // Mínimo 70%
          this.tamanhoFonteAtual -= 10;
        }
        break;
      case "reset":
        this.tamanhoFonteAtual = 100; // Volta ao padrão
        break;
    }

    // Só aplica se houve mudança
    if (anterior !== this.tamanhoFonteAtual) {
      this.aplicarTamanhoFonte();
      this.salvarConfiguracoes();
      this.mostrarFeedback(acao);
      this.atualizarIndicador();
    }
  }

  aplicarTamanhoFonte() {
    // Remove estilos anteriores
    this.limparEstilosAnteriores();

    if (this.tamanhoFonteAtual === 100) {
      // Restaura tamanhos originais
      this.restaurarTamanhosOriginais();
    } else {
      // Aplica novo tamanho
      this.aplicarNovoTamanho();
    }
  }

  limparEstilosAnteriores() {
    const elementos = document.querySelectorAll("[data-font-adjusted]");
    elementos.forEach((elemento) => {
      elemento.style.fontSize = "";
      elemento.removeAttribute("data-font-adjusted");
    });
  }

  restaurarTamanhosOriginais() {
    const elementos = document.querySelectorAll("[data-font-original]");
    elementos.forEach((elemento) => {
      const tamanhoOriginal = elemento.getAttribute("data-font-original");
      if (tamanhoOriginal) {
        elemento.style.fontSize = tamanhoOriginal + "px";
      }
    });
  }

  aplicarNovoTamanho() {
    const elementos = document.querySelectorAll("[data-font-original]");

    elementos.forEach((elemento) => {
      const tamanhoOriginal = parseFloat(
        elemento.getAttribute("data-font-original")
      );
      if (tamanhoOriginal > 0) {
        const novoTamanho = (tamanhoOriginal * this.tamanhoFonteAtual) / 100;
        elemento.style.fontSize = novoTamanho + "px";
        elemento.setAttribute("data-font-adjusted", "true");
      }
    });
  }

  salvarConfiguracoes() {
    localStorage.setItem("qrup-font-size", this.tamanhoFonteAtual);
  }

  carregarConfiguracoes() {
    const tamanhoSalvo = localStorage.getItem("qrup-font-size");
    if (tamanhoSalvo) {
      this.tamanhoFonteAtual = parseInt(tamanhoSalvo);
    }
  }

  criarIndicadorTamanho() {
    // Cria indicador visual do tamanho atual
    const indicador = document.createElement("div");
    indicador.id = "font-size-indicator";
    indicador.innerHTML = `
            <div class="font-indicator-content">
                <span class="font-indicator-label">Fonte:</span>
                <span class="font-indicator-value">${this.tamanhoFonteAtual}%</span>
            </div>
        `;

    // Adiciona estilos inline para não depender de CSS externo
    indicador.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(27, 92, 80, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            z-index: 9999;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            pointer-events: none;
            font-family: 'Poppins', sans-serif;
        `;

    document.body.appendChild(indicador);

    // Mostra apenas se não for 100%
    if (this.tamanhoFonteAtual !== 100) {
      this.mostrarIndicador();
    }
  }

  atualizarIndicador() {
    const indicador = document.getElementById("font-size-indicator");
    if (indicador) {
      const valor = indicador.querySelector(".font-indicator-value");
      if (valor) {
        valor.textContent = this.tamanhoFonteAtual + "%";
      }

      if (this.tamanhoFonteAtual === 100) {
        this.esconderIndicador();
      } else {
        this.mostrarIndicador();
      }
    }
  }

  mostrarIndicador() {
    const indicador = document.getElementById("font-size-indicator");
    if (indicador) {
      indicador.style.opacity = "1";
      indicador.style.transform = "translateY(0)";
    }
  }

  esconderIndicador() {
    const indicador = document.getElementById("font-size-indicator");
    if (indicador) {
      indicador.style.opacity = "0";
      indicador.style.transform = "translateY(20px)";
    }
  }

  mostrarFeedback(acao) {
    // Feedback visual e sonoro
    const mensagens = {
      "+": `🔍 Fonte aumentada para ${this.tamanhoFonteAtual}%`,
      "-": `🔍 Fonte diminuída para ${this.tamanhoFonteAtual}%`,
      reset: "🔍 Fonte restaurada ao padrão (100%)",
    };

    // Mostra toast se disponível
    if (typeof showInfo === "function") {
      showInfo(mensagens[acao], 2000);
    }

    // Feedback visual nos botões
    this.animarBotaoAcessibilidade(acao);
  }

  animarBotaoAcessibilidade(acao) {
    const botoes = document.querySelectorAll(".acessibilidade button");
    let botaoAlvo;

    botoes.forEach((botao) => {
      const texto = botao.textContent.trim();
      if (
        (acao === "+" && texto === "A+") ||
        (acao === "-" && texto === "A-") ||
        (acao === "reset" && texto === "A")
      ) {
        botaoAlvo = botao;
      }
    });

    if (botaoAlvo) {
      botaoAlvo.style.transform = "scale(1.2)";
      botaoAlvo.style.background = "linear-gradient(135deg, #c6a657, #1b5c50)";

      setTimeout(() => {
        botaoAlvo.style.transform = "";
        botaoAlvo.style.background = "";
      }, 200);
    }
  }

  // Método para reprocessar elementos dinâmicos
  reprocessarElementos() {
    this.salvarTamanhosOriginais();
    this.aplicarTamanhoFonte();
  }

  // Método para resetar tudo
  resetarCompleto() {
    this.tamanhoFonteAtual = 100;
    this.limparEstilosAnteriores();
    this.restaurarTamanhosOriginais();
    this.salvarConfiguracoes();
    this.atualizarIndicador();

    if (typeof showSuccess === "function") {
      showSuccess("✅ Acessibilidade resetada!", 2000);
    }
  }
}

// Instância global
let sistemaAcessibilidade;

// Funções globais para compatibilidade
function alterarFonte(acao) {
  if (!sistemaAcessibilidade) {
    sistemaAcessibilidade = new AcessibilidadeQRup();
  }
  sistemaAcessibilidade.alterarFonte(acao);
}

// Funções adicionais
function aumentarFonte() {
  alterarFonte("+");
}

function diminuirFonte() {
  alterarFonte("-");
}

function resetarFonte() {
  alterarFonte("reset");
}

function obterTamanhoAtual() {
  return sistemaAcessibilidade ? sistemaAcessibilidade.tamanhoFonteAtual : 100;
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  // Aguarda um pouco para elementos carregarem
  setTimeout(() => {
    sistemaAcessibilidade = new AcessibilidadeQRup();

    // Observer para elementos dinâmicos
    const observer = new MutationObserver(function (mutations) {
      let deveReprocessar = false;

      // IDs de modais que não devem disparar reprocessamento de fonte
      const modaisIgnorados = [
        "modal-resultado-nfe",
        "modal-importar-nfe",
        "modal-incrementar-estoque",
        "modal-alterar-horarios",
        "modal-fechar-estabelecimento",
      ];

      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function (node) {
            // Ignora nós de texto e modais específicos
            if (node.nodeType !== 1) return;
            const id = node.id || "";
            const classList = node.className || "";
            const ehModalIgnorado =
              modaisIgnorados.includes(id) ||
              classList.includes("modal-resultado-nfe") ||
              classList.includes("toast");
            if (!ehModalIgnorado) {
              deveReprocessar = true;
            }
          });
        }
      });

      if (deveReprocessar && sistemaAcessibilidade) {
        setTimeout(() => {
          sistemaAcessibilidade.reprocessarElementos();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }, 500);
});

// Atalhos de teclado
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Alt + teclas de acessibilidade
  if ((e.ctrlKey || e.metaKey) && e.altKey) {
    switch (e.key) {
      case "=":
      case "+":
        e.preventDefault();
        alterarFonte("+");
        break;
      case "-":
        e.preventDefault();
        alterarFonte("-");
        break;
      case "0":
        e.preventDefault();
        alterarFonte("reset");
        break;
    }
  }
});

// Exporta para uso em outros arquivos
if (typeof module !== "undefined" && module.exports) {
  module.exports = AcessibilidadeQRup;
}