"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:4000";

export default function RegisterPage() {
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ nombre, correo, contrasena }),
        });
        const data = await res.json();
        if (data.ok) {
            router.push("/Chats");
        } else {
            alert(data.msg || "No se pudo registrar");
        }
        } catch (err) {
        console.error(err);
        alert("Error de red");
        } finally {
        setLoading(false);
        }
    };

    return (
        <main style={{ maxWidth: 420, margin: "40px auto" }}>
        <h1>Crear cuenta</h1>
        <form onSubmit={onSubmit}>
            <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
            />
            <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
            />
            <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
            />
            <button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Registrarme"}
            </button>
        </form>
        </main>
    );
}
