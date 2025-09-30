"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/Styles/LoginRegister.module.css";

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
        credentials: "include",
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await res.json();
      if (data.ok) router.push("/Chats");
      else alert(data.msg || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>
          <span className={styles.logoGreen1}>WAT</span>
          <span className={styles.logoGreen2}>SAP</span><br />
          <span className={styles.LogoBlack}>Iniciar Sesion</span>
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

          <div className={styles.options}>¿Has perdido tu contraseña?</div>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Siguiente . . ."}
          </button>

          <label className={styles.inp}>
            <input className={styles.pto} type="checkbox" /> Recuérdame
          </label>
        </form>

        <p className={styles.footer}>
          ¿No tienes una cuenta? <a href="/Register">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
