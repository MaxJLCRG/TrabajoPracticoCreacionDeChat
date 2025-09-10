'use client'
import styles from './page.module.css';
import './globals.css'

export default function Page() {
    return (
        <div className={styles.container}>
        <header className={styles.header}>
            <div className={styles.logo}>WATSUP</div>
            <nav className={styles.nav}>
            <a href="#">Producto</a>
            <a href="#">Precios</a>
            <a href="#">Clientes</a>
            </nav>
            <div className={styles.actions}>
            <a className={styles.login} href="#">Inicia sesión</a>
            <button className={styles.greenButton}>Registrate</button>
            </div>
        </header>
        
        <main className={styles.main}>
            <h1>Absolutamente nadie usa WATSUP!!</h1>
            <p>La aplicacion de mensajería mas infradesarollada que hay, <br/>con la discreción que buscas y la seguridad que exiges. (Lo ultimo es mentira)</p>
            <div className={styles.inputGroup}>
            <button className={styles.greenButton}>Empieza gratis</button>
            </div>

            <div className={styles.clients}>
            <p>Las principales empresas eligen WATSUP</p>
            <div className={styles.logos}>
                <span>PayPal</span>
                <span>Hootsuite</span>
                <span>Airbus</span>
                <span>Hawaiian Airlines</span>
                <span>UMASS</span>
                <span>Capgemini</span>
                <span>Ninguna de las anteriores</span>
            </div>
            </div>
        </main>
        </div>
    );
}
