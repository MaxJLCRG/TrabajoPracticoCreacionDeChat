"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";

export default function SocketPage() {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on("pingAll", (data) => {
        console.log("📡 Ping recibido en el front:", data);
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
        </div>
    );
}
