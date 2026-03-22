// Gerenciamento de instalação do PWA
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.init();
  }

  init() {
    // Registra o Service Worker
    this.registerServiceWorker();

    // Configura o prompt de instalação
    this.setupInstallPrompt();

    // Verifica se já está instalado
    this.checkIfInstalled();

    // Monitora mudanças no status de instalação
    this.monitorInstallStatus();
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/frontend/service-worker.js",
          {
            scope: "/",
          },
        );

        console.log(
          "[PWA] Service Worker registrado com sucesso:",
          registration.scope,
        );

        // Verifica atualizações
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          console.log("[PWA] Nova versão disponível");

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateNotification();
            }
          });
        });

        // Verifica atualizações a cada hora
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );
      } catch (error) {
        console.error("[PWA] Falha ao registrar Service Worker:", error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("[PWA] Evento beforeinstallprompt disparado");

      // Previne o prompt automático
      e.preventDefault();

      // Salva o evento para usar depois
      this.deferredPrompt = e;

      // Mostra o botão de instalação personalizado
      this.showInstallButton();
    });

    // Detecta quando o app foi instalado
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App instalado com sucesso");
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showInstallSuccessMessage();
    });
  }

  showInstallButton() {
    // Cria botão de instalação se não existir
    if (!this.installButton) {
      this.installButton = document.createElement("button");
      this.installButton.id = "pwa-install-button";
      this.installButton.className = "pwa-install-btn";
      this.installButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
        </svg>
        <span>Instalar App</span>
      `;

      this.installButton.addEventListener("click", () => this.install());
      document.body.appendChild(this.installButton);
    }

    this.installButton.style.display = "flex";
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = "none";
    }
  }

  async install() {
    if (!this.deferredPrompt) {
      console.log("[PWA] Prompt de instalação não disponível");
      return;
    }

    // Mostra o prompt de instalação
    this.deferredPrompt.prompt();

    // Aguarda a escolha do usuário
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(
      `[PWA] Usuário ${outcome === "accepted" ? "aceitou" : "recusou"} a instalação`,
    );

    // Limpa o prompt
    this.deferredPrompt = null;

    if (outcome === "accepted") {
      this.hideInstallButton();
    }
  }

  checkIfInstalled() {
    // Verifica se está rodando em modo standalone (instalado)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      console.log("[PWA] App está rodando em modo instalado");
      this.hideInstallButton();
      this.addInstalledClass();
    }
  }

  monitorInstallStatus() {
    // Monitora mudanças no display mode
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");

    displayModeQuery.addEventListener("change", (e) => {
      if (e.matches) {
        console.log("[PWA] App entrou em modo standalone");
        this.addInstalledClass();
      } else {
        console.log("[PWA] App saiu do modo standalone");
        this.removeInstalledClass();
      }
    });
  }

  addInstalledClass() {
    document.body.classList.add("pwa-installed");
  }

  removeInstalledClass() {
    document.body.classList.remove("pwa-installed");
  }

  showUpdateNotification() {
    const notification = document.createElement("div");
    notification.className = "pwa-update-notification";
    notification.innerHTML = `
      <div class="pwa-update-content">
        <p>Nova versão disponível!</p>
        <button onclick="window.location.reload()">Atualizar</button>
        <button onclick="this.parentElement.parentElement.remove()">Depois</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove após 10 segundos se não interagir
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  showInstallSuccessMessage() {
    // Você pode usar seu sistema de toast existente aqui
    console.log("[PWA] Mostrando mensagem de sucesso");

    const toast = document.createElement("div");
    toast.className = "pwa-toast success";
    toast.textContent = "✓ App instalado com sucesso!";
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission() {
    if ("Notification" in window && navigator.serviceWorker) {
      const permission = await Notification.requestPermission();
      console.log("[PWA] Permissão de notificação:", permission);
      return permission === "granted";
    }
    return false;
  }

  // Mostrar notificação
  async showNotification(title, options = {}) {
    if ("serviceWorker" in navigator && "Notification" in window) {
      const permission = await this.requestNotificationPermission();

      if (permission) {
        const registration = await navigator.serviceWorker.ready;

        return registration.showNotification(title, {
          icon: "/images/icon-192x192.png",
          badge: "/images/icon-72x72.png",
          vibrate: [200, 100, 200],
          ...options,
        });
      }
    }
  }
}

// Inicializa o PWA Installer quando a página carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.pwaInstaller = new PWAInstaller();
  });
} else {
  window.pwaInstaller = new PWAInstaller();
}
