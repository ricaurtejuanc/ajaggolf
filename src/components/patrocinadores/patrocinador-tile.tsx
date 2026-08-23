"use client";

import { useState } from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import type { Patrocinador } from "@/types/database";

export function PatrocinadorTile({ patrocinador }: { patrocinador: Patrocinador }) {
  const [mostrarTelefono, setMostrarTelefono] = useState(false);

  const logo = (
    <div className="relative aspect-[3/2] w-full">
      <Image
        src={patrocinador.logo_url}
        alt={patrocinador.nombre}
        fill
        unoptimized
        className="object-contain p-4"
        sizes="(min-width: 768px) 25vw, 50vw"
      />
    </div>
  );

  if (patrocinador.web) {
    return (
      <a
        href={patrocinador.web}
        target="_blank"
        rel="noopener noreferrer"
        className="card-ajag flex flex-col items-center justify-center p-2 transition hover:shadow-md"
        title={patrocinador.nombre}
      >
        {logo}
      </a>
    );
  }

  if (patrocinador.telefono) {
    return (
      <button
        type="button"
        onClick={() => setMostrarTelefono((v) => !v)}
        className="card-ajag flex flex-col items-center justify-center gap-2 p-2 transition hover:shadow-md"
        title={patrocinador.nombre}
      >
        {logo}
        {mostrarTelefono ? (
          <span className="flex items-center gap-1.5 pb-2 text-sm font-medium text-ajag-verde-900">
            <Phone size={14} /> {patrocinador.telefono}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="card-ajag flex flex-col items-center justify-center p-2" title={patrocinador.nombre}>
      {logo}
    </div>
  );
}
