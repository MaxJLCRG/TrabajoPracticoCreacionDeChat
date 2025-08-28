"use client"

import styles from "@/app/Styles/LoginRegister.module.css";
import Head from "next/head"

export default function LoginPage() {
  return (
    <>
      <div>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com"></link>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin></link>
          <link href="https://fonts.googleapis.com/css2?family=Libertinus+Keyboard&display=swap" rel="stylesheet"></link>
        </Head>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.logo}>
            <span className={styles.logoGreen1}>TP</span>
            <span className={styles.logoBlack}>.</span>
            <span className={styles.logoGreen2}>CHAT</span>
            <br></br>
            <span className={styles.LogoBlack}>Iniciar Sesion</span>
          </h1>

          <form className={styles.form}>
            <input type="text" placeholder="Username" className={styles.input} />
            <input type="password" placeholder="Password" className={styles.input} />

            <div className={styles.options}>
              <label>
                <input type="checkbox" /> Recuérdame
              </label>
              <a href="#">¿Has perdido tu contraseña?</a>
            </div>

            <button type="submit" className={styles.button}>Acceder</button>
          </form>

          <p className={styles.footer}>
            TP | Desarrollo web [PRUEBAS]
          </p>
        </div>
      </div>
    </>
        );
}

