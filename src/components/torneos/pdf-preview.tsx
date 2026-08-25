"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vista previa de la primera página de un PDF, renderizada a un <canvas>
 * escalado para llenar el ancho del contenedor. En vez de un <iframe> con
 * el visor nativo del navegador (poco fiable: Safari/iOS y buena parte de
 * los navegadores móviles ignoran los parámetros de zoom del fragmento de
 * la URL — #view=Fit — y muestran el PDF a tamaño fijo, recortado), esto
 * garantiza el mismo resultado ("fijo", sin scroll/zoom, pero encajado en
 * el recuadro) en cualquier dispositivo.
 */
export function PdfPreview({ url, alt }: { url: string; alt: string }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    let cancelado = false;

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        const page = await pdf.getPage(1);
        if (cancelado) return;

        const contenedor = contenedorRef.current;
        const canvas = canvasRef.current;
        if (!contenedor || !canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const anchoDisponible = contenedor.clientWidth || 640;
        const viewportBase = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (anchoDisponible / viewportBase.width) * dpr });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        const contexto = canvas.getContext("2d");
        if (!contexto) return;
        await page.render({ canvasContext: contexto, viewport }).promise;
        if (!cancelado) setEstado("listo");
      } catch (err) {
        console.error("Error renderizando la vista previa del PDF:", err);
        if (!cancelado) setEstado("error");
      }
    }

    render();
    return () => {
      cancelado = true;
    };
  }, [url]);

  if (estado === "error") {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-ajag-gris-100 bg-ajag-gris-50 p-4 text-center text-sm text-ajag-gris-500">
        No se ha podido mostrar la vista previa. Ábrelo en una pestaña nueva.
      </div>
    );
  }

  return (
    <div
      ref={contenedorRef}
      className="w-full overflow-hidden rounded-2xl border border-ajag-gris-100 bg-white"
    >
      {estado === "cargando" ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-ajag-gris-500">
          Cargando…
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={estado === "listo" ? "block w-full" : "hidden"}
      />
    </div>
  );
}
