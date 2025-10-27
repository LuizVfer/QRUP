/**
 * Testes de Equivalência para validação de códigos EAN-13
 *
 * Classes de Equivalência identificadas:
 * 1. Códigos válidos com 13 dígitos e checksum correto
 * 2. Códigos inválidos com 13 dígitos mas checksum incorreto
 * 3. Códigos com formato incorreto (não numérico, tamanho diferente)
 * 4. Valores nulos/undefined/vazios
 */

// Função isValidEAN13 extraída do produtoController
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

// Função para gerar códigos EAN-13 válidos
const generateValidEAN13 = (base12digits) => {
  const digits = base12digits.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return base12digits + checksum;
};

describe("Testes de Equivalência - Validação EAN-13", () => {
  describe("Classe de Equivalência 1: Códigos EAN-13 válidos", () => {
    test("deve validar códigos EAN-13 com checksum correto", () => {
      // Códigos válidos gerados com checksum correto
      const codigosValidos = [
        generateValidEAN13("123456789012"), // Gera checksum correto
        generateValidEAN13("100000000000"), // Código simples
        generateValidEAN13("200000000000"), // Código simples
        generateValidEAN13("789100010010"), // Base real de produto
        generateValidEAN13("000000000000"), // Zeros com checksum correto
      ];

      codigosValidos.forEach((codigo) => {
        expect(isValidEAN13(codigo)).toBe(true);
      });
    });

    test("deve validar códigos com todos os dígitos iguais (mas checksum correto)", () => {
      expect(isValidEAN13(generateValidEAN13("111111111111"))).toBe(true);
    });
  });

  describe("Classe de Equivalência 2: Códigos EAN-13 com checksum incorreto", () => {
    test("deve rejeitar códigos com 13 dígitos mas checksum inválido", () => {
      // Pegamos códigos válidos e alteramos apenas o último dígito
      const baseValida = generateValidEAN13("123456789012");
      const ultimoDigito = baseValida.slice(-1);
      const novoDigito =
        ultimoDigito === "9" ? "0" : (parseInt(ultimoDigito) + 1).toString();

      const codigosInvalidos = [
        "1234567890127", // Código com checksum propositalmente errado
        "1000000000008", // Código com checksum propositalmente errado
        "2000000000005", // Código com checksum propositalmente errado
        "3000000000002", // Código com checksum propositalmente errado
        "0000000000001", // Checksum incorreto para zeros (correto seria 7)
      ];

      codigosInvalidos.forEach((codigo) => {
        expect(isValidEAN13(codigo)).toBe(false);
      });
    });
  });

  describe("Classe de Equivalência 3: Formato incorreto", () => {
    test("deve rejeitar códigos com menos de 13 dígitos", () => {
      const codigosCurtos = [
        "",
        "1",
        "12",
        "123456789012", // 12 dígitos
        "12345678901", // 11 dígitos
      ];

      codigosCurtos.forEach((codigo) => {
        expect(isValidEAN13(codigo)).toBe(false);
      });
    });

    test("deve rejeitar códigos com mais de 13 dígitos", () => {
      const codigosLongos = [
        "12345678901234", // 14 dígitos
        "123456789012345", // 15 dígitos
        "1234567890123456789", // Muito longo
      ];

      codigosLongos.forEach((codigo) => {
        expect(isValidEAN13(codigo)).toBe(false);
      });
    });

    test("deve rejeitar códigos com caracteres não numéricos", () => {
      const codigosInvalidos = [
        "123456789012a", // Letra no final
        "a234567890128", // Letra no início
        "12345678901@8", // Símbolo
        "1234567890 28", // Espaço
        "1234567890.28", // Ponto
        "1234567890-28", // Hífen
        "abcdefghijklm", // Só letras
      ];

      codigosInvalidos.forEach((codigo) => {
        expect(isValidEAN13(codigo)).toBe(false);
      });
    });
  });

  describe("Classe de Equivalência 4: Valores nulos/indefinidos", () => {
    test("deve rejeitar valores null, undefined e vazios", () => {
      const valoresInvalidos = [null, undefined, ""];

      valoresInvalidos.forEach((valor) => {
        expect(isValidEAN13(valor)).toBe(false);
      });
    });
  });

  describe("Casos limítrofes (Boundary Values)", () => {
    test("deve testar valores nos limites das classes", () => {
      // Exatamente 13 dígitos numéricos com checksum válido
      expect(isValidEAN13(generateValidEAN13("000000000000"))).toBe(true); // Menor código possível válido
      expect(isValidEAN13(generateValidEAN13("999999999999"))).toBe(true); // Maior código possível válido

      // Exatamente 12 dígitos (limite inferior)
      expect(isValidEAN13("000000000000")).toBe(false);

      // Exatamente 14 dígitos (limite superior)
      expect(isValidEAN13("00000000000000")).toBe(false);
    });
  });

  describe("Testes de Mutação e Robustez", () => {
    test("deve detectar alteração de um único dígito em código válido", () => {
      const codigoValido = generateValidEAN13("123456789012");

      // Alterar cada posição e verificar se detecta o erro
      for (let i = 0; i < 13; i++) {
        let codigoAlterado = codigoValido.split("");
        codigoAlterado[i] = codigoAlterado[i] === "0" ? "1" : "0"; // Troca dígito
        codigoAlterado = codigoAlterado.join("");

        if (codigoAlterado !== codigoValido) {
          expect(isValidEAN13(codigoAlterado)).toBe(false);
        }
      }
    });

    test("deve lidar com tipos de dados inesperados", () => {
      const valoresInesperados = [
        123, // Number
        true, // Boolean
        false, // Boolean
        [], // Array
        {}, // Object
        () => {}, // Function
      ];

      valoresInesperados.forEach((valor) => {
        expect(isValidEAN13(valor)).toBe(false);
      });
    });
  });
});
