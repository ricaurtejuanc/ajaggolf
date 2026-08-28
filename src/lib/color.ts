/**
 * Genera la escala completa de verdes (950...50, igual que la de AJAG en
 * globals.css) a partir de un único color de marca (`color_primario` de un
 * organizador, pensado como el tono "700": el que más se usa en botones y
 * enlaces). Así cada organizador no tiene que definir 8 tonos a mano — solo
 * elige un color y se deriva el resto ajustando la luminosidad en el mismo
 * matiz/saturación, con el mismo patrón de luminosidad que ya usa la
 * paleta de AJAG codificada a mano.
 */

type Hsl = { h: number; s: number; l: number };

function hexAHsl(hex: string): Hsl | null {
  const limpio = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return null;

  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

// Luminosidad (L de HSL) de cada tono en la paleta ajag-verde-* actual,
// para que la escala derivada tenga el mismo "salto" entre tonos.
const TONOS: { clave: "950" | "900" | "800" | "700" | "600" | "500" | "100" | "50"; l: number; satFactor: number }[] = [
  { clave: "950", l: 11, satFactor: 1 },
  { clave: "900", l: 15, satFactor: 1 },
  { clave: "800", l: 21, satFactor: 1 },
  { clave: "700", l: 29, satFactor: 1 },
  { clave: "600", l: 34, satFactor: 1 },
  { clave: "500", l: 40, satFactor: 0.95 },
  { clave: "100", l: 89, satFactor: 0.35 },
  { clave: "50", l: 96, satFactor: 0.2 },
];

export function generarEscalaVerde(colorBase: string): Record<string, string> | null {
  const hsl = hexAHsl(colorBase);
  if (!hsl) return null;

  const escala: Record<string, string> = {};
  for (const tono of TONOS) {
    const s = Math.min(85, Math.max(20, hsl.s * tono.satFactor));
    escala[tono.clave] = `hsl(${hsl.h.toFixed(1)} ${s.toFixed(1)}% ${tono.l}%)`;
  }
  return escala;
}
