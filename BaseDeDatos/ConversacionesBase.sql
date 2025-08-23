-- UsuariosWPP
INSERT INTO UsuariosWPP (nombre, mail, password) VALUES
('Juan Perez', 'juan@mail.com', '1234'),
('Maria Gomez', 'maria@mail.com', '1234'),
('Pedro Lopez', 'pedro@mail.com', '1234');

-- Chats
INSERT INTO ChatsWPP () VALUES (), ();

-- Asignación de usuarios a chats
INSERT INTO UsuariosChatsWPP (id_usuario, id_chat) VALUES
(1, 1), (2, 1),
(2, 2), (3, 2);

-- Mensajes
INSERT INTO MensajesWPP (id_chat, id_usuario, contenido) VALUES
(1, 1, 'Hola María!'),
(1, 2, 'Hola Juan, ¿cómo estás?'),
(2, 2, 'Hola Pedro'),
(2, 3, 'Todo bien, ¿y vos?');