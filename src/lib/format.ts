export function formatearPrecio(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export function formatearFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearFechaCorta(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatearHora(hora: string | null): string | null {
  if (!hora) return null;
  return hora.slice(0, 5);
}
