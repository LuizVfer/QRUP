# 📄 Mudanças na API de Nota Fiscal Eletrônica (NF-e) — QRUP

> Documentação das implementações e alterações realizadas na API de NF-e do sistema QRUP.

---

## 1. Visão Geral

A API de NF-e foi **criada do zero** como um módulo dedicado, separado da API de produtos. Antes, não havia nenhum endpoint específico para importação e gerenciamento de notas fiscais. A nova estrutura cobre todo o ciclo de vida de uma NF-e dentro do sistema.

---

## 2. Novos Arquivos Criados

| Arquivo                                | Descrição                                                |
| -------------------------------------- | -------------------------------------------------------- |
| `backend/controllers/nfeController.js` | Lógica de negócio de todos os endpoints NF-e             |
| `backend/models/nfeModel.js`           | Queries SQL relacionadas a NF-e                          |
| `backend/routes/nfeRoutes.js`          | Definição e proteção das rotas                           |
| `nfe_tabelas.sql`                      | Script de criação das tabelas no banco                   |
| `nfe_seguranca.sql`                    | Script das tabelas de auditoria e controle de duplicatas |

---

## 3. Novos Endpoints

### 3.1 Importação

| Método | Rota                | Descrição                                      |
| ------ | ------------------- | ---------------------------------------------- |
| `POST` | `/api/nfe/importar` | Faz o upload e processa um arquivo XML de NF-e |

- Recebe o arquivo via `multipart/form-data` (campo `arquivo_nfe`)
- Valida e faz o parse do XML usando `xml2js`
- Atualiza o estoque dos produtos encontrados no catálogo
- Manda para `produtos_temporarios` os itens sem cadastro
- Detecta divergências de preço entre a nota e o sistema
- Remove o arquivo do servidor imediatamente após o processamento
- Retorna status `processada`, `parcial` ou `erro`

### 3.2 Consulta de Notas

| Método | Rota               | Descrição                                         |
| ------ | ------------------ | ------------------------------------------------- |
| `GET`  | `/api/nfe`         | Lista todas as NF-es com paginação e filtros      |
| `GET`  | `/api/nfe/:id`     | Retorna uma NF-e completa com todos os seus itens |
| `GET`  | `/api/nfe/:id/xml` | Faz o download do XML original da nota            |

**Filtros disponíveis na listagem (`GET /api/nfe`):**

| Parâmetro       | Tipo         | Descrição                         |
| --------------- | ------------ | --------------------------------- |
| `page`          | número       | Página atual (padrão: 1)          |
| `limit`         | número       | Itens por página (padrão: 10)     |
| `dataInicio`    | `YYYY-MM-DD` | Filtra a partir desta data        |
| `dataFim`       | `YYYY-MM-DD` | Filtra até esta data              |
| `status`        | string       | `processada`, `parcial` ou `erro` |
| `cnpj_emitente` | string       | Filtra pelo CNPJ do emitente      |

### 3.3 Divergências de Preço

| Método | Rota                            | Descrição                                       |
| ------ | ------------------------------- | ----------------------------------------------- |
| `GET`  | `/api/nfe/:id/divergencias`     | Lista itens com preço diferente do cadastrado   |
| `POST` | `/api/nfe/:id/atualizar-precos` | Atualiza os preços do catálogo com base na nota |

- Divergência = `valor_unitario` da nota ≠ `preco` do produto no sistema
- A atualização de preços é feita em lote para todos os itens divergentes da nota

### 3.4 Produtos Temporários

| Método   | Rota                                        | Descrição                             |
| -------- | ------------------------------------------- | ------------------------------------- |
| `GET`    | `/api/nfe/produtos-temporarios`             | Lista produtos pendentes de aprovação |
| `POST`   | `/api/nfe/produtos-temporarios/:id/aprovar` | Aprova e cadastra no catálogo oficial |
| `DELETE` | `/api/nfe/produtos-temporarios/:id`         | Rejeita e remove da fila              |

- Produtos que chegam na NF-e mas não têm cadastro vão para a tabela `produtos_temporarios`
- O admin pode aprovar (informando `categoria` e `descricao`) ou rejeitar cada item

### 3.5 Estatísticas

| Método | Rota                    | Descrição                                          |
| ------ | ----------------------- | -------------------------------------------------- |
| `GET`  | `/api/nfe/estatisticas` | Retorna totais gerais de todas as NF-es importadas |

**Campos retornados:**

- `total_notas` — quantidade de notas importadas
- `valor_total_importado` — soma de todos os valores
- `total_itens_processados` — total de itens em todas as notas
- `total_atualizados` / `total_temporarios` — divisão por status de item
- `notas_ok` / `notas_parciais` / `notas_erro` — divisão por status de nota
- `ultima_importacao` — dados da nota mais recente

---

## 4. Novas Tabelas no Banco de Dados

### `notas_fiscais`

Armazena o cabeçalho de cada NF-e importada.

| Coluna          | Tipo         | Descrição                     |
| --------------- | ------------ | ----------------------------- | -------------------------------------------- |
| `id`            | INT PK       | ID interno                    |
| `numero_nf`     | VARCHAR(20)  | Número da nota fiscal         |
| `cnpj_emitente` | VARCHAR(18)  | CNPJ do emitente              |
| `nome_emitente` | VARCHAR(255) | Nome/razão social do emitente |
| `data_emissao`  | DATETIME     | Data de emissão da nota       | -- 1. Primeiro as tabelas principais da NF-e |

SOURCE nfe_tabelas.sql;

-- 2. Depois as tabelas de segurança/auditoria
SOURCE nfe_seguranca.sql;-- 1. Primeiro as tabelas principais da NF-e
SOURCE nfe_tabelas.sql;

-- 2. Depois as tabelas de segurança/auditoria
SOURCE nfe_seguranca.sql;-- 1. Primeiro as tabelas principais da NF-e
SOURCE nfe_tabelas.sql;

-- 2. Depois as tabelas de segurança/auditoria
SOURCE nfe_seguranca.sql;
| `valor_total` | DECIMAL(10,2) | Valor total calculado |
| `total_itens` | INT | Quantidade de itens na nota |
| `itens_atualizados` | INT | Itens que atualizaram estoque |
| `itens_temporarios` | INT | Itens enviados para temporários |
| `status` | ENUM | `processada`, `parcial`, `erro` |
| `xml_original` | LONGTEXT | XML bruto para download posterior |
| `importado_por` | INT FK | ID do admin que importou |

### `itens_nfe`

Armazena cada produto da nota, vinculado ao seu `nota_fiscal_id`.

| Coluna              | Tipo          | Descrição                                 |
| ------------------- | ------------- | ----------------------------------------- |
| `id`                | INT PK        | ID interno                                |
| `nota_fiscal_id`    | INT FK        | Referência à nota (CASCADE DELETE)        |
| `barcode`           | VARCHAR(50)   | Código EAN do produto                     |
| `nome_produto`      | VARCHAR(255)  | Nome conforme a nota                      |
| `quantidade`        | DECIMAL(10,3) | Quantidade informada                      |
| `valor_unitario`    | DECIMAL(10,2) | Preço unitário da nota                    |
| `valor_total_item`  | DECIMAL(10,2) | `quantidade × valor_unitario`             |
| `produto_id`        | INT FK        | Vínculo ao catálogo (nullable)            |
| `preco_cadastrado`  | DECIMAL(10,2) | Preço no sistema no ato da importação     |
| `divergencia_preco` | TINYINT(1)    | `1` se houve divergência                  |
| `status_item`       | ENUM          | `atualizado`, `temporario`, `sem_estoque` |

### `nfe_importadas` _(controle de duplicatas)_

Registra as chaves de acesso já importadas para evitar duplicatas.

| Coluna         | Tipo            | Descrição                   |
| -------------- | --------------- | --------------------------- |
| `id`           | INT PK          | ID interno                  |
| `chave_acesso` | CHAR(44) UNIQUE | Chave de 44 dígitos da NF-e |
| `admin_id`     | INT FK          | Admin que importou          |
| `importada_em` | DATETIME        | Data/hora da importação     |

### `logs_importacao_nfe` _(auditoria)_

Log completo de todas as importações realizadas.

| Coluna              | Tipo         | Descrição                       |
| ------------------- | ------------ | ------------------------------- |
| `id`                | INT PK       | ID interno                      |
| `admin_id`          | INT FK       | Admin responsável               |
| `chave_acesso`      | VARCHAR(50)  | Chave da NF-e                   |
| `nome_arquivo`      | VARCHAR(120) | Nome do arquivo enviado         |
| `total_itens`       | INT          | Total de itens processados      |
| `itens_atualizados` | INT          | Itens que atualizaram estoque   |
| `itens_pendentes`   | INT          | Itens enviados para temporários |
| `total_erros`       | INT          | Itens com erro                  |
| `detalhes`          | JSON         | Resultado completo em JSON      |
| `importado_em`      | DATETIME     | Data/hora do evento             |

---

## 5. Segurança Implementada

### 5.1 Controle de Acesso

- Todas as rotas exigem **JWT válido** (`authMiddleware`)
- Todas as rotas exigem perfil **admin** (`isAdmin`)
- Tentativa sem permissão retorna **HTTP 403**

### 5.2 Rate Limiting

- Endpoint de importação limitado a **10 requisições por hora** por IP
- Exceder o limite retorna **HTTP 429**

### 5.3 Validação do Arquivo

- Apenas arquivos `.xml` são aceitos (validação por extensão)
- Tamanho máximo de **5MB** por arquivo
- Arquivo deletado do servidor imediatamente após o processamento

### 5.4 Prevenção de Duplicatas

- Verifica `numero_nf` + `cnpj_emitente` antes de salvar
- Nota já existente retorna **HTTP 409** com o ID da nota original

### 5.5 Sanitização de Inputs

- Categoria de produto temporário validada contra lista branca: `bebidas`, `alimentos`, `outros`
- IDs de parâmetros convertidos com `parseInt` e validados antes do uso
- Todas as queries usam **prepared statements** com `?`

### 5.6 Log de Auditoria

- Toda importação registrada na tabela `logs_importacao_nfe`
- Dados registrados: admin, data/hora, arquivo, resultado completo em JSON

---

## 6. Lógica de Processamento do XML

```
Upload do XML
    ↓
Parse com xml2js (remove namespaces, mantém atributos)
    ↓
Extração do cabeçalho (número NF, CNPJ, emitente, data)
    ↓
Extração dos itens (det[] → barcode, nome, quantidade, valor)
    ↓
Verificação de duplicata (numero_nf + cnpj_emitente)
    ↓
Para cada produto:
  ├── Encontrado no catálogo → Atualiza estoque + verifica preço
  └── Não encontrado → Insere em produtos_temporarios
    ↓
Define status geral da nota:
  ├── Todos atualizados → "processada"
  ├── Mix de atualizados e temporários → "parcial"
  └── Nenhum atualizado → "parcial"
    ↓
Salva nota e itens no banco
    ↓
Deleta arquivo temporário
    ↓
Retorna resposta JSON com resumo
```

---

## 7. Exemplos de Resposta

### `POST /api/nfe/importar` — Sucesso

```json
{
  "message": "NF-e importada com sucesso!",
  "nota_fiscal_id": 12,
  "numero_nf": "000123456",
  "emitente": "Distribuidora Exemplo LTDA",
  "data_emissao": "2025-10-16T14:00:00.000Z",
  "valor_total": 542.8,
  "total_itens": 5,
  "itens_atualizados": 3,
  "itens_temporarios": 2,
  "status": "parcial"
}
```

### `GET /api/nfe/:id/divergencias` — Divergências

```json
{
  "nota_fiscal_id": 12,
  "numero_nf": "000123456",
  "total_divergencias": 1,
  "itens": [
    {
      "barcode": "7891234567890",
      "nome_produto": "Suco de Laranja 1L",
      "preco_na_nota": 8.5,
      "preco_no_sistema": 7.9,
      "diferenca": 0.6,
      "quantidade": 10,
      "nome_no_sistema": "Suco Laranja Natural 1L"
    }
  ]
}
```

### `POST /api/nfe/importar` — Duplicata

```json
{
  "message": "NF-e número 000123456 já foi importada anteriormente.",
  "nota_existente_id": 12
}
```

---

## 8. Arquivos de Teste XML

Foram criados arquivos de teste para validar diferentes cenários:

| Arquivo                       | Cenário                                |
| ----------------------------- | -------------------------------------- |
| `teste.xml`                   | Nota simples com 1 item                |
| `teste_todos_novos.xml`       | Todos os produtos não cadastrados      |
| `teste_divergencia_preco.xml` | Produto com preço diferente do sistema |
| `teste_nota_grande.xml`       | Nota com múltiplos itens               |
