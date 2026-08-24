import type { Metadata } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asegurarJugadorParaUsuario } from "@/lib/data/jugadores";
import { obtenerBizumNumero } from "@/lib/data/configuracion";
import { PerfilForm } from "./perfil-form";
import { SignOutButton } from "./sign-out-button";
import { PedidosList } from "./pedidos-list";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cuenta");

  const jugador = await asegurarJugadorParaUsuario(supabase, user);

  // Además de los pedidos hechos con la cuenta ya iniciada (user_id), hay
  // que incluir los que se inscribieron como invitado antes de tener
  // cuenta (pedido sin user_id) y cuya ficha de jugador se reclamó luego:
  // si no, esas inscripciones desaparecen de "Mis inscripciones".
  const { data: inscripcionesJugador } = await supabase
    .from("inscripciones")
    .select("pedido_pago_id")
    .eq("jugador_id", jugador.id)
    .not("pedido_pago_id", "is", null);
  const idsPedidosInvitado = [
    ...new Set((inscripcionesJugador ?? []).map((i) => i.pedido_pago_id).filter((id) => id)),
  ];

  const filtro =
    idsPedidosInvitado.length > 0
      ? `user_id.eq.${user.id},id.in.(${idsPedidosInvitado.join(",")})`
      : `user_id.eq.${user.id}`;

  const [{ data: pedidos }, bizumNumero] = await Promise.all([
    supabase
      .from("pedidos_pago")
      .select("*, inscripciones(*, torneos(nombre, slug, fecha))")
      .or(filtro)
      .order("created_at", { ascending: false }),
    obtenerBizumNumero(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
            Mi cuenta
          </h1>
          <p className="text-sm text-ajag-gris-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ajag-verde-900">
          Mi perfil
        </h2>
        <PerfilForm jugador={jugador} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-ajag-verde-900">
          Mis inscripciones
        </h2>
        {pedidos && pedidos.length > 0 ? (
          <PedidosList
            pedidos={pedidos as unknown as ComponentProps<typeof PedidosList>["pedidos"]}
            bizumNumero={bizumNumero}
          />
        ) : (
          <div className="card-ajag p-6 text-sm text-ajag-gris-500">
            Todavía no te has inscrito en ningún torneo.{" "}
            <Link href="/torneos" className="font-medium text-ajag-verde-700 underline">
              Ver calendario
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
