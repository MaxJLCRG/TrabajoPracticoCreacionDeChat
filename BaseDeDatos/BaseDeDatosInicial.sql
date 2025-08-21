CREATE TABLE UsuariosWPP (
id_usuario INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(50) NOT NULL,
mail VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(100) NOT NULL,
foto VARCHAR(255) DEFAULT 'default.png'
);

CREATE TABLE ChatsWPP (
id_chat INT AUTO_INCREMENT PRIMARY KEY,
fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UsuariosChatsWPP (
id_usuario INT,
id_chat INT,
PRIMARY KEY (id_usuario, id_chat),
FOREIGN KEY (id_usuario) REFERENCES UsuariosWPP(id_usuario),
FOREIGN KEY (id_chat) REFERENCES ChatsWPP(id_chat)
);

CREATE TABLE MensajesWPP (
id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
id_chat INT,
id_usuario INT,
contenido TEXT NOT NULL,
fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (id_chat) REFERENCES ChatsWPP(id_chat),
FOREIGN KEY (id_usuario) REFERENCES UsuariosWPP(id_usuario)
);