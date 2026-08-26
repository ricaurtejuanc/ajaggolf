import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VisitTracker } from "@/components/analytics/visit-tracker";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AJAG Golf — Asociación de Jugadores Amateur de Golf",
    template: "%s · AJAG Golf",
  },
  description:
    "Calendario de torneos, inscripciones, salidas y clasificaciones de AJAG, la Asociación de Jugadores Amateur de Golf.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La landing de producto (torneos.aftergolf.es en su raíz) y el panel
  // god (super-admin, cruza organizadores) no son el sitio de ningún
  // organizador concreto: ninguno de los dos lleva la cabecera/pie de
  // AJAG — el panel god ya trae su propia navegación en su propio layout.
  const cabeceras = await headers();
  const ocultarCabeceraAjag =
    cabeceras.get("x-show-landing") === "1" || cabeceras.get("x-show-god") === "1";

  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <VisitTracker />
        {ocultarCabeceraAjag ? null : <SiteHeader />}
        <main className="flex-1">{children}</main>
        {ocultarCabeceraAjag ? null : <SiteFooter />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
