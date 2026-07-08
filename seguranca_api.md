# 🔒 Segurança da API — QRUP

Documentação completa das camadas de segurança implementadas no backend do sistema QRUP.

---

## 1. 🔐 Autenticação — JWT (JSON Web Token)

**Arquivo:** `middlewares/authMiddleware.js`

Todas as rotas protegidas exigem um token JWT válido no header da requisição.

```
Authorization: Bearer <token>
```

- Token gerado no login com validade de **24 horas**
- Assinado com chave secreta armazenada no `.env` (`JWT_SECRET`)
- Verificado em cada requisição antes de chegar ao controller
- Token inválido ou expirado retorna **HTTP 401**

---

## 2. 👑 Autorização por Papel (Role-Based Access Control)

**Arquivo:** `middlewares/authMiddleware.js`

O sistema possui dois níveis de acesso:

| Role  | Permissões |
|-------|-----------|
| `user` | Catálogo, perfil, pedidos próprios |
| `admin` | Tudo acima + gerenciar produtos, pedidos, relatórios, NF-e |

- Rotas administrativas exigem `isAdmin` além do `authMiddleware`
- Tentativa de acesso sem permissão retorna **HTTP 403**

---

## 3. 🤖 Google reCAPTCHA v2

**Arquivos:** `frontend/login.js` + `controllers/authController.js`

Proteção anti-bot no login:

- Widget reCAPTCHA renderizado no frontend antes do envio
- Token gerado pelo Google é enviado junto com email e senha
- Backend valida o token na API do Google (`/recaptcha/api/siteverify`)
- Login bloqueado se a validação falhar

---

## 4. 🔑 Hash de Senhas com bcrypt

**Arquivo:** `controllers/authController.js`

Senhas nunca são armazenadas em texto puro:

- Criptografadas com **bcrypt** (salt de 10 rounds) antes de salvar no banco
- Comparação feita com `bcrypt.compare()` no login
- Mesmo que o banco seja comprometido, as senhas não são legíveis

---

## 5. ⏱️ Rate Limiting (Limite de Requisições)

**Arquivo:** `middlewares/routeSecurity.js`

Proteção contra ataques de força bruta e abuso:

| Rota | Limite |
|------|--------|
| `POST /api/registro` | 5 tentativas a cada 15 min |
| `POST /api/login` | 10 tentativas a cada 15 min |
| `POST /api/solicitar-recuperacao` | 3 tentativas por hora |
| `POST /api/pedidos` | 30 pedidos por hora |
| `POST /produtos/import-nfe` | 10 importações por hora |

- Exceder o limite retorna **HTTP 429** com tempo de espera
- Contagem por IP + rota
- Registros expirados são limpos automaticamente a cada 5 minutos

---

## 6. ✅ Validação de Dados de Entrada

**Arquivo:** `middlewares/inputValidation.js`

Todos os dados recebidos são validados antes de chegar ao banco:

### Usuário
- Username: 3–50 caracteres, apenas letras, números, `_` e `-`
- Email: formato válido, máximo 100 caracteres
- Senha: mínimo 8 caracteres, com maiúscula, minúscula e número

### Produto
- Título: 3–100 caracteres
- Preço: número positivo, máximo R$ 999.999,99
- Categoria: apenas `bebidas`, `alimentos` ou `outros`
- Barcode: EAN-13 com 13 dígitos e checksum válido
- Estoque: inteiro não negativo, máximo 999.999

### Pedido
- Máximo de 50 itens por pedido
- Quantidade máxima por item: 1.000
- Endereço completo obrigatório com UF em 2 letras maiúsculas

### Perfil
- CPF no formato `xxx.xxx.xxx-xx`
- Idade mínima de 18 anos
- UF com exatamente 2 letras maiúsculas

---

## 7. 🛡️ Validação Extra com Joi

**Arquivo:** `controllers/produtoController.js`

Camada adicional de validação com a biblioteca **Joi** nas rotas de produto:

- Valida tipo, tamanho e formato de cada campo
- Mensagens de erro detalhadas e em português
- Validação customizada do checksum EAN-13

---

## 8. 🚫 Prevenção de SQL Injection

**Arquivos:** `models/*.js` + `middlewares/routeSecurity.js`

Dupla proteção:

- Todas as queries usam **prepared statements** com `?` (parâmetros separados)
- Middleware `sanitizeQueryParams` detecta e bloqueia padrões suspeitos como `SELECT`, `DROP`, `UNION`, `--`, `;`
- Requisição bloqueada com **HTTP 400** se padrão suspeito for encontrado

---

## 9. 🌐 Prevenção de XSS e Path Traversal

**Arquivo:** `middlewares/routeSecurity.js`

- Detecta tentativas de XSS: `<script>`, `javascript:`, `on*=`
- Detecta Path Traversal: `../`, `..\`, `%2e%2e`
- Requisição bloqueada com log de alerta no servidor
- Headers de segurança via `security.js`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self' ...
```

---

## 10. 📁 Segurança no Upload de Arquivos

**Arquivo:** `routes/produtosRoutes.js`

### Imagens de produtos
- Tipos permitidos: `.jpg`, `.jpeg`, `.png`, `.webp`
- Tamanho máximo: **5MB**
- Nome sanitizado: apenas caracteres seguros

### XML de NF-e
- Tipo permitido: apenas `.xml`
- Tamanho máximo: **10MB**
- Nome sanitizado com remoção de acentos e caracteres especiais
- Arquivo **deletado do servidor** imediatamente após o processamento

---

## 11. 📄 Segurança Específica da Importação de NF-e

**Arquivo:** `controllers/produtoController.js`

Quatro camadas de proteção exclusivas para a importação de notas fiscais:

### 11.1 Validação do Conteúdo do XML
Verifica se o XML é realmente uma NF-e antes de processar, checando campos obrigatórios: `ide`, `emit`, `dest`, `det` e `total`.

### 11.2 Sanitização do Nome do Arquivo
Remove acentos, caracteres especiais e previne path traversal (`../`). Nome limitado a 100 caracteres.

### 11.3 Log de Auditoria
Toda importação é registrada na tabela `logs_importacao_nfe` com:
- ID do admin que importou
- Data e hora
- Chave de acesso da nota
- Quantidade de itens atualizados, pendentes e com erro
- Detalhes completos em JSON

### 11.4 Prevenção de Importação Duplicada
Extrai a chave de acesso de 44 dígitos da NF-e e verifica se já foi importada anteriormente. Se sim, bloqueia com a data da importação anterior (**HTTP 409**).

---

## 12. 🔄 Proteção das Rotas no Frontend

**Arquivo:** `frontend/authGuard.js`

Proteção client-side em todas as páginas:

- Página oculta instantaneamente até validação ser concluída (evita flash de conteúdo)
- Token verificado localmente (expiração JWT)
- Token validado com o servidor em background
- Sessão monitorada: logout em outra aba encerra sessão em todas
- Redirecionamento automático para login se token inválido ou expirado
- Intercepção de cliques em links para rotas protegidas

---

## 13. 🔒 Validação de Métodos HTTP

**Arquivo:** `middlewares/routeSecurity.js`

Cada rota aceita apenas os métodos HTTP corretos:

- Método não permitido retorna **HTTP 405** com lista dos métodos aceitos
- Evita uso indevido de verbos HTTP (ex: DELETE em rota de GET)

---

## 14. 📦 Limite de Tamanho do Body

**Arquivo:** `middlewares/routeSecurity.js`

| Tipo | Limite |
|------|--------|
| Padrão | 1MB |
| Upload de imagem | 5MB |
| Upload de XML | 10MB |

- Requisição acima do limite retorna **HTTP 413**

---

## 15. 📧 Recuperação de Senha Segura

**Arquivo:** `controllers/authController.js`

- Código de 6 dígitos gerado aleatoriamente
- Expira em **10 minutos**
- Armazenado apenas em memória (não vai ao banco)
- Códigos expirados limpos automaticamente a cada 10 minutos
- Validação em 3 etapas: e-mail → código → nova senha

---

## 16. 🔗 CORS Configurado

**Arquivo:** `config/security.js`

- Apenas origens autorizadas podem consumir a API
- Credenciais habilitadas (`credentials: true`)
- Cache de preflight de **24 horas** (`maxAge: 86400`)

---

## Resumo Geral

| Camada | Tecnologia | Onde |
|--------|-----------|------|
| Autenticação | JWT | `authMiddleware.js` |
| Autorização | RBAC (roles) | `authMiddleware.js` |
| Anti-bot | reCAPTCHA v2 | `login.js` + `authController.js` |
| Senhas | bcrypt | `authController.js` |
| Brute force | Rate Limiting | `routeSecurity.js` |
| Dados inválidos | Joi + validação manual | `inputValidation.js` |
| SQL Injection | Prepared Statements | Todos os models |
| XSS / Traversal | Sanitização + Headers | `routeSecurity.js` |
| Arquivos | Multer + filtros | `produtosRoutes.js` |
| NF-e duplicada | Chave de acesso única | `produtoController.js` |
| Auditoria | Logs no banco | `produtoModels.js` |
| Frontend | authGuard | `authGuard.js` |
