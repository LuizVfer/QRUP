// Configuração do Jest para o Projeto

module.exports = {
  // Ambiente de teste
  testEnvironment: "node",

  // Diretórios onde procurar por testes
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],

  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Arquivos para incluir na cobertura
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
    "middlewares/**/*.js",
  ],

  // Ignorar da cobertura
  coveragePathIgnorePatterns: ["/node_modules/", "/coverage/", "/__tests__/"],

  // Configuração de verbose para saída detalhada
  verbose: true,

  // Timeouts
  testTimeout: 30000,
};
