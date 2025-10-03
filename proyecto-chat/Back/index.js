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

// ── .env (toma el primero que exista /Back)
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

// Health check (útil para probar puerto)
app.get("/__health", (req, res) => res.json({ ok: true, msg: "alive" }));

// --------------------------- REGISTER -------------------------------
app.post("/register", async (req, res) => {
	try {
		const { nombre, correo, contrasena } = req.body || {};
		if (!nombre || !correo || !contrasena)
		return res.status(400).json({ ok: false, msg: "Faltan datos" });

		// ¿ya existe?
		const existe = await realizarQuery(`
		SELECT id_usuario FROM UsuariosWPP WHERE correo='${q(correo)}' LIMIT 1
		`);
		if (existe?.length) {
		return res.status(409).json({ ok: false, msg: "El correo ya está registrado" });
		}

		const hash = await bcrypt.hash(contrasena, 10);
		const ins = await realizarQuery(`
		INSERT INTO UsuariosWPP (nombre, correo, contrasena, numero, foto_perfil)
		VALUES ('${q(nombre)}', '${q(correo)}', '${q(hash)}', NULL, NULL)
		`);

		req.session.userId = ins.insertId;
		res.json({ ok: true, user: { id_usuario: ins.insertId, nombre, correo } });
	} catch (err) {
		console.error("REGISTER ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (register)" });
	}
});

// ----------------------------- LOGIN --------------------------------
app.post("/login", async (req, res) => {
	try {
		const { correo, contrasena } = req.body || {};
		if (!correo || !contrasena)
		return res.status(400).json({ ok: false, msg: "Faltan credenciales" });

		const rows = await realizarQuery(`
		SELECT id_usuario, nombre, correo, contrasena, foto_perfil
		FROM UsuariosWPP
		WHERE correo='${q(correo)}'
		LIMIT 1
    `);
    if (!rows?.length) return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });

    const user = rows[0];
    const okPass = await bcrypt.compare(contrasena, user.contrasena || "");
    if (!okPass) return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });

    req.session.userId = user.id_usuario;
    res.json({ ok: true, user: { id_usuario: user.id_usuario, nombre: user.nombre, correo: user.correo, foto_perfil: user.foto_perfil } });
	} catch (err) {
		console.error("LOGIN ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (login)" });
	}
});

// ------------------------------ ME ----------------------------------
app.get("/me", async (req, res) => {
	try {	
    const userId = Number(req.session?.userId);
    if (!userId) return res.json({ ok: false });

    const u = await realizarQuery(`
		SELECT id_usuario, nombre, correo, foto_perfil
		FROM UsuariosWPP
		WHERE id_usuario=${userId}
		LIMIT 1
    `);
    if (!u?.length) return res.json({ ok: false });

    res.json({ ok: true, user: u[0] });
	} catch {
		res.json({ ok: false });
	}
});

// ---------------------------- LOGOUT --------------------------------
app.post("/logout", (req, res) => {
	req.session?.destroy?.(() => res.json({ ok: true }));
});

// ----------------------- LISTA DE CHATS ------------------------------
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

// ------------------- MENSAJES DE UN CHAT ----------------------------
app.get("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const idChat = toNum(req.params.id);
		if (!Number.isFinite(idChat)) return res.status(400).json({ ok: false, msg: "idChat inválido" });

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

// Enviar mensaje
app.post("/chats/:id/mensajes", requireLogin, async (req, res) => {
	try {
		const userId = Number(req.session.userId);
		const idChat = toNum(req.params.id);
		const { texto } = req.body || {};
		if (!Number.isFinite(idChat)) return res.status(400).json({ ok: false, msg: "idChat inválido" });
		if (!texto?.trim()) return res.status(400).json({ ok: false, msg: "Texto vacío" });

// buscar id_usuario_chat del remitente en ese chat
    const uc = await realizarQuery(`
		SELECT id_usuario_chat
		FROM UsuariosPorChatWPP
		WHERE id_chat = ${idChat} AND id_usuario = ${userId}
		LIMIT 1
    `);
    if (!uc?.length) return res.status(403).json({ ok: false, msg: "No perteneces a este chat" });

    const ins = await realizarQuery(`
		INSERT INTO MensajesWPP (texto, fecha_mensaje, leido, id_usuario_chat)
		VALUES ('${q(texto)}', NOW(), 0, ${uc[0].id_usuario_chat})
    `);

// payload para socket
    const remitente = await realizarQuery(`
		SELECT id_usuario, nombre FROM UsuariosWPP WHERE id_usuario=${userId} LIMIT 1
    `);

    const msg = {
		id_mensaje: ins.insertId,
		texto,
		fecha_mensaje: new Date(),
		leido: 0,
		id_usuario: userId,
		nombre: remitente?.[0]?.nombre || "Usuario",
		id_chat: idChat,
    };

    io.to(`chat:${idChat}`).emit("nuevoMensaje", msg);
    res.json({ ok: true, msg });
	} catch (err) {
		console.error("POST /chats/:id/mensajes ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (enviar mensaje)" });
	}
});

// -------------------- INVITAR POR CORREO A UN CHAT ------------------
app.post("/chats/:id/invite", requireLogin, async (req, res) => {
	try {
    const idChat = toNum(req.params.id);
    const { correo } = req.body || {};
    if (!Number.isFinite(idChat)) return res.status(400).json({ ok: false, msg: "idChat inválido" });
    if (!correo) return res.status(400).json({ ok: false, msg: "Falta correo" });

    const u = await realizarQuery(`
		SELECT id_usuario FROM UsuariosWPP WHERE correo='${q(correo)}' LIMIT 1
    `);
    if (!u?.length) return res.status(404).json({ ok: false, msg: "No existe usuario con ese correo" });

    const invitedId = Number(u[0].id_usuario);

    const ya = await realizarQuery(`
		SELECT 1 FROM UsuariosPorChatWPP WHERE id_chat=${idChat} AND id_usuario=${invitedId} LIMIT 1
		`);
		if (ya?.length) return res.json({ ok: true, msg: "Ya era miembro" });

		await realizarQuery(`
		INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
		VALUES (${invitedId}, ${idChat})
		`);

		io.to(`user:${invitedId}`).emit?.("chatCreado", { id_chat: idChat });
		res.json({ ok: true, msg: "Usuario invitado" });
	} catch (err) {
		console.error("POST /chats/:id/invite ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (invite)" });
	}
	});

// ------------------- CREAR GRUPO CON CORREOS ------------------------
app.post("/chats", requireLogin, async (req, res) => {
	try {
		const userId = Number(req.session.userId);
		const { nombre, correos = [] } = req.body || {};
		if (!nombre?.trim()) return res.status(400).json({ ok: false, msg: "Falta nombre" });

    const ins = await realizarQuery(`
		INSERT INTO ChatsWPP (es_grupo, nombre, foto_grupo)
		VALUES (1, '${q(nombre)}', NULL)
    `);
    const idChat = ins.insertId;

// Agregar creador
    await realizarQuery(`
		INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
		VALUES (${userId}, ${idChat})
    `);

// Agregar mails válidos
	if (Array.isArray(correos) && correos.length) {
		const inUsers = await realizarQuery(`
			SELECT id_usuario, correo FROM UsuariosWPP
			WHERE correo IN (${correos.map((c) => `'${q(c)}'`).join(",")})
		`);
		if (inUsers?.length) {
			const values = inUsers
			.map((u) => `(${u.id_usuario}, ${idChat})`)
			.join(",");
			await realizarQuery(`
			INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
			VALUES ${values}
			`);
		}
		}

		io.emit("chatCreado", { id_chat: idChat });
		res.json({ ok: true, chat: { id_chat: idChat } });
	} catch (err) {
		console.error("POST /chats ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (crear chat)" });
	}
});

// ------------------ CREAR / REUTILIZAR CHAT 1:1 ---------------------
app.post("/chats/dm", requireLogin, async (req, res) => {
	try {
		const userId = Number(req.session.userId);
		const { correo } = req.body || {};
		if (!correo) return res.status(400).json({ ok: false, msg: "Falta correo" });

// Usuario destino
    const users = await realizarQuery(`
		SELECT id_usuario FROM UsuariosWPP WHERE correo='${q(correo)}' LIMIT 1
    `);
    if (!users?.length) {
		return res.status(404).json({ ok: false, msg: "No existe un usuario con ese correo" });
    }
    const otherId = Number(users[0].id_usuario);
    if (otherId === userId) {
		return res.status(400).json({ ok: false, msg: "No puedes crear un chat contigo mismo" });
    }

    const existing = await realizarQuery(`
		SELECT c.id_chat
		FROM ChatsWPP c
		JOIN UsuariosPorChatWPP u1 ON u1.id_chat = c.id_chat AND u1.id_usuario = ${userId}
		JOIN UsuariosPorChatWPP u2 ON u2.id_chat = c.id_chat AND u2.id_usuario = ${otherId}
		WHERE c.es_grupo = 0
		LIMIT 1
		`);
		if (existing?.length) {
		return res.json({ ok: true, chat: { id_chat: existing[0].id_chat }, reused: true });
    }

// Crear 1:1
		const insChat = await realizarQuery(`
		INSERT INTO ChatsWPP (es_grupo, nombre, foto_grupo)
		VALUES (0, NULL, NULL)
		`);
		const newChatId = insChat.insertId;

		await realizarQuery(`
		INSERT INTO UsuariosPorChatWPP (id_usuario, id_chat)
		VALUES (${userId}, ${newChatId}), (${otherId}, ${newChatId})
		`);

		io.to(`user:${userId}`).emit?.("chatCreado", { id_chat: newChatId });
		io.to(`user:${otherId}`).emit?.("chatCreado", { id_chat: newChatId });

		res.json({ ok: true, chat: { id_chat: newChatId } });
	} catch (err) {
		console.error("POST /chats/dm ERROR:", err);
		res.status(500).json({ ok: false, msg: "Error servidor (crear DM)" });
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
