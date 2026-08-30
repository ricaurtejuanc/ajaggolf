import type { Metadata } from "next";
import { getUsuarioActual } from "@/lib/auth";
import { listarTeesCatalogo } from "@/lib/data/campos-tees";
import { CalculadoraHandicap } from "./calculadora";

export const metadata: Metadata = {
  title: "Calculadora de hándicap",
  description:
    "Calcula tu hándicap de juego antes de salir y tu resultado neto, Stableford y Score Differential al terminar la ronda, con las fórmulas del World Handicap System (WHS/RFEG).",
};

export default async function HandicapPage() {
  const [user, tees] = await Promise.all([getUsuarioActual(), listarTeesCatalogo()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
        Calculadora de hándicap
      </h1>
      <p className="mt-1 text-sm text-ajag-gris-500">
        Tu hándicap de juego antes de salir y tu resultado al terminar, con las fórmulas
        oficiales del World Handicap System (WHS / RFEG).
      </p>

      <div className="mt-6">
        <CalculadoraHandicap haySesion={Boolean(user)} catalogo={tees} />
      </div>
    </div>
  );
}
