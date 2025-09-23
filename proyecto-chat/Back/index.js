const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

const server = app.listen(port, () => {
	console.log(`Servidor NodeJS corriendo en http://localhost:${port}/`);
});

const io = require("socket.io")(server, {
	cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // 👈 Frontend en 3000
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
	},
});

const sessionMiddleware = session({
	secret: "pandy",
	resave: false,
	saveUninitialized: false,
});

app.use(sessionMiddleware);

io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, next);
});

// Evento de prueba
io.on("connection", (socket) => {
	console.log("🔌 Cliente conectado:", socket.id);

	socket.on("pingAll", (data) => {
    console.log("📩 PING recibido:", data);
    io.emit("pingAll", { event: "pingAll", message: data });
	});

	socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
	});
});
