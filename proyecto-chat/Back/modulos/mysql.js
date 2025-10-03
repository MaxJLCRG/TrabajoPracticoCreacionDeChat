// Back/modulos/mysql.js
// ====================================================================
// Conexión MySQL (mysql2/promise)  carga  .env x prioridad
// ====================================================================

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// ── Cargar el primer archivo de entorno en /Back
const envCandidates = [".home.env", ".pio.env", ".env"];
const chosenEnv =
  envCandidates.find((f) => fs.existsSync(path.join(__dirname, "..", f))) ||
  ".env";

dotenv.config({ path: path.join(__dirname, "..", chosenEnv) });
console.log("🧩 [mysql.js] ENV cargado:", chosenEnv);

// ── Validación de variables
function assertEnv(k) {
  if (!process.env[k] || String(process.env[k]).trim() === "") {
    throw new Error(`Falta variable de entorno ${k}`);
  }
}
["MYSQL_HOST", "MYSQL_USERNAME", "MYSQL_PASSWORD", "MYSQL_DB"].forEach(assertEnv);

// ── Configuración
const SQL_CONFIGURATION_DATA = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  port: Number(process.env.MYSQL_PORT || 3306),
  charset: "UTF8_GENERAL_CI",
};

// ── Helper: ejecutar query
exports.realizarQuery = async function (queryString) {
  let connection;
  try {
    connection = await mysql.createConnection(SQL_CONFIGURATION_DATA);
    const [rows] = await connection.execute(queryString);
    return rows;
  } catch (err) {
    console.error("❌ MYSQL ERROR in query:\n", queryString, "\n", err);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
};
