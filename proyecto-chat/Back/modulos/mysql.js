//Sección MySQL del código
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  port: Number(process.env.MYSQL_PORT || 3306),
  charset: "utf8mb4_general_ci",
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * Realiza una query a la base de datos MySQL indicada en el archivo "mysql.js".
 * @param {String} queryString Query que se desea realizar. Textual como se utilizaría en el MySQL Workbench.
 * @returns Respuesta de la base de datos. Suele ser un vector de objetos.
 */
exports.realizarQuery = async (sql, params = []) => {
	try {
	  const [rows] = await pool.execute(sql, params);
	  return rows;
	} catch (err) {
	  console.error("[MySQL] ERROR:", err.code || err.message);
	  console.error("SQL =>", sql);
	  return []; // evita 'undefined[0]'
	}
  };