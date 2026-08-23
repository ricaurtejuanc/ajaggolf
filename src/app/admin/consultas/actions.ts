"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAdmin } from "@/lib/auth";

export async function marcarConsultaLeida(consultaId: string) {
  const admin = await getUsuarioAdmin();
  if (!admin) return;

  const supabase = await createClient();
  await supabase.from("consultas_contacto").update({ leido: true }).eq("id", consultaId);

  revalidatePath("/admin/consultas");
}
