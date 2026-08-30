import "server-only";

/**
 * El proyecto de Supabase recibe tráfico (bots, crawlers, uso normal
 * concurrente) que satura puntualmente el pool de conexiones de PostgREST
 * ("Thread killed by timeout manager" en sus logs). Una sola query que cae
 * en ese hueco no debería tumbar una página entera con un error genérico:
 * un par de reintentos con pequeño backoff absorbe esos picos.
 *
 * Solo debe usarse con lecturas u operaciones idempotentes (upsert/insert
 * con clave natural), nunca con algo que duplique datos si se repite.
 */
export async function conReintentos<T extends { error: { message: string } | null }>(
  intento: () => PromiseLike<T>,
  maxIntentos = 3,
): Promise<T> {
  let ultimo: T;
  for (let i = 0; i < maxIntentos; i++) {
    ultimo = await intento();
    if (!ultimo.error) return ultimo;
    if (i < maxIntentos - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  return ultimo!;
}
