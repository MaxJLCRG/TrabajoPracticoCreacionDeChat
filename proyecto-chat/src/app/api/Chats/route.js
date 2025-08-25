import { connectDB } from "../../lib/base";

export async function GET() {
    const db = await connectDB();
    const [rows] = await db.execute("SELECT * FROM chats");
    return Response.json(rows);
}


export async function POST(req) {
    const db = await connectDB();
    const body = await req.json();
    const { usuario, mensaje } = body;

    await db.execute("INSERT INTO chats (usuario, mensaje) VALUES (?, ?)", [
    usuario,
    mensaje,
    ]);

    return Response.json({ message: "Chat guardado" });
}
