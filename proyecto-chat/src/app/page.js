"use client"

import { useState } from "react";
import styles from "@/app/page.module.css";
import Head from "next/head";

export default function MenuPage() {
    return (
        <>
            <div className={styles.space1}>
                <h1 className={styles.space1h1}>¡Bienvenido/a a WATSUP!</h1>
                <br></br>
                <p className={styles.space1p1}>Gracias por unirte a WATSUP, tu nueva forma de mantenerte conectado con quienes más te importan.
Nuestra plataforma de mensajería te permite enviar mensajes instantáneos, compartir fotos, videos, notas de voz y mucho más, de forma rápida, segura y sencilla.

WATSUP está diseñada para que la comunicación sea tan fluida y cercana como una conversación cara a cara. Ya sea con amigos, familia o compañeros de trabajo, acá vas a poder mantenerte siempre al tanto.</p>
            </div>
            <div className={styles.space2}>
                <h1>GILLLLL</h1> 
            </div>
        </>

    )
}
