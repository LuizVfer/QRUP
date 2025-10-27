# Sistema de Sugestões de Compra - TODO

## ✅ Concluído

- [x] Análise da estrutura atual do projeto
- [x] Identificação dos arquivos a serem modificados
- [x] Criação do plano de implementação
- [x] Implementar sistema de mapeamento de sugestões no JavaScript
- [x] Criar função para exibir popup de sugestão
- [x] Modificar função adicionarAoCarrinhoClicked() para disparar sugestões
- [x] Adicionar estilos CSS para popup de sugestão
- [x] Implementar lógica inteligente de sugestões

## ✅ Concluído

- [x] Testar funcionalidade no navegador
- [x] Implementação finalizada com sucesso

## 📝 Observações do Teste

- Interface carregou corretamente
- Estilos CSS aplicados com sucesso
- JavaScript integrado sem erros de sintaxe
- Erros de CORS são normais (backend precisa estar configurado para servir arquivos estáticos)
- Sistema pronto para uso quando backend estiver totalmente configurado

## 📋 Detalhes da Implementação

### JavaScript (catalogo.js) ✅

- [x] Criar objeto de mapeamento de sugestões (SUGESTOES_PRODUTOS)
- [x] Função showSuggestionPopup()
- [x] Função getSuggestionForProduct()
- [x] Modificar adicionarAoCarrinhoClicked()
- [x] Lógica para evitar sugestões duplicadas

### CSS (catalogo.css) ✅

- [x] Estilos para .suggestion-popup
- [x] Animações de entrada/saída
- [x] Responsividade para mobile
- [x] Botões de ação do popup

### Funcionalidades ✅

- [x] Cerveja → Gelo, Petisco, Amendoim, Batata
- [x] Refrigerante → Gelo, Petisco, Salgadinho
- [x] Água → Gelo
- [x] Suco → Gelo, Biscoito
- [x] Energético → Gelo, Barra de cereal
- [x] Alimentos → Refrigerante, Água, Suco
- [x] Bebidas → Gelo, Petisco, Amendoim, Salgadinho, Batata
- [x] Outros → Refrigerante, Água
- [x] Verificação de estoque
- [x] Verificação de itens já no carrinho
- [x] Toast de sucesso ao adicionar item
- [x] Popup com animação suave
- [x] Auto-fechamento após 10 segundos
- [x] Responsividade completa

## 🎯 Funcionalidades Implementadas

### Sistema de Sugestões Inteligente:

1. **Mapeamento por Palavra-chave**: Detecta palavras específicas no título do produto
2. **Mapeamento por Categoria**: Sugestões baseadas na categoria do produto
3. **Validações**: Não sugere produtos já no carrinho ou sem estoque
4. **Interface Atrativa**: Popup moderno com animações suaves
5. **Experiência do Usuário**: Toast de confirmação + sugestão contextual

### Exemplo de Funcionamento:

- Usuário adiciona "Cerveja Heineken" → Sistema sugere "Gelo", "Petisco", etc.
- Usuário adiciona "Refrigerante Coca-Cola" → Sistema sugere "Gelo", "Salgadinho", etc.
- Popup aparece 1 segundo após adicionar item (para não conflitar com toast)
- Usuário pode aceitar ou recusar a sugestão
- Sistema adiciona automaticamente ao carrinho se aceito

CARLOS FELIPE LIMA VICTORIANI {

1. Redis Sistema de cache em memória para acelerar consultas frequentes.- Maior impacto com menor esforço

2.Testes básicos Códigos que testam automaticamente se suas funções estão funcionando corretamente.- Para principais funcionalidades

3. Docker Containerização da aplicação para deploy consistente.- Para facilitar deploys

4. WebSocket Comunicação bidirecional instantânea entre cliente e servidor.- Para diferencial competitivo

5. CI/CD Automação de testes, build e deploy quando você faz commit.- Para automação completa

6. implentação da API do CANVAS? sera valido? viavel?

}

# Correção Horários de Funcionamento

# TODO - Correção Horários de Funcionamento

## 📋 Resumo
Corrigir a funcionalidade de atualização de horários de funcionamento da loja que não estava salvando as alterações.

## 🐛 Problema Identificado
- O formulário de horários não tinha event listener configurado
- O `submit` do formulário não estava sendo capturado
- A função `atualizarHorarios()` existia mas nunca era chamada

## ✅ Checklist de Implementação

### 1. Atualizar `adminProducts.js`
- [ ] Localizar o bloco `if (isAlterarProdutosPage)`
- [ ] Encontrar a seção onde estão os outros event listeners de formulários
- [ ] Adicionar o event listener do formulário de horários após `botaoAbrirHorarios`

**Código a adicionar:**
```javascript
// Adicionar após o botaoAbrirHorarios
const formHorarios = document.getElementById("form-horarios");
if (formHorarios) {
  formHorarios.addEventListener("submit", atualizarHorarios);
} else {
  console.warn("Formulário de horários não encontrado");
}
```

**Localização exata:** Após a linha ~730 (depois do event listener do `botaoAbrirHorarios`)

### 2. Testar a Funcionalidade
- [ ] Reiniciar o servidor backend
- [ ] Fazer login como administrador
- [ ] Acessar "Alterar Produtos"
- [ ] Clicar no botão "Horário de Funcionamento"
- [ ] Verificar se os horários atuais são carregados corretamente
- [ ] Alterar os horários (ex: 08:00 às 18:00)
- [ ] Clicar em "Salvar Horários"
- [ ] Verificar se aparece toast de sucesso
- [ ] Clicar novamente no botão de horários
- [ ] Confirmar se os novos horários foram salvos

### 3. Validações a Verificar
- [ ] Formato HH:MM está sendo aceito
- [ ] Horário de abertura não pode ser maior/igual ao fechamento
- [ ] Campos vazios são rejeitados
- [ ] Toast de erro aparece para validações falhas
- [ ] Toast de sucesso aparece quando salva corretamente

## ⚠️ Limitações Conhecidas

### Horários em Memória
- Os horários são salvos apenas na **memória do servidor**
- **Após reiniciar o servidor**, voltam ao padrão:
  - Abertura: 00:01
  - Fechamento: 23:59

### Impacto
- ✅ Funciona enquanto o servidor está rodando
- ❌ Perde as configurações ao reiniciar
- ✅ Não requer mudanças no banco de dados

## 🔄 Alternativas Futuras (Opcional)

### Se quiser persistência permanente:

#### Opção 1: Banco de Dados (mais robusto)
```sql
CREATE TABLE configuracoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chave VARCHAR(50) UNIQUE,
  valor TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Opção 2: Arquivo JSON (mais simples)
- Criar `config/horarios.json`
- Ler/escrever arquivo ao invés de variável em memória
- Persistência sem banco de dados

## 📝 Arquivos Modificados

### `adminProducts.js`
```
Linha ~730-735: Adicionar event listener do form-horarios
```

### Nenhuma modificação necessária em:
- ✅ `adminAlterarProdutos.html` (já está correto)
- ✅ `pedidoController.js` (já está correto)
- ✅ `pedidoRoutes.js` (já está correto)

## 🧪 Casos de Teste

### Teste 1: Salvar Horários Válidos
```
Input: 08:00 - 18:00
Esperado: Toast de sucesso + horários salvos
```

### Teste 2: Horário Inválido
```
Input: 18:00 - 08:00 (fechamento antes da abertura)
Esperado: Toast de erro + não salva
```

### Teste 3: Formato Inválido
```
Input: 25:00 - 18:00
Esperado: Toast de erro + não salva
```

### Teste 4: Persistência na Sessão
```
1. Salvar horários: 09:00 - 17:00
2. Reabrir modal
Esperado: Mostrar 09:00 - 17:00
```

### Teste 5: Após Reiniciar Servidor
```
1. Salvar horários: 09:00 - 17:00
2. Reiniciar servidor
3. Abrir modal
Esperado: Mostrar 00:01 - 23:59 (padrão)
```

## 📊 Status da Tarefa

- [x] Problema identificado
- [ ] Código atualizado
- [ ] Testes realizados
- [ ] Documentação atualizada
- [ ] Deploy realizado

## 🎯 Resultado Esperado

Após esta correção:
- ✅ Modal de horários abre corretamente
- ✅ Horários atuais são carregados
- ✅ Formulário envia dados ao clicar em "Salvar"
- ✅ Backend recebe e processa a requisição
- ✅ Horários são atualizados na memória
- ✅ Toast de sucesso é exibido
- ✅ Verificação de horários funciona em pedidos

## 📞 Suporte

Se encontrar problemas:
1. Verificar console do navegador (F12)
2. Verificar logs do servidor backend
3. Confirmar que o token de admin é válido
4. Verificar se a rota `/api/horarios` está ativa

---

**Data de Criação:** Outubro 2025  
**Última Atualização:** Outubro 2025  
**Responsável:** Desenvolvimento  
**Prioridade:** 🔴 Alta

## 📋 TODO - Implementação de Segurança de Rotas

## 🎯 Objetivo
Implementar camadas de segurança no backend do sistema QRUP sem instalar dependências adicionais, protegendo contra SQL Injection, Path Traversal, Rate Limiting por rota e validação profunda de inputs.

---

## ✅ FASE 1: Criação dos Arquivos de Segurança

### 1.1 Criar Middleware de Segurança de Rotas
- [ ] Criar arquivo `backend/middlewares/routeSecurity.js`
- [ ] Implementar `validateHttpMethod(allowedMethods)`
- [ ] Implementar `validateRouteParams` (validação de IDs)
- [ ] Implementar `validateContentType`
- [ ] Implementar `preventPathTraversal`
- [ ] Implementar `validateBodySize(maxSizeKB)`
- [ ] Implementar `sanitizeQueryParams`
- [ ] Implementar `createRouteRateLimit(maxRequests, windowMinutes)`
- [ ] Implementar `logSuspiciousActivity`
- [ ] Implementar `validateRequiredHeaders(requiredHeaders)`
- [ ] Exportar todos os middlewares

**Arquivo:** `backend/middlewares/routeSecurity.js`  
**Linhas de código:** ~250 linhas  
**Tempo estimado:** 20 minutos

---

### 1.2 Criar Middleware de Validação de Inputs
- [ ] Criar arquivo `backend/middlewares/inputValidation.js`
- [ ] Implementar `validateRegistration` (username, email, senha)
- [ ] Implementar `validateLogin` (email, senha, recaptchaToken)
- [ ] Implementar `validatePedido` (user_id, itens, endereço)
- [ ] Implementar `validateProduto` (título, preço, categoria, barcode, estoque)
- [ ] Implementar `validatePerfil` (nome, CPF, data nascimento, contatos, endereço)
- [ ] Implementar `validateRelatorioParams` (datas, período)
- [ ] Exportar todos os validadores

**Arquivo:** `backend/middlewares/inputValidation.js`  
**Linhas de código:** ~300 linhas  
**Tempo estimado:** 25 minutos

---

### 1.3 Criar Arquivo de Configurações de Segurança
- [ ] Criar arquivo `backend/config/security.js`
- [ ] Definir configurações de `rateLimits` por tipo de rota
- [ ] Definir `bodySizes` (default, upload, xml)
- [ ] Definir `requiredHeaders` por tipo de rota
- [ ] Definir `suspiciousPatterns` (SQL Injection, XSS, etc)
- [ ] Definir `allowedFileExtensions` e `allowedMimeTypes`
- [ ] Definir `securityHeaders` (X-Frame-Options, CSP, etc)
- [ ] Definir `idValidation` (maxValue, pattern)
- [ ] Definir `timeouts` (gracefulShutdown, requestTimeout)
- [ ] Exportar configurações

**Arquivo:** `backend/config/security.js`  
**Linhas de código:** ~80 linhas  
**Tempo estimado:** 10 minutos

---

## ✅ FASE 2: Atualização do Server.js

### 2.1 Importar Novos Middlewares
- [ ] Importar middlewares de `routeSecurity.js`
- [ ] Importar configurações de `security.js` (opcional)

### 2.2 Aplicar Middlewares Globais de Segurança
- [ ] Adicionar `preventPathTraversal` (antes de tudo)
- [ ] Adicionar `logSuspiciousActivity`
- [ ] Adicionar `sanitizeQueryParams`
- [ ] Adicionar `validateContentType`
- [ ] Adicionar `validateBodySize` (com exceção para uploads)

### 2.3 Configurar Headers de Segurança
- [ ] Adicionar middleware para headers de segurança
- [ ] Configurar `X-Frame-Options: DENY`
- [ ] Configurar `X-Content-Type-Options: nosniff`
- [ ] Configurar `X-XSS-Protection: 1; mode=block`
- [ ] Configurar `Referrer-Policy`
- [ ] Configurar `Content-Security-Policy`
- [ ] Configurar `Permissions-Policy`
- [ ] Remover header `X-Powered-By`

### 2.4 Atualizar Configuração de CORS
- [ ] Adicionar validação de origin (bloquear origens não permitidas)
- [ ] Adicionar logging de origens bloqueadas
- [ ] Configurar `credentials: true`
- [ ] Configurar `maxAge: 86400` (cache preflight)

### 2.5 Melhorar Rate Limiting Global
- [ ] Adicionar `standardHeaders: true`
- [ ] Adicionar `legacyHeaders: false`
- [ ] Implementar `keyGenerator` (IP + user-agent)
- [ ] Adicionar handler customizado com logging
- [ ] Incluir `retryAfter` na resposta

### 2.6 Corrigir Prefixos das Rotas
- [ ] Alterar `/perfil` → `/api/perfil`
- [ ] Alterar `/produtos` → `/api/produtos`
- [ ] Alterar `/relatorios` → `/api/relatorios`
- [ ] Manter `/api` para authRoutes
- [ ] Manter `/api` para pedidoRouter

### 2.7 Adicionar Rota de Health Check
- [ ] Criar rota `GET /health`
- [ ] Retornar status, timestamp, uptime

### 2.8 Melhorar Tratamento de Erros 404
- [ ] Adicionar middleware de 404 (antes do error handler)
- [ ] Adicionar logging de rotas não encontradas
- [ ] Retornar JSON com path e method

### 2.9 Melhorar Middleware de Tratamento de Erros
- [ ] Adicionar logging detalhado de erros
- [ ] Tratar `UnauthorizedError`
- [ ] Tratar `entity.parse.failed`
- [ ] Tratar erros de CORS
- [ ] Tratar `LIMIT_FILE_SIZE`
- [ ] Não expor stack trace em produção

### 2.10 Melhorar Encerramento Gracioso
- [ ] Criar função `gracefulShutdown(signal)`
- [ ] Fechar servidor HTTP
- [ ] Fechar pool de conexões do banco
- [ ] Adicionar timeout de 10s para forçar encerramento
- [ ] Tratar `uncaughtException`
- [ ] Tratar `unhandledRejection`

**Arquivo:** `backend/server.js`  
**Tempo estimado:** 30 minutos

---

## ✅ FASE 3: Atualização das Rotas

### 3.1 Atualizar authRoutes.js
- [ ] Importar `validateHttpMethod`, `createRouteRateLimit`
- [ ] Importar `validateRegistration`, `validateLogin`
- [ ] Adicionar validações na rota `/registro`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(5, 15)`
  - [ ] `validateRegistration`
- [ ] Adicionar validações na rota `/login`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(10, 15)`
  - [ ] `validateLogin`
- [ ] Adicionar validações na rota `/verificar-admin`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `/solicitar-recuperacao`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(3, 60)`
- [ ] Adicionar validações na rota `/verificar-codigo`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(5, 15)`
- [ ] Adicionar validações na rota `/recuperar-senha`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(5, 15)`

**Arquivo:** `backend/routes/authRoutes.js`  
**Tempo estimado:** 15 minutos

---

### 3.2 Atualizar produtosRoutes.js
- [ ] Importar middlewares de segurança
- [ ] Importar `validateProduto`
- [ ] Sanitizar nomes de arquivos no multer (imagens e XML)
- [ ] Adicionar validações na rota `POST /`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `validateProduto`
- [ ] Adicionar validações na rota `GET /`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `PUT /:id`
  - [ ] `validateHttpMethod(['PUT'])`
  - [ ] `validateRouteParams`
  - [ ] `validateProduto`
- [ ] Adicionar validações na rota `PUT /:id/status`
  - [ ] `validateHttpMethod(['PUT'])`
  - [ ] `validateRouteParams`
- [ ] Adicionar validações na rota `GET /admin`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `POST /increment-stock`
  - [ ] `validateHttpMethod(['POST'])`
- [ ] Adicionar validações na rota `POST /import-nfe`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(10, 60)`
- [ ] Adicionar validações na rota `GET /temp-products`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `DELETE /temp-products/:id`
  - [ ] `validateHttpMethod(['DELETE'])`
  - [ ] `validateRouteParams`

**Arquivo:** `backend/routes/produtosRoutes.js`  
**Tempo estimado:** 20 minutos

---

### 3.3 Atualizar pedidoRoutes.js
- [ ] Importar middlewares de segurança
- [ ] Importar `validatePedido`
- [ ] Adicionar validações na rota `GET /status-loja`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `POST /pedidos`
  - [ ] `validateHttpMethod(['POST'])`
  - [ ] `createRouteRateLimit(30, 60)`
  - [ ] `validatePedido`
- [ ] Adicionar validações na rota `GET /pedidos`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `GET /pedidos/usuario`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `PUT /pedidos/:id`
  - [ ] `validateHttpMethod(['PUT'])`
  - [ ] `validateRouteParams`
- [ ] Adicionar validações na rota `GET /pedidos/:id`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `validateRouteParams`

**Arquivo:** `backend/routes/pedidoRoutes.js`  
**Tempo estimado:** 15 minutos

---

### 3.4 Atualizar perfilRoutes.js
- [ ] Importar middlewares de segurança
- [ ] Importar `validatePerfil`
- [ ] Adicionar validações na rota `GET /`
  - [ ] `validateHttpMethod(['GET'])`
- [ ] Adicionar validações na rota `PUT /`
  - [ ] `validateHttpMethod(['PUT'])`
  - [ ] `validatePerfil`

**Arquivo:** `backend/routes/perfilRoutes.js`  
**Tempo estimado:** 10 minutos

---

### 3.5 Atualizar relatorioRoutes.js
- [ ] Importar middlewares de segurança
- [ ] Importar `validateRelatorioParams`
- [ ] Criar rate limiter para relatórios `createRouteRateLimit(20, 60)`
- [ ] Adicionar validações na rota `GET /vendas`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `relatorioRateLimit`
  - [ ] `validateRelatorioParams`
- [ ] Adicionar validações na rota `GET /produtos`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `relatorioRateLimit`
  - [ ] `validateRelatorioParams`
- [ ] Adicionar validações na rota `GET /usuarios`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `relatorioRateLimit`
  - [ ] `validateRelatorioParams`
- [ ] Adicionar validações na rota `GET /categorias`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `relatorioRateLimit`
  - [ ] `validateRelatorioParams`
- [ ] Adicionar validações na rota `GET /taxa-cancelamento`
  - [ ] `validateHttpMethod(['GET'])`
  - [ ] `relatorioRateLimit`
  - [ ] `validateRelatorioParams`

**Arquivo:** `backend/routes/relatorioRoutes.js`  
**Tempo estimado:** 15 minutos

---

## ✅ FASE 4: Atualização do Frontend

### 4.1 Criar Arquivo de Configuração de API (Opcional mas Recomendado)
- [ ] Criar arquivo `frontend/js/config/api.js` ou `frontend/js/utils/api.js`
- [ ] Definir `API_BASE_URL`
- [ ] Definir objeto `API_ENDPOINTS` com todas as rotas
- [ ] Criar função `buildUrl(path)`
- [ ] Criar função `apiRequest(endpoint, options)` para requisições padronizadas
- [ ] Adicionar tratamento de erros genérico
- [ ] Adicionar interceptor de token automático

**Arquivo:** `frontend/js/config/api.js`  
**Tempo estimado:** 20 minutos

---

### 4.2 Atualizar URLs no Frontend - Perfil
- [ ] Abrir arquivo `adminProfile.js` (ou similar)
- [ ] Buscar por `http://localhost:3000/perfil`
- [ ] Substituir por `http://localhost:3000/api/perfil`
- [ ] Verificar requisições GET (linha ~268)
- [ ] Verificar requisições PUT (atualização de perfil)
- [ ] Testar carregamento de perfil
- [ ] Testar atualização de perfil

**Arquivos afetados:**
- `frontend/js/adminProfile.js`
- `frontend/js/userProfile.js` (se existir)

**Tempo estimado:** 10 minutos

---

### 4.3 Atualizar URLs no Frontend - Produtos
- [ ] Abrir arquivos relacionados a produtos
- [ ] Buscar por `http://localhost:3000/produtos`
- [ ] Substituir por `http://localhost:3000/api/produtos`
- [ ] Verificar listagem de produtos (GET /)
- [ ] Verificar criação de produtos (POST /)
- [ ] Verificar atualização de produtos (PUT /:id)
- [ ] Verificar alteração de status (PUT /:id/status)
- [ ] Verificar incremento de estoque (POST /increment-stock)
- [ ] Verificar importação de NFe (POST /import-nfe)
- [ ] Verificar produtos temporários (GET /temp-products)
- [ ] Testar todas as operações

**Arquivos afetados:**
- `frontend/js/adminProdutos.js`
- `frontend/js/shop.js` ou `produtos.js`
- `frontend/js/carrinho.js` (se fizer requisições de produtos)

**Tempo estimado:** 15 minutos

---

### 4.4 Atualizar URLs no Frontend - Pedidos
- [ ] Abrir arquivos relacionados a pedidos
- [ ] Verificar se já usam `/api/pedidos` (provavelmente já correto)
- [ ] Se não, buscar por `http://localhost:3000/pedidos`
- [ ] Substituir por `http://localhost:3000/api/pedidos`
- [ ] Verificar status da loja (GET /status-loja)
- [ ] Verificar criação de pedido (POST /pedidos)
- [ ] Verificar listagem de pedidos (GET /pedidos)
- [ ] Verificar pedidos do usuário (GET /pedidos/usuario)
- [ ] Verificar detalhes do pedido (GET /pedidos/:id)
- [ ] Verificar atualização de status (PUT /pedidos/:id)
- [ ] Testar todas as operações

**Arquivos afetados:**
- `frontend/js/adminPedidos.js`
- `frontend/js/checkout.js` ou `carrinho.js`
- `frontend/js/meusPedidos.js` (se existir)

**Tempo estimado:** 10 minutos

---

### 4.5 Atualizar URLs no Frontend - Relatórios
- [ ] Abrir arquivos relacionados a relatórios
- [ ] Buscar por `http://localhost:3000/relatorios`
- [ ] Substituir por `http://localhost:3000/api/relatorios`
- [ ] Verificar relatório de vendas (GET /vendas)
- [ ] Verificar relatório de produtos (GET /produtos)
- [ ] Verificar relatório de usuários (GET /usuarios)
- [ ] Verificar relatório de categorias (GET /categorias)
- [ ] Verificar taxa de cancelamento (GET /taxa-cancelamento)
- [ ] Testar todos os relatórios

**Arquivos afetados:**
- `frontend/js/adminRelatorios.js`
- `frontend/js/dashboard.js` (se houver)

**Tempo estimado:** 10 minutos

---

### 4.6 Busca Global no Frontend
- [ ] Usar `Ctrl+Shift+F` (VS Code) ou busca global do editor
- [ ] Buscar: `"http://localhost:3000/perfil"`
- [ ] Buscar: `"http://localhost:3000/produtos"`
- [ ] Buscar: `"http://localhost:3000/relatorios"`
- [ ] Buscar: `'/perfil'` (sem http, casos com variável de base URL)
- [ ] Buscar: `'/produtos'` (sem http)
- [ ] Buscar: `'/relatorios'` (sem http)
- [ ] Verificar se todas as ocorrências foram corrigidas

**Tempo estimado:** 15 minutos

---

## ✅ FASE 5: Testes

### 5.1 Testes de Backend - Segurança
- [ ] Reiniciar servidor backend
- [ ] Verificar logs de inicialização (sem erros)
- [ ] Testar tentativa de SQL Injection em query string
  - `GET /api/pedidos?status=concluido' OR 1=1--`
  - Deve retornar 400 com "Parâmetros inválidos"
- [ ] Testar tentativa de Path Traversal
  - `GET /uploads/../../../etc/passwd`
  - Deve retornar 400 com "Requisição inválida"
- [ ] Testar método HTTP não permitido
  - `DELETE /api/perfil`
  - Deve retornar 405 com "Método não permitido"
- [ ] Testar ID inválido na URL
  - `GET /api/pedidos/abc123`
  - Deve retornar 400 com "ID inválido"
- [ ] Testar rota não existente
  - `GET /api/rota-inexistente`
  - Deve retornar 404 com "Rota não encontrada"
- [ ] Verificar logs de atividades suspeitas

**Tempo estimado:** 20 minutos

---

### 5.2 Testes de Backend - Rate Limiting
- [ ] Testar rate limit em login (10 tentativas em 15min)
  - Fazer 11 requisições de login
  - 11ª deve retornar 429 "Muitas requisições"
- [ ] Testar rate limit em registro (5 tentativas em 15min)
  - Fazer 6 requisições de registro
  - 6ª deve retornar 429
- [ ] Testar rate limit em recuperação de senha (3 tentativas em 60min)
  - Fazer 4 requisições
  - 4ª deve retornar 429
- [ ] Testar rate limit em criação de pedidos (30 em 60min)
- [ ] Testar rate limit em relatórios (20 em 60min)
- [ ] Aguardar janela de tempo e testar reset automático

**Tempo estimado:** 25 minutos

---

### 5.3 Testes de Backend - Validação de Inputs
- [ ] Testar registro com username inválido
  - Username com 2 caracteres → deve retornar 400
  - Username com caracteres especiais → deve retornar 400
- [ ] Testar registro com email inválido
  - Email sem @ → deve retornar 400
- [ ] Testar registro com senha fraca
  - Senha com 7 caracteres → deve retornar 400
  - Senha sem maiúscula → deve retornar 400
  - Senha sem número → deve retornar 400
- [ ] Testar criação de pedido com dados inválidos
  - Sem itens → deve retornar 400
  - Com mais de 50 itens → deve retornar 400
  - Endereço incompleto → deve retornar 400
  - UF com mais de 2 letras → deve retornar 400
- [ ] Testar criação de produto com dados inválidos
  - Título com 2 caracteres → deve retornar 400
  - Preço negativo → deve retornar 400
  - Categoria inválida → deve retornar 400
  - Barcode com 12 dígitos → deve retornar 400
- [ ] Testar atualização de perfil com dados inválidos
  - CPF formato errado → deve retornar 400
  - Idade menor que 18 → deve retornar 400
  - Campos vazios → deve retornar 400

**Tempo estimado:** 30 minutos

---

### 5.4 Testes de Frontend - Perfil
- [ ] Fazer login como usuário comum
- [ ] Acessar página de perfil
- [ ] Verificar se dados carregam corretamente
- [ ] Atualizar dados do perfil
- [ ] Verificar se atualização foi bem-sucedida
- [ ] Verificar console do navegador (sem erros 404)
- [ ] Fazer login como admin
- [ ] Repetir testes acima

**Tempo estimado:** 10 minutos

---

### 5.5 Testes de Frontend - Produtos
- [ ] Acessar página de produtos (usuário comum)
- [ ] Verificar se produtos carregam corretamente
- [ ] Fazer login como admin
- [ ] Acessar painel de produtos
- [ ] Criar novo produto
- [ ] Editar produto existente
- [ ] Alterar status de produto
- [ ] Incrementar estoque
- [ ] Importar NFe (se disponível)
- [ ] Verificar produtos temporários (se houver)
- [ ] Verificar console do navegador (sem erros 404)

**Tempo estimado:** 15 minutos

---

### 5.6 Testes de Frontend - Pedidos
- [ ] Fazer login como usuário comum
- [ ] Adicionar produtos ao carrinho
- [ ] Verificar status da loja
- [ ] Finalizar pedido
- [ ] Verificar se pedido foi criado
- [ ] Acessar "Meus Pedidos"
- [ ] Ver detalhes de um pedido
- [ ] Fazer login como admin
- [ ] Acessar painel de pedidos
- [ ] Filtrar pedidos
- [ ] Atualizar status de um pedido
- [ ] Verificar console do navegador (sem erros 404)

**Tempo estimado:** 15 minutos

---

### 5.7 Testes de Frontend - Relatórios
- [ ] Fazer login como admin
- [ ] Acessar página de relatórios
- [ ] Gerar relatório de vendas
  - Testar período diário
  - Testar período mensal
  - Testar período anual
- [ ] Gerar relatório de produtos mais vendidos
- [ ] Gerar relatório de usuários que mais compraram
- [ ] Gerar relatório de desempenho por categoria
- [ ] Gerar relatório de taxa de cancelamento
- [ ] Testar com datas inválidas (deve mostrar erro)
- [ ] Testar com período maior que 1 ano (deve mostrar erro)
- [ ] Verificar console do navegador (sem erros 404)

**Tempo estimado:** 15 minutos

---

### 5.8 Testes de Integração - Fluxo Completo
- [ ] Registrar novo usuário
- [ ] Fazer login
- [ ] Completar perfil
- [ ] Navegar pelos produtos
- [ ] Adicionar produtos ao carrinho
- [ ] Criar pedido
- [ ] Verificar pedido criado
- [ ] Fazer login como admin
- [ ] Ver pedido no painel admin
- [ ] Atualizar status do pedido
- [ ] Gerar relatórios com o pedido
- [ ] Verificar logs do backend
- [ ] Verificar que não há erros 404

**Tempo estimado:** 20 minutos

---

## ✅ FASE 6: Documentação e Deploy

### 6.1 Atualizar Documentação
- [ ] Criar ou atualizar `README.md` com novas features de segurança
- [ ] Documentar novos middlewares
- [ ] Documentar rate limits por rota
- [ ] Documentar estrutura de validação
- [ ] Adicionar exemplos de requisições
- [ ] Adicionar troubleshooting comum

**Tempo estimado:** 30 minutos

---

### 6.2 Atualizar Variáveis de Ambiente
- [ ] Revisar arquivo `.env`
- [ ] Adicionar comentários sobre novas configurações
- [ ] Verificar `JWT_SECRET` (mínimo 32 caracteres)
- [ ] Verificar `RECAPTCHA_SECRET_KEY`
- [ ] Verificar `CORS_ORIGINS` (sem trailing slash)
- [ ] Verificar `RATE_LIMIT_WINDOW_MS`
- [ ] Verificar `RATE_LIMIT_MAX_REQUESTS`
- [ ] Verificar `NODE_ENV` (development/production)
- [ ] Criar `.env.example` para referência

**Arquivo:** `backend/.env`  
**Tempo estimado:** 10 minutos

---

### 6.3 Preparar para Deploy
- [ ] Verificar que `NODE_ENV=production` em produção
- [ ] Verificar que logs não expõem informações sensíveis
- [ ] Configurar logging em arquivo (opcional)
- [ ] Configurar HTTPS (certificado SSL)
- [ ] Atualizar `CORS_ORIGINS` com domínio de produção
- [ ] Testar com domínio de produção
- [ ] Configurar firewall/security groups
- [ ] Configurar backup automático do banco
- [ ] Documentar processo de deploy

**Tempo estimado:** Variável (depende da infraestrutura)

---

### 6.4 Monitoramento Pós-Deploy
- [ ] Configurar sistema de alertas (opcional)
- [ ] Monitorar logs por 24h após deploy
- [ ] Verificar rate limit não está bloqueando usuários legítimos
- [ ] Verificar performance (tempo de resposta)
- [ ] Verificar uso de memória/CPU
- [ ] Coletar feedback de usuários
- [ ] Ajustar rate limits se necessário

**Tempo estimado:** Monitoramento contínuo

---

## 📊 Resumo de Tempo Estimado

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Criação dos Arquivos de Segurança | 55 min |
| 2 | Atualização do Server.js | 30 min |
| 3 | Atualização das Rotas | 75 min |
| 4 | Atualização do Frontend | 80 min |
| 5 | Testes | 150 min |
| 6 | Documentação e Deploy | 40 min + variável |
| **TOTAL** | **~7-8 horas** (sem incluir deploy) |

---

## 🎯 Checklist Rápido (Resumo)

### Backend
- [ ] ✅ Criar `middlewares/routeSecurity.js`
- [ ] ✅ Criar `middlewares/inputValidation.js`
- [ ] ✅ Criar `config/security.js`
- [ ] ✅ Atualizar `server.js`
- [ ] ✅ Atualizar `routes/authRoutes.js`
- [ ] ✅ Atualizar `routes/produtosRoutes.js`
- [ ] ✅ Atualizar `routes/pedidoRoutes.js`
- [ ] ✅ Atualizar `routes/perfilRoutes.js`
- [ ] ✅ Atualizar `routes/relatorioRoutes.js`

### Frontend
- [ ] ✅ Corrigir `/perfil` → `/api/perfil`
- [ ] ✅ Corrigir `/produtos` → `/api/produtos`
- [ ] ✅ Corrigir `/relatorios` → `/api/relatorios`
- [ ] ✅ Criar `config/api.js` (opcional)

### Testes
- [ ] ✅ Testar segurança (SQL Injection, Path Traversal, etc)
- [ ] ✅ Testar rate limiting
- [ ] ✅ Testar validações
- [ ] ✅ Testar frontend (perfil, produtos, pedidos, relatórios)
- [ ] ✅ Testar fluxo completo

### Deploy
- [ ] ✅ Atualizar `.env`
- [ ] ✅ Documentar mudanças
- [ ] ✅ Fazer deploy
- [ ] ✅ Monitorar

---

## 🚨 Problemas Conhecidos e Soluções

### Erro 404 em /perfil
**Problema:** Frontend fazendo requisição para `/perfil` mas backend espera `/api/perfil`  
**Solução:** Atualizar todas as URLs do frontend conforme Fase 4

### Rate Limit Bloqueando Usuários Legítimos
**Problema:** Rate limit muito restritivo  
**Solução:** Ajustar valores em `config/security.js` ou nas rotas específicas

### Headers CORS Bloqueando Requis