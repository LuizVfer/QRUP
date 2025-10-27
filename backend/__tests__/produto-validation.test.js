/**
 * Testes de Equivalência para validações de Produto
 *
 * Classes de Equivalência para campos de produto:
 * 1. Título: válido (3-100 chars), muito curto (<3), muito longo (>100), vazio
 * 2. Preço: válido (positivo), zero, negativo, não numérico
 * 3. Categoria: válida (bebidas, alimentos, outros), inválida
 * 4. Código de barras: válido EAN-13, inválido
 * 5. Quantidade estoque: válida (>=0), negativa, não inteiro
 */

const Joi = require("joi");

// Simulando as constantes e schemas do produtoController
const CATEGORIAS_VALIDAS = ["bebidas", "alimentos", "outros"];

const isValidEAN13 = (barcode) => {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split("").map(Number);
  const checksum = digits.pop();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return checksum === calculatedChecksum;
};

const produtoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required(),
  preco: Joi.number().positive().required(),
  categoria: Joi.string()
    .valid(...CATEGORIAS_VALIDAS)
    .required(),
  barcode: Joi.string()
    .max(50)
    .pattern(/^\d{13}$/)
    .required()
    .custom((value, helpers) => {
      if (!isValidEAN13(value)) {
        return helpers.error("string.invalidEAN13");
      }
      return value;
    })
    .messages({
      "string.pattern.base":
        "Código de barras EAN-13 deve ter 13 dígitos numéricos",
      "string.invalidEAN13":
        "Código de barras EAN-13 inválido. O checksum está incorreto.",
      "any.required": "Código de barras é obrigatório",
    }),
  quantidade_estoque: Joi.number().integer().min(0).required().messages({
    "number.base": "Quantidade em estoque deve ser um número",
    "number.integer": "Quantidade em estoque deve ser um número inteiro",
    "number.min": "Quantidade em estoque não pode ser negativa",
    "any.required": "Quantidade em estoque é obrigatória",
  }),
});

describe("Testes de Equivalência - Validação de Produto", () => {
  describe("Classe de Equivalência - Título do Produto", () => {
    test("deve aceitar títulos válidos (3-100 caracteres)", () => {
      const titulosValidos = [
        "Abc", // Exatos 3 caracteres (limite inferior)
        "Produto Teste", // Tamanho médio
        "Refrigerante Coca-Cola", // Tamanho normal
        "A".repeat(100), // Exatos 100 caracteres (limite superior)
      ];

      titulosValidos.forEach((titulo) => {
        const produto = {
          titulo,
          preco: 10.5,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeUndefined();
      });
    });

    test("deve rejeitar títulos muito curtos (<3 caracteres)", () => {
      const titulosCurtos = [
        "", // Vazio
        "A", // 1 caractere
        "AB", // 2 caracteres
      ];

      titulosCurtos.forEach((titulo) => {
        const produto = {
          titulo,
          preco: 10.5,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("titulo");
      });
    });

    test("deve rejeitar títulos muito longos (>100 caracteres)", () => {
      const titulosLongos = [
        "A".repeat(101), // 101 caracteres
        "A".repeat(200), // 200 caracteres
        "A".repeat(500), // 500 caracteres
      ];

      titulosLongos.forEach((titulo) => {
        const produto = {
          titulo,
          preco: 10.5,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("titulo");
      });
    });
  });

  describe("Classe de Equivalência - Preço do Produto", () => {
    test("deve aceitar preços válidos (números positivos)", () => {
      const precosValidos = [
        0.01, // Menor valor positivo possível
        1.0, // Valor inteiro
        10.5, // Valor com decimais
        999.99, // Valor alto
        1000000, // Valor muito alto
      ];

      precosValidos.forEach((preco) => {
        const produto = {
          titulo: "Produto Teste",
          preco,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeUndefined();
      });
    });

    test("deve rejeitar preços inválidos (zero, negativos, não numéricos)", () => {
      const precosInvalidos = [
        0, // Zero
        -0.01, // Negativo pequeno
        -10, // Negativo
        -999.99, // Negativo grande
        "abc", // String
        null, // Null
        undefined, // Undefined
      ];

      precosInvalidos.forEach((preco) => {
        const produto = {
          titulo: "Produto Teste",
          preco,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("preco");
      });
    });
  });

  describe("Classe de Equivalência - Categoria do Produto", () => {
    test("deve aceitar categorias válidas", () => {
      const categoriasValidas = ["bebidas", "alimentos", "outros"];

      categoriasValidas.forEach((categoria) => {
        const produto = {
          titulo: "Produto Teste",
          preco: 10.5,
          categoria,
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeUndefined();
      });
    });

    test("deve rejeitar categorias inválidas", () => {
      const categoriasInvalidas = [
        "roupas", // Categoria não permitida
        "eletrônicos", // Categoria não permitida
        "BEBIDAS", // Case sensitive
        "bebida", // Singular
        "", // Vazio
        null, // Null
        undefined, // Undefined
      ];

      categoriasInvalidas.forEach((categoria) => {
        const produto = {
          titulo: "Produto Teste",
          preco: 10.5,
          categoria,
          barcode: "1234567890128",
          quantidade_estoque: 10,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("categoria");
      });
    });
  });

  describe("Classe de Equivalência - Quantidade em Estoque", () => {
    test("deve aceitar quantidades válidas (inteiros >= 0)", () => {
      const quantidadesValidas = [
        0, // Zero (limite inferior)
        1, // Um
        10, // Número normal
        100, // Número grande
        99999, // Número muito grande
      ];

      quantidadesValidas.forEach((quantidade_estoque) => {
        const produto = {
          titulo: "Produto Teste",
          preco: 10.5,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeUndefined();
      });
    });

    test("deve rejeitar quantidades inválidas (negativas, decimais, não numéricas)", () => {
      const quantidadesInvalidas = [
        -1, // Negativo
        -10, // Negativo grande
        1.5, // Decimal
        10.7, // Decimal
        "abc", // String
        null, // Null
        undefined, // Undefined
      ];

      quantidadesInvalidas.forEach((quantidade_estoque) => {
        const produto = {
          titulo: "Produto Teste",
          preco: 10.5,
          categoria: "bebidas",
          barcode: "1234567890128",
          quantidade_estoque,
        };

        const { error } = produtoSchema.validate(produto);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("quantidade_estoque");
      });
    });
  });

  describe("Testes de Produto Completo - Combinações Válidas", () => {
    test("deve aceitar produtos completamente válidos", () => {
      // Função auxiliar para gerar códigos EAN-13 válidos
      const generateValidEAN13 = (base12digits) => {
        const digits = base12digits.split("").map(Number);
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        const checksum = (10 - (sum % 10)) % 10;
        return base12digits + checksum;
      };

      const produtosValidos = [
        {
          titulo: "Coca-Cola 350ml",
          preco: 4.5,
          categoria: "bebidas",
          barcode: generateValidEAN13("123456789012"),
          quantidade_estoque: 50,
        },
        {
          titulo: "Pão Francês",
          preco: 0.5,
          categoria: "alimentos",
          barcode: generateValidEAN13("789100010010"),
          quantidade_estoque: 0,
        },
        {
          titulo: "Guardanapo",
          preco: 2.99,
          categoria: "outros",
          barcode: generateValidEAN13("789602754001"),
          quantidade_estoque: 100,
        },
      ];

      produtosValidos.forEach((produto) => {
        const { error } = produtoSchema.validate(produto);
        expect(error).toBeUndefined();
      });
    });
  });

  describe("Testes de Produto Completo - Múltiplos Erros", () => {
    test("deve detectar múltiplos erros de validação", () => {
      const produtoInvalido = {
        titulo: "AB", // Muito curto
        preco: -5, // Negativo
        categoria: "invalida", // Categoria inválida
        barcode: "123", // Código inválido
        quantidade_estoque: -1, // Negativo
      };

      const { error } = produtoSchema.validate(produtoInvalido, {
        abortEarly: false,
      });
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(1); // Múltiplos erros
    });
  });
});
