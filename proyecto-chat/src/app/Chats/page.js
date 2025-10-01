"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/app/Styles/Chats.module.css";
import { useSocket } from "@/hooks/useSocket";

const API = "http://localhost:4000";

export default function ChatsPage() {
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [correoInvitar, setCorreoInvitar] = useState("");
  const [search, setSearch] = useState("");         // <-- NUEVO: texto de búsqueda
  const [loading, setLoading] = useState(true);     // <-- NUEVO: estado de carga
  const [error, setError] = useState(null);         // <-- NUEVO: error visible

  const { socket, isConnected } = useSocket();

  // cargar usuario logueado + chats
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const r1 = await fetch(`${API}/me`, { credentials: "include" });
        const d1 = await r1.json();
        if (!d1.ok) {
          setError("No hay sesión activa. Inicia sesión.");
          setLoading(false);
          return;
        }
        setMe(d1.user);

        const r2 = await fetch(`${API}/chats`, { credentials: "include" });
        const d2 = await r2.json();
        if (d2.ok) {
          setChats(d2.chats || []);
          if ((d2.chats || []).length) setActiveChat(d2.chats[0].id_chat);
        } else {
          setError(d2.msg || "No se pudieron cargar los chats");
        }
      } catch (e) {
        setError("Error de red al cargar chats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // cargar mensajes del chat activo
  useEffect(() => {
    if (!activeChat) return;
    (async () => {
      try {
        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, { credentials: "include" });
        const d = await r.json();
        if (d.ok) setMensajes(d.mensajes || []);
      } catch {
        // ignoramos para no romper la UI
      }
    })();
    socket?.emit("joinChat", activeChat);
  }, [activeChat, socket]);

  // escuchar nuevos mensajes por socket
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

  // enviar mensaje
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

  // invitar usuario por correo
  const invitar = async (e) => {
    e?.preventDefault?.();
    if (!activeChat || !correoInvitar.trim()) return;

    const r = await fetch(`${API}/chats/${activeChat}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ correo: correoInvitar.trim() }),
    });
    const d = await r.json();

    if (d.ok) {
      alert(d.msg || "Usuario invitado");
      setCorreoInvitar("");
    } else {
      alert(d.msg || "No se pudo invitar");
    }
  };

  // filtrar chats por nombre
  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return (chats || []).filter((c) =>
      (c.nombre || `Chat ${c.id_chat}`).toLowerCase().includes(term)
    );
  }, [search, chats]);

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Mis chats</h2>
          <p className={styles.socketState}>
            Conexion: {isConnected ? "Establecida ✅" : "Desconectado ❌"}
          </p>
        </div>

        {/* NUEVO: barra de búsqueda siempre visible */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar chat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ul className={styles.chatList}>
          {loading && <li className={styles.chatItem}>Cargando…</li>}
          {!loading && error && <li className={styles.chatItem}>{error}</li>}
          {!loading && !error && filteredChats.map((c) => (
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
          {!loading && !error && !filteredChats.length && (
            <li className={styles.chatItem}>No hay chats</li>
          )}
        </ul>
      </aside>

      {/* Panel derecho */}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            {activeChat ? `Chat #${activeChat}` : "Selecciona un chat"}
          </h3>
        </header>

        {/* Barra de invitación (solo cuando hay chat activo) */}
        {activeChat && (
          <form className={styles.inviteBar} onSubmit={invitar}>
            <input
              className={styles.inviteInput}
              type="email"
              placeholder="Invitar por correo…"
              value={correoInvitar}
              onChange={(e) => setCorreoInvitar(e.target.value)}
              required
            />
            <button className={styles.inviteBtn} type="submit">Invitar</button>
          </form>
        )}

        {/* Mensajes */}
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

        {/* Composer */}
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
