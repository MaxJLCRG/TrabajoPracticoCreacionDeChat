"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/Styles/LoginRegister.module.css";

const API = "http://localhost:4000";

export default function ImageAggregationPage() {
    const [me, setMe] = useState(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [imgEl, setImgEl] = useState(null); // HTMLImageElement
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);

    const containerRef = useRef(null);

    // Carga usuario: si no hay sesión, podría redirigir a Login
    useEffect(() => {
        (async () => {
        try {
            const r = await fetch(`${API}/me`, { credentials: "include" });
            const d = await r.json();
            if (d.ok) setMe(d.user);
        } catch {}
        })();
    }, []);

    const onFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setImgSrc(e.target.result);
        reader.readAsDataURL(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        onFile(f);
    };
    const onChangeFile = (e) => onFile(e.target.files?.[0]);

    const onMouseDown = (e) => {
        if (!imgSrc) return;
        setDragging(true);
        setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };
    const onMouseMove = (e) => {
        if (!dragging) return;
        setPos({ x: e.clientX - start.x, y: e.clientY - start.y });
    };
    const onMouseUp = () => setDragging(false);
    const onWheel = (e) => {
        if (!imgSrc) return;
        const delta = e.deltaY > 0 ? -0.06 : 0.06;
        setScale((s) => Math.min(4, Math.max(0.4, s + delta)));
    };

    // Guardar: renderiza a un canvas cuadrado y envía como PNG
    const guardar = async () => {
        if (!imgEl) return;
        setSaving(true);

        // dimensiones del recuadro circular
        const box = containerRef.current.getBoundingClientRect();
        const cropSize = Math.min(box.width, box.height); // cuadrado interno
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512; // tamaño de salida
        const ctx = canvas.getContext("2d");

        // FONDO transparente
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Círculo (máscara)
        ctx.save();
        ctx.beginPath();
        ctx.arc(256, 256, 256, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calcular escala y offset respecto al recuadro visible
        // 1px en el recuadro equivale a (img natural / visible) * (canvas/cropSize)
        const scaleToVisible = scale * (imgEl.naturalWidth / imgEl.width);
        const factor = canvas.width / cropSize;

        // Posición de la imagen dentro del contenedor:
        // - pos.x/pos.y son px movidos en el recuadro; trasladar al canvas con factor
        const dx = pos.x * factor;
        const dy = pos.y * factor;

        // Tamaño de la imagen renderizada dentro del recuadro
        const drawW = imgEl.naturalWidth / (imgEl.width / (cropSize * scale));
        const drawH = imgEl.naturalHeight / (imgEl.height / (cropSize * scale));

        // Para simplificar: dibujar la imagen escalada tomando como marco el cuadro
        // Convertimos el posicionamiento al canvas:
        const renderW = imgEl.naturalWidth * scaleToVisible * factor / (imgEl.naturalWidth / imgEl.width);
        const renderH = imgEl.naturalHeight * scaleToVisible * factor / (imgEl.naturalHeight / imgEl.height);

        // Punto de inicio para centrar y luego aplicar offset (dx,dy)
        const cx = (canvas.width - renderW) / 2 + dx;
        const cy = (canvas.height - renderH) / 2 + dy;

        ctx.drawImage(imgEl, cx, cy, renderW, renderH);
        ctx.restore();

        // Exportar
        canvas.toBlob(async (blob) => {
        const fd = new FormData();
        fd.append("avatar", blob, "avatar.png");
        try {
            const r = await fetch(`${API}/profile/avatar`, {
            method: "POST",
            body: fd,
            credentials: "include",
            });
            const d = await r.json();
            if (d.ok) {
            alert("Avatar actualizado");
            // opcional: volver a Chats
            // window.location.href = "/Chats";
            } else {
            alert(d.msg || "No se pudo guardar");
            }
        } catch (err) {
            alert("Error de red");
        } finally {
            setSaving(false);
        }
        }, "image/png", 0.95);
    };

    return (
        <div className={styles.container} style={{ minHeight: "100vh" }}>
        <div className={styles.card} style={{ width: "min(92vw, 640px)" }}>
            {/* Branding */}
            <div className={styles.logo}>
            <span className={styles.logoGreen1}>WAT</span>
            <span className={styles.logoGreen2}> SAP</span>
            </div>
            <h2 className={styles.LogoBlack} style={{ textAlign: "center", marginTop: -6 }}>
            Agrega tu Foto
            </h2>

            <p style={{ textAlign: "center", color: "#8e8e8e", marginTop: 6 }}>
            Arrastra o haz click para subir una imagen
            <br />
            Ajusta la posición y el zoom. El recorte será circular.
            </p>

            {/* Zona de recorte */}
            <div
            ref={containerRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            style={{
                width: "100%",
                height: 360,
                marginTop: 12,
                borderRadius: 16,
                background: "#f7f7f7",
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
                boxShadow: "inset 0 0 0 1px #eaeaea",
            }}
            >
            {/* máscara visual circular */}
            <div
                style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
                }}
            >
                <div
                style={{
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    boxShadow:
                    "0 0 0 9999px rgba(0,0,0,.45), 0 0 0 2px rgba(255,255,255,.9)",
                }}
                />
            </div>

            {/* imagen posicionable */}
            {imgSrc ? (
                <img
                src={imgSrc}
                alt="preview"
                ref={(el) => setImgEl(el)}
                draggable={false}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
                    transformOrigin: "center",
                    maxWidth: "none",
                    maxHeight: "none",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
                />
            ) : (
                <label
                htmlFor="file"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "#8a8a8a",
                    cursor: "pointer",
                }}
                >
                <div>Soltá tu imagen aquí o haz click</div>
                </label>
            )}

            {/* input file oculto */}
            <input id="file" type="file" accept="image/*" style={{ display: "none" }} onChange={onChangeFile} />
            </div>

            {/* Controles */}
            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <div className={styles.inp} style={{ justifyContent: "center" }}>
                Zoom
                <input
                type="range"
                min="0.4"
                max="4"
                step="0.02"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{ width: 240, marginLeft: 10 }}
                />
            </div>
            </div>

            {/* Botón guardar */}
            <div style={{ marginTop: 16 }}>
            <button className={styles.button} onClick={guardar} disabled={!imgSrc || saving}>
                {saving ? "Guardando..." : "¡Registrar avatar!"}
            </button>
            </div>
        </div>
        </div>
    );
}
