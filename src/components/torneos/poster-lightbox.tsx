"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ZoomIn } from "lucide-react";

export function PosterLightbox({
  posterUrl,
  alt,
  focalX = 50,
  focalY = 50,
}: {
  posterUrl: string;
  alt: string;
  focalX?: number;
  focalY?: number;
}) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ajag-verde-100"
        aria-label="Ver póster completo"
      >
        <Image
          src={posterUrl}
          alt={alt}
          fill
          className="object-cover"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          sizes="100vw"
          priority
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ajag-verde-900">
            <ZoomIn size={14} /> Ver completo
          </span>
        </span>
      </button>

      {abierto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAbierto(false)}
        >
          <Link
            href="/torneos"
            onClick={(e) => e.stopPropagation()}
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            ← Calendario
          </Link>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <div className="relative h-full max-h-[90vh] w-full max-w-3xl">
            <Image
              src={posterUrl}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
