// ====================================================================
// index.js  |  Express + express-session + Socket.IO + MySQL (tablas WPP)
// ====================================================================
// Tablas MySQL utilizadas:
//   - UsuariosWPP(id_usuario, nombre, correo, contrasena, numero, foto_perfil)
//   - ChatsWPP(id_chat, nombre, foto_grupo, es_grupo, participantes)
//   - UsuariosPorChatWPP(id_usuario_chat, id_usuario, id_chat)
//   - MensajesWPP(id_mensaje, texto, fecha_mensaje, leido, id_usuario_chat)
// ====================================================================

require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const http = require("http");
const { realizarQuery } = require("./modulos/mysql");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
	origin: ["http://localhost:3000", "http://localhost:3001"],
	credentials: true,
	}));
	app.use(express.json());

// Sesión (compartida con Socket.IO)
	const sessionMiddleware = session({
	secret: "pandy",
	resave: false,
	saveUninitialized: false,
	cookie: { httpOnly: true },
	});
	app.use(sessionMiddleware);

// HTTP + Socket.IO
	const server = http.createServer(app);
	const io = require("socket.io")(server, {
	cors: {
		origin: ["http://localhost:3000", "http://localhost:3001"],
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	},
	});
	io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

// Utilidades
	const q = (s = "") => String(s).replace(/'/g, "''");
	const toNum = (v) => Number.isFinite(Number(v)) ? Number(v) : NaN;

// Eventos Socket.IO
	io.on("connection", (socket) => {
	const sess = socket.request.session;
	console.log("🔌 Cliente conectado:", socket.id, "| userId:", sess?.userId ?? "-");

	socket.on("joinChat", (idChat) => {
		const n = toNum(idChat);
		if (!Number.isFinite(n)) return;
		socket.join(`chat:${n}`);
	});

	socket.on("pingAll", (data) => {
		io.emit("pingAll", { event: "pingAll", message: data });
	});

	socket.on("disconnect", () => {
		console.log("❌ Cliente desconectado:", socket.id);
	});
	});

// Middleware de auth
	function requireLogin(req, res, next) {
	if (!req.session.userId) return res.status(401).json({ ok: false, msg: "No logueado" });
	next();
	}

// ====================================================================
// Auth
// ====================================================================

// Registro
	app.post("/register", async (req, res) => {
	try {
		const { nombre, correo, contrasena, numero, foto_perfil } = req.body;

		const existe = await realizarQuery(
		`SELECT id_usuario FROM UsuariosWPP WHERE correo='${q(correo)}' LIMIT 1`
		);
		if (existe.length) return res.json({ ok: false, msg: "El correo ya está registrado" });

		const hash = await bcrypt.hash(contrasena, 10);

		const result = await realizarQuery(`
		INSERT INTO UsuariosWPP (nombre, correo, contrasena, numero, foto_perfil)
		VALUES ('${q(nombre)}', '${q(correo)}', '${q(hash)}',
				${numero ? `'${q(numero)}'` : "NULL"},
				${foto_perfil ? `'${q(foto_perfil)}'` : "NULL"})
		`);

		const id_usuario = result.insertId;
		req.session.userId = id_usuario;
		req.session.nombre = nombre;

		res.json({ ok: true, user: { id_usuario, nombre, correo } });

	} catch (err) {
		console.error("REGISTER ERROR:", err);  // ← imprime stack/código
		res.status(500).json({ ok: false, msg: err.code || err.message || "Error servidor" });
	}
	});

// Login
	app.post("/login", async (req, res) => {
	try {
		const { correo, contrasena } = req.body;

		const rows = await realizarQuery(
		`SELECT id_usuario, nombre, contrasena FROM UsuariosWPP WHERE correo='${q(correo)}'`
		);
		if (!rows.length) return res.json({ ok: false, msg: "Usuario no encontrado" });

		const user = rows[0];
		const ok = await bcrypt.compare(contrasena, user.contrasena);
		if (!ok) return res.json({ ok: false, msg: "Credenciales inválidas" });

		req.session.userId = user.id_usuario;
		req.session.nombre = user.nombre;

		res.json({ ok: true, user: { id_usuario: user.id_usuario, nombre: user.nombre, correo } });
		
	} catch (err) {
		console.error("LOGIN ERROR:", err);
		res.status(500).json({ ok: false, msg: err.code || err.message || "Error servidor" });
	}
	});

// Logout
	app.post("/logout", (req, res) => {
	req.session.destroy(() => res.json({ ok: true }));
	});

// Sesión actual
	app.get("/me", (req, res) => {
	if (!req.session.userId) return res.status(401).json({ ok: false });
	res.json({ ok: true, user: { id_usuario: req.session.userId, nombre: req.session.nombre } });
	});

// ====================================================================
// Chats & Mensajes
// ====================================================================

// Listar chats del usuario logueado
	app.get("/chats", requireLogin, async (req, res) => {
	try {
		const idUsuario = req.session.userId;

		const chats = await realizarQuery(`
		SELECT c.id_chat, c.nombre, c.foto_grupo, c.es_grupo, c.participantes
		FROM ChatsWPP c
		JOIN UsuariosPorChatWPP uc ON uc.id_chat = c.id_chat
		WHERE uc.id_usuario = ${toNum(idUsuario)}
		ORDER BY c.id_chat DESC
		`);

		res.json({ ok: true, chats });
	} catch (err) {
		console.error(err);
		res.status(500).json({ ok: false, msg: "Error servidor" });
	}
	});

// Mensajes de un chat
	app.get("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const idChat = toNum(req.params.id);
		if (!Number.isFinite(idChat)) return res.status(400).json({ ok: false, msg: "id_chat inválido" });

		const pertenece = await realizarQuery(
		`SELECT 1 FROM UsuariosPorChatWPP WHERE id_usuario=${toNum(req.session.userId)} AND id_chat=${idChat} LIMIT 1`
		);
		if (!pertenece.length) return res.status(403).json({ ok: false, msg: "No perteneces a este chat" });

		const mensajes = await realizarQuery(`
		SELECT 
			m.id_mensaje, m.texto, m.fecha_mensaje, m.leido,
			u.id_usuario, u.nombre, u.foto_perfil
		FROM MensajesWPP m
		JOIN UsuariosPorChatWPP uc ON m.id_usuario_chat = uc.id_usuario_chat
		JOIN UsuariosWPP u ON uc.id_usuario = u.id_usuario
		WHERE uc.id_chat = ${idChat}
		ORDER BY m.fecha_mensaje ASC
		`);

		res.json({ ok: true, mensajes });
	} catch (err) {
		console.error(err);
		res.status(500).json({ ok: false, msg: "Error servidor" });
	}
	});

// Enviar mensaje
	app.post("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const idChat = toNum(req.params.id);
		const { texto } = req.body;
		if (!Number.isFinite(idChat) || !texto?.trim()) return res.status(400).json({ ok: false, msg: "Datos inválidos" });

		const rows = await realizarQuery(
		`SELECT id_usuario_chat 
			FROM UsuariosPorChatWPP 
			WHERE id_usuario=${toNum(req.session.userId)} AND id_chat=${idChat}
			LIMIT 1`
		);
		if (!rows.length) return res.status(403).json({ ok: false, msg: "No perteneces a este chat" });

		const id_usuario_chat = rows[0].id_usuario_chat;

		const insert = await realizarQuery(`
		INSERT INTO MensajesWPP (texto, fecha_mensaje, leido, id_usuario_chat)
		VALUES ('${q(texto)}', NOW(), 0, ${id_usuario_chat})
		`);
		const id_mensaje = insert.insertId;

		const payload = {
		id_mensaje,
		id_chat: idChat,
		texto,
		fecha_mensaje: new Date().toISOString(),
		leido: 0,
		id_usuario: req.session.userId,
		nombre: req.session.nombre,
		};

		io.to(`chat:${idChat}`).emit("nuevoMensaje", payload);
		res.json({ ok: true, mensaje: payload });
	} catch (err) {
		console.error(err);
		res.status(500).json({ ok: false, msg: "Error servidor" });
	}
});

// Start
server.listen(port, () => {
	console.log(`🚀 API lista en http://localhost:${port}/`);
});
