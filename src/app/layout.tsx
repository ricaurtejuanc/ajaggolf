import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
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
  // La landing de producto (torneos.aftergolf.es en su raíz) no es el
  // sitio de ningún organizador: no lleva la cabecera/pie de AJAG.
  const esLandingProducto = (await headers()).get("x-show-landing") === "1";

  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <VisitTracker />
        {esLandingProducto ? null : <SiteHeader />}
        <main className="flex-1">{children}</main>
        {esLandingProducto ? null : <SiteFooter />}
        <Analytics />
      </body>
    </html>
  );
}
