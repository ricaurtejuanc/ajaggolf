import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { GoogleButton } from "./google-button";
import { PasswordForm } from "./password-form";
import { GuestButton } from "./guest-button";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next ?? "/cuenta");

  // "Acceder sin crear cuenta" solo tiene sentido volviendo a una
  // inscripción de torneo (ahí el propio formulario ya soporta invitados):
  // el resto de destinos protegidos (/admin, /cuenta, /carrito, /god)
  // exigen sí o sí una cuenta, así que no tiene sentido ofrecerlo ahí.
  const esInscripcion = next != null && /^\/torneos\/[^/]+\/inscripcion$/.test(next);

  // El dominio de la plataforma (torneos.aftergolf.es, marcado por proxy.ts
  // con x-show-landing) no es el sitio de AJAG ni de ningún organizador: el
  // login que se ve ahí (típicamente camino de /god) debe llevar la marca
  // de AfterGolf, no la de AJAG, aunque sea el mismo formulario.
  const cabeceras = await headers();
  const plataforma = cabeceras.get("x-show-landing") === "1";

  return (
    <div className={plataforma ? "bg-aftergolf-crema" : undefined}>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        {plataforma ? (
          <Image
            src="/Logo_AfterGolf.svg"
            alt="AfterGolf"
            width={56}
            height={56}
            priority
            className="mb-2"
          />
        ) : null}
        <h1
          className={`font-display text-2xl font-semibold ${plataforma ? "text-aftergolf-verde-900" : "text-ajag-verde-900"}`}
        >
          Accede a tu cuenta
        </h1>
        <p className={`mt-2 text-sm ${plataforma ? "text-aftergolf-verde-800/70" : "text-ajag-gris-500"}`}>
          Crea tu perfil con Google o tu email: guardamos tus datos (licencia,
          hándicap...) para que la próxima inscripción sea más rápida, y podrás
          ver el historial de torneos en los que has participado y tus pagos.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <GoogleButton next={next} plataforma={plataforma} />

          <div className="flex items-center gap-3">
            <div className={`h-px flex-1 ${plataforma ? "bg-aftergolf-oro-200" : "bg-ajag-gris-200"}`} />
            <span className={`text-xs ${plataforma ? "text-aftergolf-verde-800/70" : "text-ajag-gris-500"}`}>
              o con tu email
            </span>
            <div className={`h-px flex-1 ${plataforma ? "bg-aftergolf-oro-200" : "bg-ajag-gris-200"}`} />
          </div>

          <PasswordForm next={next} plataforma={plataforma} />

          {esInscripcion ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-ajag-gris-200" />
                <span className="text-xs text-ajag-gris-500">o sin crear cuenta</span>
                <div className="h-px flex-1 bg-ajag-gris-200" />
              </div>

              <GuestButton next={next} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
