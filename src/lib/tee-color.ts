/**
 * Clases Tailwind para pintar la barra de salida con su color real (blanca,
 * amarilla, roja...), igual que en la tarjeta física del campo. El
 * catálogo de la RFEG solo usa BLANCAS/AMARILLAS/ROJAS hoy, pero se cubren
 * también las barras habituales que un admin podría teclear a mano.
 */
export function colorDeBarra(tee: string): { bg: string; border?: string } {
  const t = tee.toUpperCase();
  if (t.includes("BLANCA")) return { bg: "bg-white", border: "border border-ajag-gris-300" };
  if (t.includes("AMARILLA")) return { bg: "bg-yellow-400" };
  if (t.includes("ROJA")) return { bg: "bg-red-600" };
  if (t.includes("AZUL")) return { bg: "bg-blue-600" };
  if (t.includes("NEGRA")) return { bg: "bg-neutral-900" };
  if (t.includes("NARANJA")) return { bg: "bg-orange-500" };
  if (t.includes("VERDE")) return { bg: "bg-green-600" };
  return { bg: "bg-ajag-gris-300" };
}
