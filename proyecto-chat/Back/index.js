// Back/index.js
// ====================================================================
// Express + Session + Socket.IO + MySQL (tablas *WPP)
// Rutas: /register /login /me /logout /chats (lista)
//        /chats/:id/mensajes (GET/POST) /chats (POST crear grupo)
//        /chats/:id/invite (POST) + debug
// ====================================================================

// ── Imports
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const http = require("http");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { realizarQuery } = require("./modulos/mysql");

// ── .env (toma el primero que exista en /Back)
const envCandidates = [".home.env", ".pio.env", ".env"];
const chosenEnv =
	envCandidates.find((f) => fs.existsSync(path.join(__dirname, f))) || ".env";
dotenv.config({ path: path.join(__dirname, chosenEnv) });
console.log("🧩 ENV cargado:", chosenEnv);

// ── App/Server
const app = express();
const port = process.env.PORT || 4000;
app.set("trust proxy", 1);

// ── Middlewares base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: ["http://localhost:3000", "http://localhost:3001"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// ── Sesión
const sessionMiddleware = session({
	secret: "pandy",
	resave: false,
	saveUninitialized: false,
	cookie: { httpOnly: true, sameSite: "lax", secure: false },
});
app.use(sessionMiddleware);

// ── Estáticos
app.use("/public", express.static(path.join(__dirname, "public")));

// ── Multer (avatar; preparado por si lo usas luego)
const storage = multer.diskStorage({
	destination: (req, file, cb) =>
		cb(null, path.join(__dirname, "public", "avatars")),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname || ".png");
		cb(null, `u${req.session.userId || "guest"}_${Date.now()}${ext}`);
	},
});
const upload = multer({ storage });

// ── Helpers
const q = (s = "") => String(s).replace(/'/g, "''");
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : NaN);
function requireLogin(req, res, next) {
	if (!req.session?.userId)
		return res.status(401).json({ ok: false, msg: "No autenticado" });
	next();
	}

	// ── HTTP + Socket.IO
	const server = http.createServer(app);
	const io = require("socket.io")(server, {
	cors: { origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true },
	});
	io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

	io.on("connection", (socket) => {
	const sess = socket.request.session;
	console.log("🔌 Cliente conectado:", socket.id, "| userId:", sess?.userId ?? "-");

	socket.on("joinChat", (idChat) => {
		const n = toNum(idChat);
		if (!Number.isFinite(n)) return;
		socket.join(`chat:${n}`);
	});

	socket.on("disconnect", () => {
		console.log("❌ Cliente desconectado:", socket.id);
	});
});

// ====================================================================
// RUTAS PRINCIPALES
// ====================================================================

// Health
app.get("/__health", (req, res) => res.json({ ok: true, msg: "alive" }));

// REGISTER
app.post("/register", async (req, res) => {
	try {
		let { nombre, correo, contrasena } = req.body;
		if (!nombre || !correo || !contrasena) {
		return res.status(400).json({ ok: false, msg: "Faltan datos" });
		}
		correo = String(correo).trim().toLowerCase();

		const existe = await realizarQuery(`
		SELECT id_usuario FROM UsuariosWPP
		WHERE LOWER(correo)='${q(correo)}'
		LIMIT 1
		`);
		if (existe.length) {
		return res.status(409).json({ ok: false, msg: "El correo ya está registrado" });
		}

		const hash = await bcrypt.hash(contrasena, 10);
		const insert = await realizarQuery(`
		INSERT INTO UsuariosWPP (nombre, correo, contrasena, numero, foto_perfil)
		VALUES ('${q(nombre)}','${q(correo)}','${q(hash)}','', '')
		`);

		req.session.userId = insert.insertId;
		res.json({ ok: true, userId: insert.insertId });
	} catch (err) {
		console.error("REGISTER ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (register)" });
	}
	});

// LOGIN
app.post("/login", async (req, res) => {
	try {
		let { correo, contrasena } = req.body;
		if (!correo || !contrasena) {
		return res.status(400).json({ ok: false, msg: "Faltan datos" });
		}
		correo = String(correo).trim().toLowerCase();

		const rows = await realizarQuery(`
		SELECT id_usuario, nombre, correo, contrasena, foto_perfil
		FROM UsuariosWPP
		WHERE LOWER(correo)='${q(correo)}'
		LIMIT 1
		`);
		if (!rows.length) {
		return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
		}

		const user = rows[0];
		const stored = user.contrasena || "";
		let okPass = false;

		if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
		okPass = await bcrypt.compare(contrasena, stored);
		} else {
		okPass = stored === contrasena;
		if (okPass) {
			const newHash = await bcrypt.hash(contrasena, 10);
			await realizarQuery(`
			UPDATE UsuariosWPP SET contrasena='${q(newHash)}'
			WHERE id_usuario=${user.id_usuario}
			`);
		}
		}

		if (!okPass) {
		return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
		}

		req.session.userId = user.id_usuario;
		res.json({
		ok: true,
		user: {
			id_usuario: user.id_usuario,
			nombre: user.nombre,
			correo: user.correo,
			foto_perfil: user.foto_perfil,
		},
		});
	} catch (err) {
		console.error("LOGIN ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (login)" });
	}
	});

// ME
app.get("/me", requireLogin, async (req, res) => {
	try {
		const me = await realizarQuery(`
		SELECT id_usuario, nombre, correo, foto_perfil
		FROM UsuariosWPP
		WHERE id_usuario=${Number(req.session.userId)}
		LIMIT 1
		`);
		res.json({ ok: true, user: me[0] });
	} catch (err) {
		console.error("ME ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (me)" });
	}
});

// LOGOUT
app.post("/logout", (req, res) => {
	req.session.destroy(() => res.json({ ok: true }));
});

// LISTA DE CHATS del usuario
app.get("/chats", requireLogin, async (req, res) => {
	try {
		const userId = Number(req.session.userId);

		const chats = await realizarQuery(`
		SELECT
			c.id_chat,
			c.nombre,
			c.es_grupo,
			c.foto_grupo,
			(
			SELECT m1.texto
			FROM MensajesWPP m1
			JOIN UsuariosPorChatWPP uc1 ON m1.id_usuario_chat = uc1.id_usuario_chat
			WHERE uc1.id_chat = c.id_chat
			ORDER BY m1.fecha_mensaje DESC
			LIMIT 1
			) AS ultimo_texto,
			(
			SELECT m2.fecha_mensaje
			FROM MensajesWPP m2
			JOIN UsuariosPorChatWPP uc2 ON m2.id_usuario_chat = uc2.id_usuario_chat
			WHERE uc2.id_chat = c.id_chat
			ORDER BY m2.fecha_mensaje DESC
			LIMIT 1
			) AS ultima_fecha
		FROM ChatsWPP c
		JOIN UsuariosPorChatWPP uc ON uc.id_chat = c.id_chat
		WHERE uc.id_usuario = ${userId}
		ORDER BY COALESCE(ultima_fecha, '1900-01-01') DESC
		`);

		res.json({ ok: true, chats });
	} catch (err) {
		console.error("GET /chats ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (chats)" });
	}
});

// MENSAJES de un chat (GET)  — Ruta REST usada por el front
app.get("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const idChat = Number(req.params.id);

		const mensajes = await realizarQuery(`
		SELECT
			m.id_mensaje,
			m.texto,
			m.fecha_mensaje,
			m.leido,
			u.id_usuario,
			u.nombre,
			u.foto_perfil
		FROM MensajesWPP m
		JOIN UsuariosPorChatWPP uc ON m.id_usuario_chat = uc.id_usuario_chat
		JOIN UsuariosWPP u         ON uc.id_usuario = u.id_usuario
		WHERE uc.id_chat = ${idChat}
		ORDER BY m.fecha_mensaje ASC
		`);

		res.json({ ok: true, mensajes });
	} catch (err) {
		console.error("GET /chats/:id/mensajes ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (mensajes)" });
	}
});

// ENVIAR MENSAJE al chat (POST)
app.post("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const idChat = Number(req.params.id);
		const userId = Number(req.session.userId);
		const { texto } = req.body;

		if (!texto || !String(texto).trim()) {
		return res.status(400).json({ ok: false, msg: "Texto requerido" });
		}

		const rel = await realizarQuery(`
		SELECT id_usuario_chat FROM UsuariosPorChatWPP
		WHERE id_chat=${idChat} AND id_usuario=${userId}
		LIMIT 1
		`);
		if (!rel.length) {
		return res.status(403).json({ ok: false, msg: "No perteneces al chat" });
		}

		const uChatId = rel[0].id_usuario_chat;
		const ins = await realizarQuery(`
		INSERT INTO MensajesWPP (texto, fecha_mensaje, leido, id_usuario_chat)
		VALUES ('${q(texto)}', NOW(), 0, ${uChatId})
		`);

		// Obtener nombre del autor para enviar por socket
		const me = await realizarQuery(`
		SELECT nombre, foto_perfil FROM UsuariosWPP
		WHERE id_usuario=${userId} LIMIT 1
		`);

		const payload = {
		id_mensaje: ins.insertId,
		id_chat: idChat,
		id_usuario: userId,
		nombre: me[0]?.nombre ?? "Usuario",
		texto,
		fecha_mensaje: new Date().toISOString(),
		leido: 0,
		};

		io.to(`chat:${idChat}`).emit("nuevoMensaje", payload);
		res.json({ ok: true, mensaje: payload });
	} catch (err) {
		console.error("POST /chats/:id/mensajes ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (enviar)" });
	}
});

// CREAR GRUPO (POST)  body: { nombre, correos: [emails] }
app.post("/chats", requireLogin, async (req, res) => {
	try {
		const userId = Number(req.session.userId);
		const { nombre, correos = [] } = req.body;

		if (!nombre || !String(nombre).trim())
		return res.status(400).json({ ok: false, msg: "Nombre requerido" });

		// crear chat
		const chatIns = await realizarQuery(`
		INSERT INTO ChatsWPP (nombre, es_grupo, foto_grupo)
		VALUES ('${q(nombre)}', 1, '')
		`);
		const chatId = chatIns.insertId;

		// vincular creador
		await realizarQuery(`
		INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
		VALUES (${userId}, ${chatId})
		`);

		// invitar correos existentes
		for (const c of Array.isArray(correos) ? correos : []) {
		const correo = String(c).trim().toLowerCase();
		if (!correo) continue;

		const u = await realizarQuery(`
			SELECT id_usuario FROM UsuariosWPP
			WHERE LOWER(correo)='${q(correo)}' LIMIT 1
		`);
		if (!u.length) continue;

		const uid = u[0].id_usuario;
		const ya = await realizarQuery(`
			SELECT id_usuario_chat FROM UsuariosPorChatWPP
			WHERE id_usuario=${uid} AND id_chat=${chatId} LIMIT 1
		`);
		if (!ya.length) {
			await realizarQuery(`
			INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
			VALUES (${uid}, ${chatId})
			`);
		}
    }

		const chat = { id_chat: chatId, nombre, es_grupo: 1, foto_grupo: "" };
		io.emit("chatCreado", chat);
		res.json({ ok: true, chat });
	} catch (err) {
		console.error("POST /chats ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (crear grupo)" });
	}
});

// INVITAR por correo a un chat existente
app.post("/chats/:id/invite", requireLogin, async (req, res) => {
	try {
		const idChat = Number(req.params.id);
		const { correo } = req.body;
		if (!correo) return res.status(400).json({ ok: false, msg: "Correo requerido" });

		const c = String(correo).trim().toLowerCase();

		const u = await realizarQuery(`
		SELECT id_usuario FROM UsuariosWPP
		WHERE LOWER(correo)='${q(c)}' LIMIT 1
		`);
		if (!u.length) return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });

		const uid = u[0].id_usuario;

		const ya = await realizarQuery(`
		SELECT id_usuario_chat FROM UsuariosPorChatWPP
		WHERE id_usuario=${uid} AND id_chat=${idChat} LIMIT 1
		`);
		if (!ya.length) {
		await realizarQuery(`
			INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
			VALUES (${uid}, ${idChat})
		`);
		}

		res.json({ ok: true, msg: "Usuario agregado al chat" });
	} catch (err) {
		console.error("POST /chats/:id/invite ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (invitar)" });
	}
});

// ====================================================================
// RUTAS DE DEBUG
// ====================================================================
app.get("/debug/env", (req, res) => {
	res.json({
		MYSQL_HOST: process.env.MYSQL_HOST,
		MYSQL_USERNAME: process.env.MYSQL_USERNAME,
		MYSQL_DB: process.env.MYSQL_DB,
		MYSQL_PORT: process.env.MYSQL_PORT || 3306,
		cwd: process.cwd(),
		dirname: __dirname,
	});
});

app.get("/debug/db", async (req, res) => {
	try {
		const r = await realizarQuery("SELECT NOW() AS now");
		res.json({ ok: true, r });
	} catch (e) {
		res.status(500).json({ ok: false, error: String(e) });
	}
});

app.get("/debug/routes", (req, res) => {
	const routes = [];
	app._router.stack.forEach((m) => {
		if (m.route) {
		const methods = Object.keys(m.route.methods)
			.map((x) => x.toUpperCase())
			.join("|");
		routes.push(`${methods} ${m.route.path}`);
		}
	});
	res.json(routes);
});

// ====================================================================
// ARRANQUE
// ====================================================================
server.listen(port, () => {
	console.log(`🚀 API lista en http://localhost:${port}/`);
});
