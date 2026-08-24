import { Trophy } from "lucide-react";
import type { Torneo } from "@/types/database";

export function CuadroDeHonor({ torneo }: { torneo: Torneo }) {
  const categorias = torneo.premios
    .map((cat, indiceCategoria) => ({
      nombre: cat.nombre,
      premios: cat.premios
        .map((premio, indicePremio) => ({
          premio,
          ganadores: torneo.premios_ganadores[`${indiceCategoria}-${indicePremio}`] ?? [],
        }))
        .filter((p) => p.ganadores.length > 0),
    }))
    .filter((cat) => cat.premios.length > 0);

  if (categorias.length === 0) return null;

  return (
    <div className="card-ajag p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ajag-verde-900">
        <Trophy size={18} className="text-ajag-oro-600" /> Cuadro de honor
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {categorias.map((cat) => (
          <div key={cat.nombre}>
            <p className="text-sm font-medium text-ajag-verde-900">{cat.nombre}</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {cat.premios.map((p) => (
                <li key={p.premio} className="text-sm text-ajag-verde-900">
                  <span className="text-ajag-gris-500">{p.premio}: </span>
                  <span className="font-medium">{p.ganadores.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
