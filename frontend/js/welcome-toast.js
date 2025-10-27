// Sistema de Toast para Welcome
class WelcomeToast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
    this.showWelcomeSequence();
  }

  createContainer() {
    // Remove container existente se houver
    const existingContainer = document.getElementById("toast-container");
    if (existingContainer) {
      existingContainer.remove();
    }

    // Cria novo container
    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }

  createToast(message, type = "info", icon = "", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Define ícones baseado no type
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      error: '<i class="fas fa-times-circle"></i>',
      welcome: '<i class="fas fa-hand-sparkles"></i>',
      qr: '<i class="fas fa-qrcode"></i>',
      rocket: '<i class="fas fa-rocket"></i>',
      star: '<i class="fas fa-star"></i>',
    };

    const toastIcon = icon || icons[type] || icons.info;

    toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${toastIcon}
                </div>
                <div class="toast-message">
                    ${message}
                </div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

    // Adiciona ao container
    this.container.appendChild(toast);

    // Anima entrada
    setTimeout(() => {
      toast.classList.add("toast-show");
    }, 100);

    // Auto remove
    if (duration > 0) {
      // Anima barra de progresso
      const progressBar = toast.querySelector(".toast-progress-bar");
      if (progressBar) {
        progressBar.style.animationDuration = `${duration}ms`;
      }

      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    return toast;
  }

  removeToast(toast) {
    if (toast && toast.parentElement) {
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }

  showWelcomeSequence() {
    // Verifica se já mostrou hoje
    const today = new Date().toDateString();
    const lastWelcome = localStorage.getItem("qrup-last-welcome");

    if (lastWelcome === today) {
      return; // Já mostrou hoje
    }

    // Sequência de toasts de boas-vindas
    const welcomeMessages = [
      {
        message: "🎉 Bem-vindo ao QRUp! Delivery sem complicação!",
        type: "welcome",
        duration: 5000,
      },
      {
        message:
          "📱 Seus clientes pedem pelo QR Code, sem precisar baixar apps!",
        type: "qr",
        duration: 6000,
      },
      {
        message:
          "🚀 Gerencie tudo em um só lugar: vendas, estoque e faturamento!",
        type: "rocket",
        duration: 6000,
      },
      {
        message: "⭐ Experimente grátis e revolucione seu delivery!",
        type: "star",
        duration: 7000,
      },
    ];

    // Mostra mensagens em sequência
    welcomeMessages.forEach((msg, index) => {
      setTimeout(() => {
        this.createToast(msg.message, msg.type, "", msg.duration);
      }, index * 2000); // 2 segundos entre cada toast
    });

    // Salva que já mostrou hoje
    localStorage.setItem("qrup-last-welcome", today);
  }

  // Métodos públicos para usar em outras partes
  success(message, duration = 4000) {
    return this.createToast(message, "success", "", duration);
  }

  error(message, duration = 5000) {
    return this.createToast(message, "error", "", duration);
  }

  info(message, duration = 4000) {
    return this.createToast(message, "info", "", duration);
  }

  warning(message, duration = 4000) {
    return this.createToast(message, "warning", "", duration);
  }

  custom(message, type, icon, duration = 4000) {
    return this.createToast(message, type, icon, duration);
  }
}

// Funções utilitárias globais
function showToast(message, type = "info", duration = 4000) {
  if (window.welcomeToast) {
    return window.welcomeToast.createToast(message, type, "", duration);
  }
}

function showSuccess(message, duration = 4000) {
  if (window.welcomeToast) {
    return window.welcomeToast.success(message, duration);
  }
}

function showError(message, duration = 5000) {
  if (window.welcomeToast) {
    return window.welcomeToast.error(message, duration);
  }
}

function showInfo(message, duration = 4000) {
  if (window.welcomeToast) {
    return window.welcomeToast.info(message, duration);
  }
}

function showWarning(message, duration = 4000) {
  if (window.welcomeToast) {
    return window.welcomeToast.warning(message, duration);
  }
}

// Toasts temáticos para QRUp
function showQRToast(
  message = "📱 QR Code gerado com sucesso!",
  duration = 4000
) {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      message,
      "qr",
      '<i class="fas fa-qrcode"></i>',
      duration
    );
  }
}

function showDeliveryToast(
  message = "🛵 Pedido em preparação!",
  duration = 4000
) {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      message,
      "info",
      '<i class="fas fa-motorcycle"></i>',
      duration
    );
  }
}

function showSalesToast(
  message = "💰 Nova venda registrada!",
  duration = 4000
) {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      message,
      "success",
      '<i class="fas fa-cash-register"></i>',
      duration
    );
  }
}

function showStockToast(message = "📦 Estoque atualizado!", duration = 4000) {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      message,
      "warning",
      '<i class="fas fa-boxes"></i>',
      duration
    );
  }
}

// Toasts de ações específicas
function showLoginToast() {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      "🔑 Bem-vindo de volta! Faça login para continuar.",
      "info",
      '<i class="fas fa-sign-in-alt"></i>',
      5000
    );
  }
}

function showRegisterToast() {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      "✨ Cadastre-se grátis e comece agora mesmo!",
      "welcome",
      '<i class="fas fa-user-plus"></i>',
      5000
    );
  }
}

function showContactToast() {
  if (window.welcomeToast) {
    return window.welcomeToast.custom(
      "📞 Entre em contato conosco! Estamos aqui para ajudar.",
      "info",
      '<i class="fas fa-phone"></i>',
      5000
    );
  }
}

// Toast para demonstração de features
function showFeatureDemo(feature) {
  const features = {
    qrcode: {
      message: "📱 Clique para ver como funciona o QR Code!",
      type: "qr",
      icon: '<i class="fas fa-qrcode"></i>',
    },
    vendas: {
      message: "💰 Descubra como gerenciar suas vendas!",
      type: "success",
      icon: '<i class="fas fa-chart-line"></i>',
    },
    estoque: {
      message: "📦 Controle seu estoque automaticamente!",
      type: "warning",
      icon: '<i class="fas fa-inventory"></i>',
    },
    delivery: {
      message: "🛵 Delivery sem apps, só QR Code!",
      type: "info",
      icon: '<i class="fas fa-motorcycle"></i>',
    },
  };

  const selectedFeature = features[feature];
  if (selectedFeature && window.welcomeToast) {
    return window.welcomeToast.custom(
      selectedFeature.message,
      selectedFeature.type,
      selectedFeature.icon,
      6000
    );
  }
}

// Inicializa sistema de toast quando DOM carrega
document.addEventListener("DOMContentLoaded", function () {
  // Aguarda um pouco para garantir que o CSS carregou
  setTimeout(() => {
    window.welcomeToast = new WelcomeToast();

    // Toast de sistema pronto
    setTimeout(() => {
      if (window.welcomeToast) {
        window.welcomeToast.custom(
          "✅ Sistema carregado com sucesso!",
          "success",
          '<i class="fas fa-check"></i>',
          3000
        );
      }
    }, 1000);
  }, 500);
});

// Exemplo de uso para detectar cliques em elementos específicos
document.addEventListener("click", function (e) {
  // Toast para cliques na logo
  if (e.target.closest(".logo")) {
    setTimeout(() => {
      if (window.welcomeToast) {
        window.welcomeToast.custom(
          "🎯 Menu ativado! Navegue pelas opções.",
          "info",
          '<i class="fas fa-bars"></i>',
          3000
        );
      }
    }, 300);
  }

  // Toast para botões CTA
  if (e.target.closest(".btn-primary, .btn-outline")) {
    const buttonText = e.target.textContent.trim();
    setTimeout(() => {
      if (window.welcomeToast) {
        window.welcomeToast.custom(
          `🚀 "${buttonText}" - Ação iniciada!`,
          "rocket",
          '<i class="fas fa-rocket"></i>',
          4000
        );
      }
    }, 200);
  }

  // Toast para features
  if (e.target.closest(".feature")) {
    const featureTitle = e.target
      .closest(".feature")
      .querySelector("h3")?.textContent;
    if (featureTitle && window.welcomeToast) {
      window.welcomeToast.custom(
        `✨ ${featureTitle} - Saiba mais!`,
        "star",
        '<i class="fas fa-lightbulb"></i>',
        4000
      );
    }
  }
});

// Toast para erros de conexão
window.addEventListener("offline", function () {
  if (window.welcomeToast) {
    window.welcomeToast.error("📡 Sem conexão! Verifique sua internet.", 0); // 0 = não remove automaticamente
  }
});

window.addEventListener("online", function () {
  if (window.welcomeToast) {
    window.welcomeToast.success("🌐 Conexão restaurada!", 3000);
  }
});

// Exporta para uso global
if (typeof module !== "undefined" && module.exports) {
  module.exports = WelcomeToast;
}
