import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ConsultaCard } from "./consulta-card";

export const metadata: Metadata = { title: "Consultas · Admin" };

export default async function AdminConsultasPage() {
  const supabase = await createClient();
  const { data: consultas } = await supabase
    .from("consultas_contacto")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
        Consultas de contacto
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {(consultas ?? []).length === 0 ? (
          <p className="text-sm text-ajag-gris-500">No hay consultas todavía.</p>
        ) : (
          (consultas ?? []).map((consulta) => (
            <ConsultaCard key={consulta.id} consulta={consulta} />
          ))
        )}
      </div>
    </div>
  );
}
