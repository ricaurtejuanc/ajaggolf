"use server";

import { createClient } from "@/lib/supabase/server";

export async function enviarEnlaceMagico(
  _prevState: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Introduce un email válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm?next=/cuenta`,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
