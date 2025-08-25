import mysql from "mysql2/promise";

export async function connectDB() {
    const connection = await mysql.createConnection({
    host: "181.47.29.35",       // o tu host
    user: "2025-5INF-G15",            // tu usuario MySQL
    password: "melaniegil", // tu contraseña
    database: "2025-5INF-G15"    // tu base de datos
    });
    return connection;
}
