"use client";

import { useState } from "react";
import styles from "@/app/Styles/Chats.module.css";

export default function ChatPage() {
    const [chats, setChats] = useState(["Juan", "María", "Pedro"]);
    const [selectedChat, setSelectedChat] = useState("Juan");
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const filteredChats = chats.filter((chat) =>
    chat.toLowerCase().includes(search.toLowerCase())
    );

    const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    setMessages([...messages, { text: newMessage, sender: "yo" }]);
    setNewMessage("");
    };

    const handleAddUser = () => {
    if (search.trim() !== "" && !chats.includes(search)) {
        setChats([...chats, search]);
        setSearch("");
    }
    };

    return (
    <div className={styles.container}>
      {/* Sidebar */}
        <div className={styles.sidebar}>
        <div className={styles.search}>
            <input
            type="text"
            placeholder="Buscar chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <div className={styles.chatList}>
            {filteredChats.map((chat, idx) => (
            <div
                key={idx}
                className={`${styles.chatItem} ${
                chat === selectedChat ? styles.active : ""
                }`}
                onClick={() => setSelectedChat(chat)}
            >
                {chat}
            </div>
            ))}
        </div>

        {/* Botón aparece solo si no existe el usuario */}
        {search && !chats.includes(search) && (
            <button
            className={`${styles.addUserButton} ${styles.showButton}`}
            onClick={handleAddUser}
            >
            Agregar usuario
            </button>
        )}
        </div>

      {/* Chat principal */}
        <div className={styles.chatArea}>
        <div className={styles.chatHeader}>Chat con {selectedChat}</div>

        <div className={styles.chatBody}>
            {messages.map((msg, idx) => (
            <div key={idx}>
                <strong>{msg.sender}: </strong>
                {msg.text}
            </div>
            ))}
        </div>

        <div className={styles.chatInput}>
            <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Enviar</button>
        </div>
        </div>
    </div>
        );
}