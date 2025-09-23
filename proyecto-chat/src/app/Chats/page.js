"use client";

import { useEffect, useState } from "react";
import styles from "@/app/Styles/Chats.module.css";

export default function ChatsPage() {
    const currentUserId = 1; // ⚠️ Cambiar luego por el usuario logueado

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [search, setSearch] = useState("");

    // 🔹 Traer lista de chats
    useEffect(() => {
        const fetchChats = async () => {
        try {
            const res = await fetch(`/api/chats?userId=${currentUserId}`);
            const data = await res.json();
            setChats(data);
        } catch (err) {
            console.error("Error cargando chats:", err);
        }
        };
        fetchChats();
    }, []);

    // 🔹 Traer mensajes cuando selecciono un chat
    useEffect(() => {
        if (!selectedChat) return;
        const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chats/${selectedChat.id_chat}/mensajes`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error("Error cargando mensajes:", err);
        }
        };
        fetchMessages();
    }, [selectedChat]);

    // 🔹 Enviar mensaje
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        try {
        await fetch(`/api/chats/${selectedChat.id_chat}/mensajes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: currentUserId, texto: newMessage }),
        });

        setMessages([
            ...messages,
            {
            texto: newMessage,
            usuario: "Tú",
            fecha_mensaje: new Date().toISOString(),
            },
        ]);
        setNewMessage("");
        } catch (err) {
        console.error("Error enviando mensaje:", err);
        }
    };

    // 🔹 Filtrar chats por búsqueda
    const filteredChats = chats.filter((chat) =>
        chat.chat_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
        {/* 📌 Sidebar */}
        <div className={styles.sidebar}>
            <input
            type="text"
            placeholder="Buscar Chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
            />

            <div className={styles.chatList}>
            {filteredChats.map((chat) => (
                <div
                key={chat.id_chat}
                className={`${styles.chatItem} ${
                    selectedChat?.id_chat === chat.id_chat ? styles.active : ""
                }`}
                onClick={() => setSelectedChat(chat)}
                >
                <img
                    src={chat.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className={styles.avatar}
                />
                <div className={styles.chatInfo}>
                    <span className={styles.chatName}>{chat.chat_name}</span>
                    {chat.mail && (
                    <span className={styles.chatMail}>{chat.mail}</span>
                    )}
                    {chat.phone && (
                    <span className={styles.chatPhone}>{chat.phone}</span>
                    )}
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* 📌 Área de chat */}
        <div className={styles.chatArea}>
            {selectedChat ? (
            <>
                <div className={styles.chatHeader}>
                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>
                    {selectedChat.chat_name}
                    </span>
                    {selectedChat.mail && (
                    <span className={styles.headerMail}>
                        {selectedChat.mail}
                    </span>
                    )}
                    {selectedChat.phone && (
                    <span className={styles.headerPhone}>
                        {selectedChat.phone}
                    </span>
                    )}
                </div>
                <img
                    src={selectedChat.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className={styles.avatarHeader}
                />
                </div>

                <div className={styles.chatBody}>
                {messages.map((msg, idx) => (
                    <div
                    key={idx}
                    className={`${styles.message} ${
                        msg.usuario === "Tú"
                        ? styles.messageSent
                        : styles.messageReceived
                    }`}
                    >
                    <strong>{msg.usuario}: </strong>
                    {msg.texto}
                    </div>
                ))}
                </div>

                <div className={styles.chatInput}>
                <input
                    type="text"
                    placeholder="Escribir mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Enviar</button>
                </div>
            </>
            ) : (
            <div className={styles.noChatSelected}>
                Selecciona un chat para comenzar
            </div>
            )}
        </div>
        </div>
    );
}
