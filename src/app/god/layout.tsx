import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, LayoutDashboard } from "lucide-react";
import { getSuperAdmin } from "@/lib/auth";

const godLinks = [
  { href: "/god", label: "Resumen", icon: LayoutDashboard },
  { href: "/god/organizadores", label: "Organizadores", icon: Building2 },
];

export default async function GodLayout({ children }: LayoutProps<"/god">) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) redirect("/login?next=/god");

  return (
    <div className="min-h-screen bg-ajag-verde-950">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-8 flex flex-col gap-1">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-ajag-oro-500 text-xs font-bold text-ajag-verde-950">
                AG
              </span>
              <span className="font-display text-sm font-semibold text-white">
                AfterGolf · God Mode
              </span>
            </div>
            {godLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <link.icon size={17} />
                {link.label}
              </Link>
            ))}
            <p className="mt-4 px-3 text-xs text-white/40">Sesión: {superAdmin.nombre}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl bg-ajag-gris-50 p-6">
          <nav className="mb-4 flex gap-3 overflow-x-auto md:hidden">
            {godLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-ajag-gris-200 px-3 py-1.5 text-xs font-medium text-ajag-verde-900"
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
