"use client"

import styles from "@/app/Styles/LoginRegister.module.css";
import Head from "next/head"
import Link from "next/link";

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
            <span className={styles.logoGreen1}>WAT</span>
            <span className={styles.logoGreen2}>SAP</span>
            <br></br>
            <span className={styles.LogoBlack}>Registrate</span>
        </h1>

        <form className={styles.form}>
            <input type="text" placeholder="Username" className={styles.input} />
            <input type="password" placeholder="Password" className={styles.input} />

            <p style={{ letterSpacing: "1px", color: "darkgrey"}}>Confirma tus datos</p>

            <input type="text" placeholder="Username" className={styles.input} />
            <input type="password" placeholder="Password" className={styles.input} />

            <div className={styles.options}>
            <Link href="/Login">¿Ya tienes una cuenta Inicia Sesion?</Link>

            </div>

            <button type="submit" className={styles.button}>Siguiente . . .</button>
        </form>

        <p className={styles.footer}>

        </p>
        </div>
    </div>
    </>
        );
}