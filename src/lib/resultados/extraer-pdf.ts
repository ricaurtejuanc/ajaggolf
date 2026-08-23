import "server-only";

export interface FilaExtraidaPdf {
  posicion: number;
  nombre: string;
  valor: number;
}

/**
 * Extrae texto de un PDF y aplica una heurística simple para detectar filas
 * de clasificación con forma "posición  nombre  puntos/golpes" (formato
 * habitual de exportaciones de Golfshot/BUK/RFEG en una línea por jugador).
 *
 * No pretende ser un parser universal de tablas: es un primer intento que
 * el admin siempre puede corregir a mano en el formulario de resultados.
 */
export async function extraerFilasPdf(buffer: Buffer): Promise<{
  textoCompleto: string;
  filas: FilaExtraidaPdf[];
}> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const resultado = await parser.getText();
    const texto = resultado.text;
    return { textoCompleto: texto, filas: parsearLineas(texto) };
  } finally {
    await parser.destroy();
  }
}

const PATRON_FILA = /^\s*(\d{1,3})[.ºª)\s]+([A-Za-zÀ-ÖØ-öø-ÿ'.\-\s]{3,60}?)\s+(-?\d{1,3}(?:[.,]\d)?)\s*$/;

function parsearLineas(texto: string): FilaExtraidaPdf[] {
  const filas: FilaExtraidaPdf[] = [];
  for (const linea of texto.split("\n")) {
    const m = linea.match(PATRON_FILA);
    if (!m) continue;
    const posicion = parseInt(m[1], 10);
    const nombre = m[2].trim().replace(/\s+/g, " ");
    const valor = parseFloat(m[3].replace(",", "."));
    if (!nombre || Number.isNaN(posicion) || Number.isNaN(valor)) continue;
    filas.push({ posicion, nombre, valor });
  }
  return filas;
}

function normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Empareja las filas extraídas del PDF con los inscritos confirmados del
 * torneo por coincidencia de nombre (normalizado, sin acentos). Solo
 * empareja cuando hay una única coincidencia razonable; si es ambiguo o no
 * hay match, se deja para que el admin lo rellene a mano.
 */
export function emparejarConInscritos<T extends { inscripcionId: string; nombreCompleto: string }>(
  filas: FilaExtraidaPdf[],
  inscritos: T[],
): Map<string, FilaExtraidaPdf> {
  const resultado = new Map<string, FilaExtraidaPdf>();
  const normalizados = inscritos.map((i) => ({
    inscripcionId: i.inscripcionId,
    normalizado: normalizarNombre(i.nombreCompleto),
  }));

  for (const fila of filas) {
    const nombreNormalizado = normalizarNombre(fila.nombre);
    if (!nombreNormalizado) continue;

    const coincidencias = normalizados.filter(
      (i) =>
        i.normalizado === nombreNormalizado ||
        i.normalizado.includes(nombreNormalizado) ||
        nombreNormalizado.includes(i.normalizado),
    );

    if (coincidencias.length === 1) {
      resultado.set(coincidencias[0].inscripcionId, fila);
    }
  }

  return resultado;
}
