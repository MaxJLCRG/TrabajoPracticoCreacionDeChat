"use client";

import { useState } from "react";
import styles from "@/app/Styles/LoginRegister.module.css";
import Head from "next/head";

export default function ImageAggregationPage() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
        setImage(file);
        setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <>
        <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com"></link>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""></link>
            <link
            href="https://fonts.googleapis.com/css2?family=Libertinus+Keyboard&display=swap"
            rel="stylesheet"
            ></link>
        </Head>

        <div className={styles.container}>
            <div className={styles.card}>
            <h1 className={styles.logo}>
                <span className={styles.logoGreen1}>WAT</span>
                <span className={styles.logoGreen2}>SAP</span>
                <br />
                <span className={styles.LogoBlack}>Agrega tu Foto</span>
            </h1>

            {/* Dropzone */}
            <div className={styles.dropzone} onClick={() => document.getElementById("fileInput").click()} >
            {preview ? (<img src={preview} alt="preview" className={styles.preview} />) : (<p className={styles.dropzoneText}> Arrastra o haz click para subir una imagen </p> )}
            </div>

            {/* Input oculto */}
            <input
                id="fileInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
            />

            {/* Texto guía */}
            <p style={{ fontSize: "0.9rem", color: "darkgrey", marginBottom: "1rem" }}>
                Sube una foto y ajustala en el recuadro antes de registrarte.
            </p>

            {/* Botón final */}
            <button type="button" className={styles.button}>
                ¡Registrate!
            </button>
            </div>
        </div>
        </>
    );
}
