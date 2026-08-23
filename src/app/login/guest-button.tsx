"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GuestButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleClick() {
    setPending(true);
    setError(null);

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setError(
        "No se ha podido continuar como invitado. Prueba con Google o tu email.",
      );
      setPending(false);
      return;
    }

    router.push(next ?? "/torneos");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ajag-gris-200 px-4 py-3 text-sm font-medium text-ajag-gris-500 transition hover:border-ajag-verde-600 hover:text-ajag-verde-700 disabled:opacity-60"
      >
        <UserRound size={16} />
        {pending ? "Entrando..." : "Continuar como invitado"}
      </button>
      <p className="mt-1.5 text-center text-xs text-ajag-gris-500">
        Podrás inscribirte igual, pero no guardaremos tus datos ni tu
        historial para la próxima vez.
      </p>
      {error ? <p className="mt-1.5 text-center text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
