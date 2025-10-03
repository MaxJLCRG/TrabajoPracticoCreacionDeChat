const mysql = require("mysql2/promise");

(async () => {
    try {
        const conn = await mysql.createConnection({
        host: "181.47.29.35",
        user: "2025-5INF-G15",
        password: "melaniegil",
        database: "2025-5INF-G15",
        port: 3306,
        });
        console.log("✅ Conectado!");
        const [rows] = await conn.execute("SELECT NOW() AS hora");
        console.log(rows);
        conn.end();
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
})();
