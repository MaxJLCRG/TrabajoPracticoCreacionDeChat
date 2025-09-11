"use client"

import styles from "@/app/Styles/LoginRegister.module.css";
import Head from "next/head";
import Link from "next/link";
import Button from "@/app/Components/Button.js"
import Input from "@/app/Components/Input.js"

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
            <Input className={styles.input} type="text" placeholder="Username"/>
            <Input className={styles.input} type="password" placeholder="Password"/>

            <div className={styles.options}>
              
              <Link href="/Register">¿Has perdido tu contraseña?</Link>
            </div>

            <button type="submit" className={styles.button}>Siguiente . . .</button>

          </form>
          <label className="inp">
              <Input className="pto" type="checkbox"/> Recuérdame
          </label>

          <p className={styles.footer}>
            <Link href="/Register" >¿No tienes una cuenta? Regístrate</Link>
          </p>
        </div>
      </div>
    </>
  );
}