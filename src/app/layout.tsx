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
  // Todo el dominio de la plataforma (torneos.aftergolf.es, sea cual sea
  // la ruta: landing, /god, un 404...), más /god en cualquier otro
  // dominio, no es el sitio de ningún organizador concreto: nunca lleva
  // la cabecera/pie de AJAG (/god ya trae su propia navegación en su
  // propio layout). Se decide en src/proxy.ts, que es quien sabe el host
  // y la ruta reales de la petición.
  const cabeceras = await headers();
  const ocultarCabeceraAjag = cabeceras.get("x-show-landing") === "1";

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
