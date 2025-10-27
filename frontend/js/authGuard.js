// authGuard.js - Sistema de proteção de rotas
// Incluir este script NO TOPO de TODAS as páginas HTML (exceto login.html)

// ============================================
// VALIDAÇÃO IMEDIATA SÍNCRONA (ANTES DO DOM)
// ============================================
(function() {
  const currentPage = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || 'index.html';
  
  const publicPages = ['login.html', 'registro.html', 'recuperacao.html'];
  const userPages = ['catalogo.html', 'perfil.html', 'pedidos.html'];
  const adminPages = ['adminPerfil.html', 'adminPedidos.html', 'adminCadastrarProdutos.html', 'adminAlterarProdutos.html', 'adminRelatorio.html'];
  
  // Ocultar página IMEDIATAMENTE
  document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important;';
  
  const isPublic = publicPages.includes(currentPage);
  const isUser = userPages.includes(currentPage);
  const isAdmin = adminPages.includes(currentPage);
  
  // Se não é página pública, verificar autenticação
  if (!isPublic) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    // Sem token = redirecionar imediatamente
    if (!token || token.trim() === '') {
      console.warn('🚫 Sem token - Redirecionando para login');
      window.location.replace('../html/login.html');
      return; // Parar execução
    }
    
    // Verificar expiração do token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.warn('🚫 Token expirado - Redirecionando');
        localStorage.clear();
        window.location.replace('../html/login.html');
        return;
      }
    } catch (e) {
      console.error('🚫 Token inválido - Redirecionando');
      localStorage.clear();
      window.location.replace('../html/login.html');
      return;
    }
    
    // Verificar permissões de admin
    if (isAdmin && role !== 'admin') {
      console.warn('🚫 Sem permissão admin - Redirecionando');
      alert('❌ Acesso negado. Você não tem permissão de administrador.');
      window.location.replace('../html/catalogo.html');
      return;
    }
    
    // Se passou por todas as validações, mostrar página
    document.documentElement.style.cssText = 'visibility: visible !important; opacity: 1 !important;';
  } else {
    // Página pública - verificar se já está logado
    const token = localStorage.getItem('token');
    if (token && token.trim() !== '') {
      const role = localStorage.getItem('role');
      console.log('✅ Usuário já autenticado, redirecionando...');
      if (role === 'admin') {
        window.location.replace('../html/adminPerfil.html');
      } else {
        window.location.replace('../html/catalogo.html');
      }
      return;
    }
    // Página pública e não logado - mostrar
    document.documentElement.style.cssText = 'visibility: visible !important; opacity: 1 !important;';
  }
})();

// ============================================
// MÓDULO AUTHGUARD (FUNÇÕES AUXILIARES)
// ============================================
const AuthGuard = (() => {
  const API_URL = "http://localhost:3000";
  
  // Configuração de rotas e permissões
  const ROUTES_CONFIG = {
    public: ['login.html', 'registro.html', 'recuperacao.html'],
    user: ['catalogo.html', 'perfil.html', 'pedidos.html'],
    admin: ['adminPerfil.html', 'adminPedidos.html', 'adminCadastrarProdutos.html', 'adminAlterarProdutos.html', 'adminRelatorio.html']
  };

  // Mostrar body após validação
  function showBody() {
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    document.documentElement.style.transition = 'opacity 0.15s ease-in';
  }

  // Obter nome do arquivo atual
  function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  }

  // Verificar tipo de rota
  function getRouteType(page) {
    if (ROUTES_CONFIG.public.includes(page)) return 'public';
    if (ROUTES_CONFIG.user.includes(page)) return 'user';
    if (ROUTES_CONFIG.admin.includes(page)) return 'admin';
    return 'unknown';
  }

  // Verificar se tem token válido
  function hasValidToken() {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.warn('⚠️ Token expirado');
        clearAuthData();
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('❌ Token inválido:', e);
      clearAuthData();
      return false;
    }
  }

  // Obter role do usuário
  function getUserRole() {
    return localStorage.getItem('role');
  }

  // Limpar dados de autenticação
  function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
  }

  // Redirecionar para login
  function redirectToLogin(reason = '') {
    console.warn(`🚫 Acesso negado: ${reason}`);
    clearAuthData();
    window.location.replace('../html/login.html');
  }

  // Validar token com servidor (assíncrono - opcional)
  async function validateTokenWithServer() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/verificar-admin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return false;
        }
        throw new Error(`Erro na validação: ${response.status}`);
      }

      const data = await response.json();
      if (data.role) {
        localStorage.setItem('role', data.role);
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao validar token com servidor:', error);
      return hasValidToken();
    }
  }

  // Validação secundária (após carregamento)
  async function validateWithServer() {
    const currentPage = getCurrentPage();
    const routeType = getRouteType(currentPage);

    if (routeType === 'user' || routeType === 'admin') {
      const serverValid = await validateTokenWithServer();
      
      if (!serverValid) {
        redirectToLogin('Token inválido no servidor');
        return;
      }
    }
    
    console.log('✅ Validação com servidor completa');
  }

  // Monitorar mudanças no localStorage (logout em outra aba)
  function monitorAuth() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' && !e.newValue) {
        console.warn('⚠️ Token removido em outra aba');
        redirectToLogin('Sessão encerrada');
      }
    });
  }

  // Interceptar navegação para validar rotas
  function interceptNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        const targetPage = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        const routeType = getRouteType(targetPage);

        if (routeType === 'admin') {
          const role = getUserRole();
          if (role !== 'admin') {
            e.preventDefault();
            alert('❌ Acesso negado. Você não tem permissão de administrador.');
            console.warn('🚫 Tentativa de acesso a rota admin bloqueada');
            return;
          }
        }

        if ((routeType === 'user' || routeType === 'admin') && !hasValidToken()) {
          e.preventDefault();
          redirectToLogin('Token inválido');
        }
      }
    });
  }

  // Expor API pública
  return {
    hasValidToken,
    getUserRole,
    clearAuthData,
    redirectToLogin,
    monitorAuth,
    interceptNavigation,
    getCurrentPage,
    getRouteType,
    validateWithServer
  };
})();

// ============================================
// AUTO-INICIALIZAÇÃO
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AuthGuard.monitorAuth();
    AuthGuard.interceptNavigation();
    // Validação com servidor em background
    AuthGuard.validateWithServer();
  });
} else {
  AuthGuard.monitorAuth();
  AuthGuard.interceptNavigation();
  AuthGuard.validateWithServer();
}

// Expor globalmente
window.AuthGuard = AuthGuard;