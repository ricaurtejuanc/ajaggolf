import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">
        Accede a tu cuenta
      </h1>
      <p className="mt-2 text-sm text-ajag-gris-500">
        Crea tu perfil con Google o tu email: guardamos tus datos (licencia,
        hándicap...) para que la próxima inscripción sea más rápida, y podrás
        ver el historial de torneos en los que has participado y tus pagos.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <GoogleButton next={next} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-ajag-gris-200" />
          <span className="text-xs text-ajag-gris-500">o con tu email</span>
          <div className="h-px flex-1 bg-ajag-gris-200" />
        </div>

        <PasswordForm next={next} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-ajag-gris-200" />
          <span className="text-xs text-ajag-gris-500">o sin crear cuenta</span>
          <div className="h-px flex-1 bg-ajag-gris-200" />
        </div>

        <GuestButton next={next} />
      </div>
    </div>
  );
}
