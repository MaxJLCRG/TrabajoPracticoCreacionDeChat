"use client";

import { useEffect, useState } from "react";
import styles from "@/app/Styles/Chats.module.css";
import { useSocket } from "@/hooks/useSocket";

const API = "http://localhost:4000";

export default function ChatsPage() {
    const [me, setMe] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState("");
    const { socket, isConnected } = useSocket(); // withCredentials ya por defecto

    useEffect(() => {
        (async () => {
        const r1 = await fetch(`${API}/me`, { credentials: "include" });
        const d1 = await r1.json();
        if (!d1.ok) return;
        setMe(d1.user);

        const r2 = await fetch(`${API}/chats`, { credentials: "include" });
        const d2 = await r2.json();
        if (d2.ok) {
            setChats(d2.chats);
            if (d2.chats.length && !activeChat) setActiveChat(d2.chats[0].id_chat);
        }
        })();
    }, []);

    useEffect(() => {
        if (!activeChat) return;
        (async () => {
        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, { credentials: "include" });
        const d = await r.json();
        if (d.ok) setMensajes(d.mensajes);
        })();
        socket?.emit("joinChat", activeChat);
    }, [activeChat, socket]);

    useEffect(() => {
        if (!socket) return;
        const onNuevo = (msg) => {
        if (Number(msg.id_chat) === Number(activeChat)) {
            setMensajes((prev) => [...prev, msg]);
        }
        };
        socket.on("nuevoMensaje", onNuevo);
        return () => socket.off("nuevoMensaje", onNuevo);
    }, [socket, activeChat]);

    const enviar = async (e) => {
        e.preventDefault();
        if (!texto.trim() || !activeChat) return;
        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texto }),
        });
        const d = await r.json();
        if (d.ok) setTexto("");
    };

    return (
        <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Mis chats</h2>
            <p className={styles.socketState}>
                Socket: {isConnected ? "Conectado" : "Desconectado"}
            </p>
            </div>
            <ul className={styles.chatList}>
            {chats.map((c) => (
                <li
                key={c.id_chat}
                className={`${styles.chatItem} ${activeChat === c.id_chat ? styles.chatItemActive : ""}`}
                onClick={() => setActiveChat(c.id_chat)}
                >
                <div className={styles.chatTitle}>{c.nombre || `Chat ${c.id_chat}`}</div>
                <div className={styles.chatMeta}>
                    {c.es_grupo ? `Grupo • ${c.participantes ?? ""}` : "1 a 1"}
                </div>
                </li>
            ))}
            {!chats.length && <li className={styles.chatItem}>No hay chats</li>}
            </ul>
        </aside>

        <section className={styles.panel}>
            <header className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
                {activeChat ? `Chat #${activeChat}` : "Selecciona un chat"}
            </h3>
            </header>

            <div className={styles.messages}>
            {activeChat ? (
                mensajes.length ? (
                mensajes.map((m) => {
                    const own = m.id_usuario === me?.id_usuario;
                    return (
                    <div key={m.id_mensaje} className={`${styles.msg} ${own ? styles.msgSelf : ""}`}>
                        <div className={styles.msgHead}>
                        {m.nombre ?? "Usuario"} — {new Date(m.fecha_mensaje).toLocaleString()}
                        </div>
                        <div className={styles.msgBubble}>{m.texto}</div>
                    </div>
                    );
                })
                ) : (
                <p>Sin mensajes</p>
                )
            ) : (
                <p>Elegí un chat para ver los mensajes</p>
            )}
            </div>

            {activeChat && (
            <form className={styles.composer} onSubmit={enviar}>
                <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje..."
                />
                <button className={styles.sendBtn} type="submit">Enviar</button>
            </form>
            )}
        </section>
        </div>
    );
}
