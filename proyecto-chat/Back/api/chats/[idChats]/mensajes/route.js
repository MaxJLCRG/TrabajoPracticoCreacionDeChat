import { connectDB } from "@/lib/base";

// GET → obtener mensajes de un chat por id
export async function GET(req, { params }) {
    const { idChat } = params;
    const db = await connectDB();

    const [rows] = await db.execute(`
        SELECT m.id_mensaje, m.texto, m.fecha_mensaje, m.leido,
            u.nombre AS usuario, u.foto_perfil
        FROM Mensajes m
        JOIN UsuariosPorChat uc ON m.id_usuario_chat = uc.id_usuario_chat
        JOIN Usuarios u ON uc.id_usuario = u.id_usuario
        WHERE uc.id_chat = ?
        ORDER BY m.fecha_mensaje ASC
    `, [idChat]);

    return Response.json(rows);
}

// POST → enviar mensaje a un chat
export async function POST(req, { params }) {
    const { idChat } = params;
    const db = await connectDB();
    const body = await req.json();
    const { id_usuario, texto } = body;

    // buscamos id_usuario_chat de ese usuario en ese chat
    const [userChat] = await db.execute(
        "SELECT id_usuario_chat FROM UsuariosPorChat WHERE id_usuario = ? AND id_chat = ?",
        [id_usuario, idChat]
    );

    if (userChat.length === 0) {
        return Response.json({ error: "Usuario no pertenece a este chat" }, { status: 400 });
    }

    const id_usuario_chat = userChat[0].id_usuario_chat;

    await db.execute(
        "INSERT INTO Mensajes (texto, fecha_mensaje, leido, id_usuario_chat) VALUES (?, NOW(), 0, ?)",
        [texto, id_usuario_chat]
    );

    return Response.json({ message: "Mensaje enviado correctamente" });
}
