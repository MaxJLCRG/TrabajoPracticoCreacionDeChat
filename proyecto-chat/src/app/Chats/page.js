"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

const API = "http://localhost:4000";

export default function ChatsPage() {
    const [me, setMe] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState("");

    // socket con credenciales para la cookie de sesión
    const { socket, isConnected } = useSocket({ withCredentials: true });

    // cargar usuario y chats
    useEffect(() => {
        (async () => {
        // quién soy
        const r1 = await fetch(`${API}/me`, { credentials: "include" });
        const d1 = await r1.json();
        if (!d1.ok) {
            // si no hay sesión, podrías redirigir a /Login
            return;
        }
        setMe(d1.user);

        // mis chats
        const r2 = await fetch(`${API}/chats`, { credentials: "include" });
        const d2 = await r2.json();
        if (d2.ok) {
            setChats(d2.chats);
            if (d2.chats.length && !activeChat) {
            setActiveChat(d2.chats[0].id_chat);
            }
        }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // cuando cambia el chat activo, cargo mensajes y me uno al room
    useEffect(() => {
        if (!activeChat) return;

        (async () => {
        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, {
            credentials: "include",
        });
        const d = await r.json();
        if (d.ok) setMensajes(d.mensajes);
        })();

        if (socket) socket.emit("joinChat", activeChat);
    }, [activeChat, socket]);

    // escuchar mensajes nuevos por socket
    useEffect(() => {
        if (!socket) return;

        const handler = (msg) => {
        // solo si pertenece al chat activo
        if (Number(msg.id_chat) === Number(activeChat)) {
            setMensajes((prev) => [...prev, msg]);
        }
        };

        socket.on("nuevoMensaje", handler);
        return () => socket.off("nuevoMensaje", handler);
    }, [socket, activeChat]);

    const enviar = async (e) => {
        e?.preventDefault?.();
        if (!texto.trim() || !activeChat) return;

        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texto }),
        });
        const d = await r.json();
        if (d.ok) {
        setTexto("");
        // el push visual lo hace el evento socket "nuevoMensaje"
        } else {
        alert(d.msg || "No se pudo enviar");
        }
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "100vh" }}>
        {/* Lista de chats */}
        <aside style={{ borderRight: "1px solid #eee", overflowY: "auto" }}>
            <div style={{ padding: 12 }}>
            <h2>Mis chats</h2>
            <p style={{ fontSize: 12, opacity: 0.6 }}>
                Socket: {isConnected ? "Conectado" : "Desconectado"}
            </p>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {chats.map((c) => (
                <li
                key={c.id_chat}
                onClick={() => setActiveChat(c.id_chat)}
                style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: activeChat === c.id_chat ? "#f5f5f5" : "transparent",
                    borderBottom: "1px solid #f0f0f0",
                }}
                >
                <div style={{ fontWeight: 600 }}>{c.nombre || `Chat ${c.id_chat}`}</div>
                {c.es_grupo ? (
                    <small>Grupo • {c.participantes ?? ""}</small>
                ) : (
                    <small>1 a 1</small>
                )}
                </li>
            ))}
            {!chats.length && <li style={{ padding: 12 }}>No hay chats</li>}
            </ul>
        </aside>

        {/* Panel de mensajes */}
        <section style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header style={{ padding: 12, borderBottom: "1px solid #eee" }}>
            <h3 style={{ margin: 0 }}>
                {activeChat ? `Chat #${activeChat}` : "Selecciona un chat"}
            </h3>
            </header>

            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {activeChat ? (
                mensajes.length ? (
                mensajes.map((m) => (
                    <div key={m.id_mensaje} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                        {m.nombre ?? "Usuario"} — {new Date(m.fecha_mensaje).toLocaleString()}
                    </div>
                    <div>{m.texto}</div>
                    </div>
                ))
                ) : (
                <p>Sin mensajes</p>
                )
            ) : (
                <p>Elegí un chat para ver los mensajes</p>
            )}
            </div>

            {/* Input enviar */}
            {activeChat && (
            <form onSubmit={enviar} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee" }}>
                <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{ flex: 1 }}
                />
                <button type="submit">Enviar</button>
            </form>
            )}
        </section>
        </div>
    );
}
