# 🛒 QRUP Backend - Sistema de Gerenciamento

## 📋 Descrição

Backend da aplicação QRUP - Sistema completo de gerenciamento de produtos, pedidos, perfis e relatórios.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL2** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **Multer** - Upload de arquivos
- **Nodemailer** - Envio de emails
- **Jest** - Testes automatizados

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
copy .env.example .env

# Edite o arquivo .env com suas credenciais
```

### 4. Configure o banco de dados

```bash
# Execute o script SQL para criar as tabelas
mysql -u root -p qrup < ../qrup.sql
```

## ⚙️ Configuração

### Arquivo .env

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=qrup
DB_PORT=3306

# JWT
JWT_SECRET=seu_secret_jwt_forte

# Email
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
```

## 🏃 Como Executar

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

### Executar Testes

```bash
# Executar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com coverage
npm run test:coverage
```

## 📁 Estrutura do Projeto

```
backend/
├── config/
│   └── db.js              # Configuração do MySQL
├── controllers/
│   ├── authController.js
│   ├── pedidoController.js
│   ├── perfilController.js
│   ├── produtoController.js
│   └── relatorioController.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── pedidoModels.js
│   ├── perfilModel.js
│   ├── produtoModels.js
│   └── relatorioModels.js
├── routes/
│   ├── authRoutes.js
│   ├── pedidoRoutes.js
│   ├── perfilRoutes.js
│   ├── produtosRoutes.js
│   └── relatorioRoutes.js
├── utils/
│   ├── email.js
│   └── upload.js
├── __tests__/
│   ├── ean13.test.js
│   ├── produto-validation.test.js
│   └── validation.test.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT
- ✅ Rate limiting contra ataques DDoS
- ✅ CORS configurado
- ✅ Validação de dados com Joi
- ✅ Variáveis de ambiente protegidas

## 📊 Endpoints Principais

### Autenticação

- `POST /api/login` - Login de usuário
- `POST /api/register` - Registro de usuário
- `POST /api/forgot-password` - Recuperação de senha

### Produtos

- `GET /produtos` - Listar produtos
- `POST /produtos` - Criar produto
- `PUT /produtos/:id` - Atualizar produto
- `DELETE /produtos/:id` - Deletar produto

### Pedidos

- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Criar pedido
- `PUT /api/pedidos/:id` - Atualizar pedido

### Perfil

- `GET /perfil` - Obter perfil
- `PUT /perfil` - Atualizar perfil

### Relatórios

- `GET /relatorios` - Gerar relatórios

## 🧪 Testes

O projeto possui cobertura de testes para:

- ✅ Validação de EAN13
- ✅ Validação de produtos
- ✅ Validações gerais

Execute os testes com:

```bash
npm test
```

## 📝 Melhorias Futuras

- [ ] Implementar Redis para cache
- [ ] Adicionar Docker
- [ ] Implementar WebSocket para tempo real
- [ ] CI/CD com GitHub Actions
- [ ] Documentação Swagger/OpenAPI
- [ ] Logs estruturados com Winston

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

ISC

## 🆘 Suporte

Para suporte, envie um email para qrupsuporte@gmail.com

---

Desenvolvido com ❤️ pela equipe QRUP
