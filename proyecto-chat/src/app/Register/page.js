"use client"

import styles from "@/app/Styles/LoginRegister.module.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>
          <span className={styles.logoPurple}>TP</span>
          <span className={styles.logoBlack}>.</span>
          <span className={styles.logoOrange}>CHAT</span>
          <br></br>
          <span className={styles.LogoBlack}>Registrate</span>
        </h1>

        <form className={styles.form}>
          <input type="text" placeholder="Username" className={styles.input} />
          <input type="password" placeholder="Password" className={styles.input} />

          <div className={styles.options}>
            <label>
              <input type="checkbox" /> Recuérdame
            </label>
            <a href="#">¿Ya tienes una cuenta?</a>
          </div>

          <button type="submit" className={styles.button}>Registrate</button>
        </form>

        <p className={styles.footer}>
          TP | Desarrollo web [PRUEBAS]
        </p>
      </div>
    </div>
  );
}
