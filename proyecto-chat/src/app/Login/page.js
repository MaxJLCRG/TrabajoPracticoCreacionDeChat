"use client"

import styles from "@/app/Styles/LoginRegister.module.css";
import Head from "next/head";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.logo}>
            <span className={styles.logoGreen1}>WAT</span>
            <span className={styles.logoGreen2}>SAP</span>
            <br />
            <span className={styles.LogoBlack}>Iniciar Sesion</span>
          </h1>

          <form className={styles.form}>
            <input type="text" placeholder="Username" className={styles.input} />
            <input type="password" placeholder="Password" className={styles.input} />

            <div className={styles.options}>
              
              <Link href="/Register">¿Has perdido tu contraseña?</Link>
            </div>

            <button type="submit" className={styles.button}>Acceder</button>
          </form>
          <label className="inp">
              <input type="checkbox" /> Recuérdame
          </label>

          <p className={styles.footer}>
            <Link href="/Register">¿No tienes una cuenta? Regístrate</Link>
          </p>
        </div>
      </div>
    </>
  );
}