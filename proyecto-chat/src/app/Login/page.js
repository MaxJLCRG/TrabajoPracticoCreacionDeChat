"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:4000";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante para la cookie de sesión
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/Chats");
      } else {
        alert(data.msg || "Error de login");
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
      <h1>Iniciar sesión</h1>
      <form onSubmit={onSubmit}>
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
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
