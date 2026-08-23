"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Deriva el origen de la propia petición en vez de fiarse solo de
// NEXT_PUBLIC_SITE_URL: si esa variable no está bien puesta en Vercel (o
// falta), el enlace mágico se mandaría a localhost aunque el sitio esté en
// producción. El botón de Google no tiene este problema porque corre en el
// navegador y usa window.location.origin; aquí, en una Server Action, hay
// que sacar el host de las cabeceras de la petición entrante.
async function obtenerOrigen(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  if (host) {
    const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function enviarEnlaceMagico(
  _prevState: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Introduce un email válido." };

  const origen = await obtenerOrigen();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origen}/auth/confirm?next=/cuenta`,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
