-- Crear tabla de Usuarios
CREATE TABLE IF NOT EXISTS UsuariosWPP (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    foto_perfil VARCHAR(255)
);

-- Crear tabla de Chats
CREATE TABLE IF NOT EXISTS ChatsWPP (
    id_chat INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    es_grupo BOOLEAN DEFAULT FALSE,
    participantes INT DEFAULT 2,
    foto_grupo VARCHAR(255)
);

-- Crear tabla intermedia UsuariosPorChat
CREATE TABLE IF NOT EXISTS UsuariosPorChatWPP (
    id_usuario_chat INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_chat INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES UsuariosWPP(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_chat) REFERENCES ChatsWPP(id_chat) ON DELETE CASCADE
);

-- Crear tabla de Mensajes
CREATE TABLE IF NOT EXISTS MensajesWPP (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    fecha_mensaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,
    id_usuario_chat INT NOT NULL,
    FOREIGN KEY (id_usuario_chat) REFERENCES UsuariosPorChatWPP(id_usuario_chat) ON DELETE CASCADE
);