"use client";

import { useState, type ReactNode } from "react";

const PESTANAS = ["general", "honor"] as const;
type Pestana = (typeof PESTANAS)[number];

const etiquetaPestana: Record<Pestana, string> = {
  general: "Clasificación general",
  honor: "Cuadro de honor",
};

export function ClasificacionTabs({
  general,
  cuadroHonor,
}: {
  general: ReactNode;
  cuadroHonor: ReactNode | null;
}) {
  const [activa, setActiva] = useState<Pestana>("general");

  if (!cuadroHonor) return <div className="mt-6">{general}</div>;

  return (
    <div>
      <div className="mt-6 flex gap-2 border-b border-ajag-gris-100">
        {PESTANAS.map((pestana) => (
          <button
            key={pestana}
            type="button"
            onClick={() => setActiva(pestana)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activa === pestana
                ? "border-b-2 border-ajag-verde-700 text-ajag-verde-900"
                : "text-ajag-gris-500 hover:text-ajag-verde-700"
            }`}
          >
            {etiquetaPestana[pestana]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activa === "general" ? general : null}
        {activa === "honor" ? cuadroHonor : null}
      </div>
    </div>
  );
}
