    "use client";

    import { useState } from "react";
    import styles from "@/app/Styles/Chats.module.css";

    export default function ChatPage() {
    const [chats, setChats] = useState([
        { name: "Juan", avatar: "https://i.pravatar.cc/40?img=1" },
        { name: "María", avatar: "https://i.pravatar.cc/40?img=2" },
        { name: "Pedro", avatar: "https://i.pravatar.cc/40?img=3" },
    ]);

    const [selectedChat, setSelectedChat] = useState("Juan");
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState({
        Juan: [],
        María: [],
        Pedro: [],
    });
    const [newMessage, setNewMessage] = useState("");

    const filteredChats = chats.filter((chat) =>
        chat.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSendMessage = () => {
        if (newMessage.trim() === "") return;

        setMessages((prev) => ({
        ...prev,
        [selectedChat]: [
            ...prev[selectedChat],
            { text: newMessage, sender: "yo" },
        ],
        }));

        setNewMessage("");
    };

    const handleAddUser = () => {
        if (search.trim() !== "" && !chats.find((c) => c.name === search)) {
        const newUser = {
            name: search,
            avatar: "https://i.pravatar.cc/40?u=" + search, // avatar dinámico
        };

        setChats([...chats, newUser]);
        setMessages((prev) => ({
            ...prev,
            [search]: [],
        }));
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
                    chat.name === selectedChat ? styles.active : ""
                } ${styles.textSidebar}`}
                onClick={() => setSelectedChat(chat.name)}
                >
                <img
                    src={chat.avatar}
                    alt={chat.name}
                    className={styles.avatar}
                />
                <span>{chat.name}</span>
                </div>
            ))}
            </div>

            {/* Botón aparece solo si no existe el usuario */}
            {search && !chats.find((c) => c.name === search) && (
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
            <div className={`${styles.chatHeader} ${styles.textHeader}`}>
            <img
                src={chats.find((c) => c.name === selectedChat)?.avatar}
                alt={selectedChat}
                className={styles.avatarHeader}
            />
            Chat con {selectedChat}
            </div>

            <div className={styles.chatBody}>
            {messages[selectedChat]?.map((msg, idx) => (
                <div
                key={idx}
                className={`${styles.message} ${
                    msg.sender === "yo"
                    ? styles.messageSent
                    : styles.messageReceived
                }`}
                >
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