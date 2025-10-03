"use client";

/* =========================================================
    CHATS Page (frontend)
    - Lista tus chats
    - Abre chat y trae mensajes
    - Envía mensajes
    - Crea grupos e invita por correo
    - NUEVO: en la barra de búsqueda, si escribes un email y presionas Enter,
   ========================================================= */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/Styles/Chats.module.css";
import { useSocket } from "@/hooks/useSocket";

const API = "http://localhost:4000"; // ajusta si corresponde

export default function ChatsPage() {
  const router = useRouter();

  // Estado
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");

  const [search, setSearch] = useState("");
  const [correoInvitar, setCorreoInvitar] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Crear grupo
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupEmails, setGroupEmails] = useState("");

  // Logout modal
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { socket, isConnected } = useSocket();

  // Helpers
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

  // ─────────────────────────────────────────────────────────
  // Carga inicial: me + chats
  // ─────────────────────────────────────────────────────────
  const loadMeAndChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const r1 = await fetch(`${API}/me`, { credentials: "include" });
      const d1 = await r1.json();
      if (!d1.ok) {
        setError("No hay sesión activa. Inicia sesión.");
        setLoading(false);
        router.replace("/Login");
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
    } catch {
      setError("Error de red al cargar chats");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMeAndChats();
  }, [loadMeAndChats]);

  // ─────────────────────────────────────────────────────────
  // Cargar mensajes del chat activo + unirse a la sala socket
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;

    (async () => {
      try {
        const r = await fetch(`${API}/chats/${activeChat}/mensajes`, {
          credentials: "include",
        });
        const d = await r.json();
        if (d.ok) setMensajes(d.mensajes || []);
      } catch {}
    })();

    socket?.emit("joinChat", activeChat);
  }, [activeChat, socket]);

// ─────────────────────────────────────────────────────────
// Socket listeners
// ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNuevo = (msg) => {
      if (Number(msg.id_chat) === Number(activeChat)) {
        setMensajes((prev) => [...prev, msg]);
      }
    };
    const onChatCreado = () => loadMeAndChats();

    socket.on("nuevoMensaje", onNuevo);
    socket.on("chatCreado", onChatCreado);

    return () => {
      socket.off("nuevoMensaje", onNuevo);
      socket.off("chatCreado", onChatCreado);
    };
  }, [socket, activeChat, loadMeAndChats]);

// ─────────────────────────────────────────────────────────
// Acciones
// ─────────────────────────────────────────────────────────
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

  const invitar = async (email) => {
    const correo = String(email || correoInvitar).trim();
    if (!activeChat) {
      alert("Selecciona un chat para invitar.");
      return;
    }
    if (!isEmail(correo)) {
      alert("Ingresa un correo válido.");
      return;
    }
    try {
      const r = await fetch(`${API}/chats/${activeChat}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo }),
      });
      const d = await r.json();
      if (d.ok) {
        if (!email) setCorreoInvitar("");
        alert(d.msg || "Usuario invitado");
      } else {
        alert(d.msg || "No se pudo invitar");
      }
    } catch {
      alert("Error de red al invitar");
    }
  };
  
// Funcion del Enter barra de busqueda
const onSearchKeyDown = async (e) => {
  if (e.key !== "Enter") return;
  const term = search.trim();
  if (!isEmail(term)) return;
  e.preventDefault();

  if (activeChat) {
    await invitar(term);
    setSearch("");
  } else {
    await crearDM(term);
    setSearch("");
  }
};

// Crear grupo
  const crearGrupo = async (e) => {
    e?.preventDefault?.();
    if (!groupName.trim()) return alert("Ponle un nombre al grupo");

    const correos = groupEmails
      .split(/[,\s;]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      setCreating(true);
      const r = await fetch(`${API}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: groupName.trim(), correos }),
      });
      const d = await r.json();
      if (d.ok) {
        setShowCreate(false);
        setGroupName("");
        setGroupEmails("");
        await loadMeAndChats();
        setActiveChat(d.chat.id_chat);
      } else {
        alert(d.msg || "No se pudo crear el grupo");
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return (chats || []).filter((c) =>
      (c.nombre || `Chat ${c.id_chat}`).toLowerCase().includes(term)
    );
  }, [search, chats]);

  const doLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    } catch {}
    router.replace("/Login");
  }, [router]);

async function crearDM(correo) {
  try {
    const r = await fetch(`${API}/chats/dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ correo }),
    });
    const d = await r.json();
    if (!d.ok) {
      alert(d.msg || "No se pudo crear el chat 1:1");
      return;
    }
    await loadMeAndChats();
    setActiveChat(d.chat.id_chat);
  } catch (e) {
    alert("Error de red creando el chat 1:1");
  }
}

// ─────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Mis chats</h2>
          <p className={styles.socketState}>
            Socket: {isConnected ? "Conectado ✅" : "Desconectado ❌"}
          </p>
        </div>

        {/* Search + Crear grupo */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar chat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <button className={styles.createGroupBtn} onClick={() => setShowCreate(true)}>
              Nuevo grupo
            </button>
          </div>
        </div>

        {/* Lista de chats */}
        <ul className={styles.chatList}>
          {loading && <li className={styles.chatItem}>Cargando…</li>}
          {!loading && error && <li className={styles.chatItem}>{error}</li>}
          {!loading &&
            !error &&
            filteredChats.map((c) => (
              <li
                key={c.id_chat}
                className={`${styles.chatItem} ${activeChat === c.id_chat ? styles.chatItemActive : ""}`}
                onClick={() => setActiveChat(c.id_chat)}
              >
                <div className={styles.chatTitle}>{c.nombre || `Chat ${c.id_chat}`}</div>
                <div className={styles.chatMeta}>{c.es_grupo ? "Grupo" : "1 a 1"}</div>
              </li>
            ))}
          {!loading && !error && !filteredChats.length && (
            <li className={styles.chatItem}>No hay chats</li>
          )}
        </ul>

        {/* Footer: logout */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.logoutBtn}
            onClick={() => setShowLogout(true)}
            aria-haspopup="dialog"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Panel derecho */}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            {activeChat ? `Chat #${activeChat}` : "Selecciona un chat"}
          </h3>
        </header>

        {/* Modal: crear grupo */}
        {showCreate && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <div className={styles.modal} role="dialog" aria-modal="true">
              <h4 className={styles.modalTitle}>Nuevo grupo</h4>
              <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                <input
                  className={styles.modalInput}
                  type="text"
                  placeholder="Nombre del grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Correos de miembros (separados por coma o espacio)"
                  value={groupEmails}
                  onChange={(e) => setGroupEmails(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalCancel} onClick={() => setShowCreate(false)} disabled={creating}>
                  Cancelar
                </button>
                <button className={styles.modalConfirm} onClick={crearGrupo} disabled={creating}>
                  {creating ? "Creando..." : "Crear grupo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: confirm logout */}
        {showLogout && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && setShowLogout(false)}
          >
            <div className={styles.modal} role="dialog" aria-modal="true">
              <h4 className={styles.modalTitle}>¿Seguro que quieres salir?</h4>
              <p className={styles.modalText}>
                Tu sesión se cerrará y volverás a la pantalla de inicio de sesión.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.modalCancel} onClick={() => setShowLogout(false)} disabled={loggingOut}>
                  No
                </button>
                <button className={styles.modalConfirm} onClick={doLogout} disabled={loggingOut}>
                  {loggingOut ? "Saliendo..." : "Sí, salir"}
                </button>
              </div>
            </div>
          </div>
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