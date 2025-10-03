// src/app/Register/page.js
"use client";

/* =========================================================
REGISTER Page
========================================================= */

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/Styles/LoginRegister.module.css";

const API = "http://localhost:4000";

export default function RegisterPage() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ nombre, correo, contrasena }),
        });
        if (!res.ok) {
            const msg =
            res.status === 409 ? "El correo ya está registrado" : "Error servidor (register)";
            alert(msg);
            return;
        }
        router.push("/Chats");
        } catch (err) {
        console.error(err);
        alert("Error servidor (register)");
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
            <span className={styles.LogoBlack}>Regístrate</span>
            </h1>

            <form className={styles.form} onSubmit={onSubmit}>
            <input
                className={styles.input}
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
            />
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

            <button className={styles.button} type="submit" disabled={loading}>
                {loading ? "Creando..." : "¡Regístrate!"}
            </button>
            </form>

            <div className={styles.footer}>
            ¿Ya tienes una cuenta? <a href="/Login">Inicia Sesión</a>
            </div>
        </div>
        </div>
    );
}
