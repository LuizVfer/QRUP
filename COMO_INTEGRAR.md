# API de NF-e — Guia de Integração

## O que você vai ter após a integração

```
POST   /api/nfe/importar          → Importa XML, salva histórico, atualiza estoque
GET    /api/nfe                   → Lista todas as NF-es (com filtros e paginação)
GET    /api/nfe/estatisticas      → Números gerais (total de notas, valores, etc.)
GET    /api/nfe/:id               → Detalha uma NF-e com todos os seus itens
GET    /api/nfe/:id/divergencias  → Itens com preço diferente do cadastrado
```

---

## Passo 1 — Criar as tabelas no banco

Execute o arquivo `nfe_tabelas.sql` no seu MySQL:

```bash
mysql -u root -p qrup < nfe_tabelas.sql
```

Ou abra o arquivo no MySQL Workbench e execute.

---

## Passo 2 — Copiar os arquivos para o projeto

```
nfeModel.js      → src/models/nfeModel.js
nfeController.js → src/controllers/nfeController.js
nfeRoutes.js     → src/routes/nfeRoutes.js
```

---

## Passo 3 — Registrar a rota no server.js

Abra seu `server.js` e adicione **junto com as outras rotas**:

```js
// Rotas existentes (já estão lá)
app.use('/api', authRoutes);
app.use('/produtos', produtosRoutes);
app.use('/perfil', perfilRoutes);
app.use('/api', pedidoRoutes);
app.use('/relatorios', relatorioRoutes);

// ↓ ADICIONAR ISSO ↓
const nfeRoutes = require('./routes/nfeRoutes');
app.use('/api/nfe', nfeRoutes);
```

---

## Passo 4 — Testar com seu arquivo XML de teste

Use o Postman, Insomnia ou curl:

### Importar uma NF-e
```
POST http://localhost:3000/api/nfe/importar
Headers:
  Authorization: Bearer <seu_token_admin>
Body: form-data
  arquivo_nfe: [selecionar o arquivo teste-nfe.xml]
```

### Listar NF-es importadas
```
GET http://localhost:3000/api/nfe
Headers:
  Authorization: Bearer <seu_token_admin>
```

### Ver detalhes de uma nota
```
GET http://localhost:3000/api/nfe/1
Headers:
  Authorization: Bearer <seu_token_admin>
```

### Ver divergências de preço
```
GET http://localhost:3000/api/nfe/1/divergencias
Headers:
  Authorization: Bearer <seu_token_admin>
```

### Ver estatísticas gerais
```
GET http://localhost:3000/api/nfe/estatisticas
Headers:
  Authorization: Bearer <seu_token_admin>
```

---

## O que acontece quando você importa uma NF-e

```
XML enviado
    │
    ▼
Parser XML
(extrai número da nota, emitente, data, itens)
    │
    ▼
Verifica duplicata
(mesmo número_nf + cnpj_emitente já foi importado?)
    │ não
    ▼
Para cada produto:
  ├── barcode encontrado em "produtos"?
  │       ├── SIM → atualiza quantidade_estoque
  │       │         salva item com status "atualizado"
  │       └── NÃO → insere em "produtos_temporarios"
  │                 salva item com status "temporario"
    │
    ▼
Salva em "notas_fiscais" (histórico)
Salva em "itens_nfe" (todos os produtos da nota)
    │
    ▼
Retorna JSON com o resumo
```

---

## Exemplo de resposta ao importar

```json
{
  "message": "NF-e importada com sucesso!",
  "nota_fiscal_id": 1,
  "numero_nf": "123456",
  "emitente": "Empresa Exemplo LTDA",
  "data_emissao": "2025-07-10T13:00:00.000Z",
  "valor_total": 509.90,
  "total_itens": 10,
  "itens_atualizados": 5,
  "itens_temporarios": 5,
  "status": "parcial"
}
```

---

## Diferença do import que já existia

| Antes (import-nfe existente) | Agora (nova API) |
|------------------------------|------------------|
| Processa o XML | Processa o XML |
| Atualiza estoque | Atualiza estoque |
| Manda para temp | Manda para temp |
| ❌ Sem histórico | ✅ Salva histórico completo |
| ❌ Sem rastreio | ✅ Sabe quem importou e quando |
| ❌ Sem divergências | ✅ Detecta preços diferentes |
| ❌ Sem consulta | ✅ Pode consultar qualquer nota depois |
| ❌ Sem estatísticas | ✅ Dashboard de importações |

---

## Próximos passos (para implementar depois do dia 19)

1. **Tela de histórico de NF-es** no frontend admin
2. **Alertas de divergência** — notificar quando preço da nota divergir muito
3. **Aprovar produto temporário** direto da tela de detalhe da nota
4. **Filtro por fornecedor** (CNPJ) para acompanhar entregas por emitente
