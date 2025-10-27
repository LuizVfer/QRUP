// config/db.js
const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  connectionLimit: 10, // Limite de conexões simultâneas
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  queueLimit: 0,
});

// Testar conexão ao iniciar
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erro ao conectar ao MySQL:", err.message);
    console.error("Verifique suas credenciais no arquivo .env");
    process.exit(1); // Encerra o processo se não conseguir conectar
  } else {
    console.log("✅ Conectado ao MySQL com pool!");
    connection.release();
  }
});

// Tratamento de erros do pool
pool.on("error", (err) => {
  console.error("❌ Erro no pool do MySQL:", err.message);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Conexão com o banco foi perdida.");
  }
});

module.exports = pool;
