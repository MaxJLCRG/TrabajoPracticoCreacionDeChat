"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";

export default function SocketPage() {
    const { socket, isConnected } = useSocket();
    const [lastMessage, setLastMessage] = useState(null);

    useEffect(() => {
    if (!socket) return;

    socket.on("pingAll", (data) => {
        console.log("📡 Ping recibido en el front:", data);
        setLastMessage(`Mensaje recibido: ${JSON.stringify(data)}`);
    });

    return () => {
        socket.off("pingAll");
    };
    }, [socket]);

    const handlePing = () => {
    if (socket) {
        console.log("📤 Enviando ping...");
        socket.emit("pingAll", { msg: "Hola desde el frontend en 3000 🚀" });
    }
    };

    return (
    <div style={{ padding: "20px" }}>
        <h1>Socket {isConnected ? "Conectado ✅" : "Desconectado ❌"}</h1>
        <button onClick={handlePing} disabled={!isConnected}>
        Enviar Ping
        </button>

        {lastMessage && (
        <p style={{ marginTop: "20px", color: "green" }}>
            {lastMessage}
        </p>
        )}
    </div>
    );    
}
