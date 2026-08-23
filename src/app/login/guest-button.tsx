import Link from "next/link";
import { UserRound } from "lucide-react";

export function GuestButton({ next }: { next?: string }) {
  return (
    <div>
      <Link
        href={next ?? "/torneos"}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ajag-gris-200 px-4 py-3 text-sm font-medium text-ajag-gris-500 transition hover:border-ajag-verde-600 hover:text-ajag-verde-700"
      >
        <UserRound size={16} />
        Acceder sin crear cuenta
      </Link>
      <p className="mt-1.5 text-center text-xs text-ajag-gris-500">
        Rellenarás tus datos en el propio formulario, pero no se guardarán
        para la próxima vez.
      </p>
    </div>
  );
}
