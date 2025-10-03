-- Insertar usuarios (si no existen todavía)
INSERT INTO Usuarios (nombre, correo, contrasena, numero, foto_perfil)
VALUES 
('Juan Pérez', 'juan@mail.com', '1234', '111-1111', 'juan.jpg'),
('María López', 'maria@mail.com', '1234', '222-2222', 'maria.jpg'),
('Pedro Gómez', 'pedro@mail.com', '1234', '333-3333', 'pedro.jpg');

-- Crear chats
INSERT INTO Chats (nombre, es_grupo, participantes, foto_grupo)
VALUES 
('Chat Juan y María', FALSE, 2, NULL),
('Chat Grupo Amigos', TRUE, 3, 'grupo.jpg');

-- Relacionar usuarios con chats
INSERT INTO UsuariosPorChat (id_usuario, id_chat) VALUES 
(1, 1), -- Juan en chat 1
(2, 1), -- María en chat 1
(1, 2), -- Juan en chat 2
(2, 2), -- María en chat 2
(3, 2); -- Pedro en chat 2

-- Mensajes en el chat 1
INSERT INTO Mensajes (texto, id_usuario_chat) VALUES
('Hola María, ¿cómo estás?', 1),
('Todo bien Juan, ¿y vos?', 2);

-- Mensajes en el chat 2
INSERT INTO Mensajes (texto, id_usuario_chat) VALUES
('Hola chicos, ¿armamos algo para el finde?', 3),
('Sí, me parece genial.', 4),
('Yo también me sumo.', 5);
