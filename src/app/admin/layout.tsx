import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Wallet,
  MessageSquare,
  Settings,
  Medal,
  Handshake,
  Users,
  UserRound,
  Flag,
  PiggyBank,
} from "lucide-react";
import { getUsuarioAdmin } from "@/lib/auth";
import { obtenerOrganizadorActual } from "@/lib/data/organizador";

const adminLinks = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/torneos", label: "Torneos", icon: Trophy },
  { href: "/admin/ligas", label: "Ligas y Pool", icon: Medal },
  { href: "/admin/campos", label: "Campos de golf", icon: Flag },
  { href: "/admin/patrocinadores", label: "Patrocinadores", icon: Handshake },
  { href: "/admin/pedidos", label: "Pagos", icon: Wallet },
  { href: "/admin/economia", label: "Economía", icon: PiggyBank },
  { href: "/admin/consultas", label: "Consultas", icon: MessageSquare },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserRound },
  { href: "/admin/administradores", label: "Administradores", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getUsuarioAdmin();
  if (!admin) redirect("/login?next=/admin");

  // La cabecera del panel llevaba el logo de AJAG fijo, así que un admin de
  // cualquier otro organizador gestionaba su club bajo una marca ajena.
  const organizador = await obtenerOrganizadorActual();

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block print:hidden">
        <div className="sticky top-24 flex flex-col gap-1">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Image
              src={organizador?.logo_url || "/Logo_AJAG.svg"}
              alt={organizador?.nombre ?? "AJAG Golf"}
              width={28}
              height={28}
            />
            <span className="font-display text-sm font-semibold text-ajag-verde-900">
              Panel admin
            </span>
          </div>
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ajag-verde-900/80 transition hover:bg-ajag-verde-50 hover:text-ajag-verde-900"
            >
              <link.icon size={17} />
              {link.label}
            </Link>
          ))}
          <p className="mt-4 px-3 text-xs text-ajag-gris-500">
            Sesión: {admin.nombre}
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:hidden print:hidden">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-xl border border-ajag-gris-200 px-3 py-2 text-xs font-medium text-ajag-verde-900"
            >
              <link.icon size={14} className="shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
