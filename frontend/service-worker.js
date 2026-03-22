const CACHE_NAME = "qrup-v1.0.0";
const OFFLINE_URL = "/frontend/html/offline.html";

// Arquivos essenciais para funcionar offline
const CORE_ASSETS = [
  "/frontend/html/home.html",
  "/frontend/html/login.html",
  "/frontend/html/catalogo.html",
  "/frontend/html/pedidos.html",
  "/frontend/html/perfil.html",
  "/frontend/css/global.css",
  "/frontend/css/home.css",
  "/frontend/css/login.css",
  "/frontend/css/catalogo.css",
  "/frontend/css/pedidos.css",
  "/frontend/css/perfil.css",
  "/frontend/css/acessibilidade.css",
  "/frontend/css/toast.css",
  "/frontend/js/authGuard.js",
  "/frontend/js/acessibilidade.js",
  "/images/favicon.ico",
  "/images/icon-192x192.png",
  "/images/icon-512x512.png",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Fazendo cache dos arquivos essenciais");
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log(
                "[Service Worker] Removendo cache antigo:",
                cacheName,
              );
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Estratégia de cache: Network First com fallback para Cache
self.addEventListener("fetch", (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== "GET") {
    return;
  }

  // Ignora requisições para API (sempre tenta buscar da rede)
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: "Sem conexão",
            message:
              "Você está offline. Algumas funcionalidades estão limitadas.",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 503,
          },
        );
      }),
    );
    return;
  }

  // Para outros recursos: Network First, fallback para Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta porque ela só pode ser consumida uma vez
        const responseClone = response.clone();

        // Salva no cache para uso futuro
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Se não está no cache e é uma página HTML, mostra página offline
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match(OFFLINE_URL);
          }

          // Para outros recursos, retorna erro
          return new Response("Recurso não disponível offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      }),
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Sincronização em background");

  if (event.tag === "sync-pedidos") {
    event.waitUntil(syncPedidos());
  }
});

// Notificações Push
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push recebido");

  const options = {
    body: event.data ? event.data.text() : "Nova notificação do QRUp",
    icon: "/images/icon-192x192.png",
    badge: "/images/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver detalhes",
        icon: "/images/icon-96x96.png",
      },
      {
        action: "close",
        title: "Fechar",
        icon: "/images/icon-96x96.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("QRUp", options));
});

// Clique em notificação
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificação clicada");

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/frontend/html/pedidos.html"));
  }
});

// Função auxiliar para sincronizar pedidos
async function syncPedidos() {
  try {
    // Aqui você implementaria a lógica de sincronização
    console.log("[Service Worker] Sincronizando pedidos...");
    // const response = await fetch('/api/pedidos/sync', { method: 'POST' });
    // return response.ok;
  } catch (error) {
    console.error("[Service Worker] Erro ao sincronizar:", error);
    throw error;
  }
}
