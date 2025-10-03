// src/app/Login/page.js
"use client";

/* =========================================================
LOGIN Page
========================================================= */

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/Styles/LoginRegister.module.css";

const API = "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo, contrasena }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Credenciales inválidas\n${txt}`);
        return;
      }
      router.push("/Chats");
    } catch (err) {
      console.error(err);
      alert("Error servidor (login)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>
          <span className={styles.logoGreen1}>WAT</span>
          <span className={styles.logoGreen2}>SAP</span>{" "}
          <span className={styles.LogoBlack}>Iniciar Sesión</span>
        </h1>

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          <div className={styles.options}>
            <a href="#" onClick={(e) => e.preventDefault()}>
              ¿Has perdido tu contraseña?
            </a>
          </div>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Siguiente..."}
          </button>
        </form>

        <div className={styles.footer}>
          ¿No tienes una cuenta? <a href="/Register">Regístrate</a>
        </div>
      </div>
    </div>
  );
}
