import mysql from "mysql2/promise";

export async function connectDB() {
    const connection = await mysql.createConnection({
    host: "181.47.29.35",
    user: "2025-5INF-G15",
    password: "melaniegil",
    database: "2025-5INF-G15"
    });
    return connection;
}