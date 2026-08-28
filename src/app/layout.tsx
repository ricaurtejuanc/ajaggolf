import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VisitTracker } from "@/components/analytics/visit-tracker";
import { obtenerOrganizadorActual } from "@/lib/data/organizador";
import { generarEscalaVerde } from "@/lib/color";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const organizador = await obtenerOrganizadorActual();
  const nombre = organizador?.nombre ?? "AJAG Golf";
  return {
    title: { default: nombre, template: `%s · ${nombre}` },
    description: `Calendario de torneos, inscripciones, salidas y clasificaciones de ${nombre}.`,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Todo el dominio de la plataforma (torneos.aftergolf.es, sea cual sea
  // la ruta: landing, /god, un 404...), más /god en cualquier otro
  // dominio, no es el sitio de ningún organizador concreto: nunca lleva
  // la cabecera/pie de AJAG (/god ya trae su propia navegación en su
  // propio layout). Se decide en src/proxy.ts, que es quien sabe el host
  // y la ruta reales de la petición.
  const cabeceras = await headers();
  const ocultarCabeceraAjag = cabeceras.get("x-show-landing") === "1";

  // Cada organizador puede fijar su propio color de marca (color_primario)
  // en /god; de ahí se deriva toda la escala de verdes que usa el resto
  // del sitio (botones, textos, fondos), así que un solo campo repinta el
  // sitio entero sin tocar cada componente. Sin color_primario, se queda
  // con el verde de AJAG por defecto de globals.css.
  const organizador = ocultarCabeceraAjag ? null : await obtenerOrganizadorActual();
  const escalaColor = organizador?.color_primario
    ? generarEscalaVerde(organizador.color_primario)
    : null;

  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {escalaColor ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{${Object.entries(escalaColor)
                .map(([tono, valor]) => `--ajag-verde-${tono}:${valor};`)
                .join("")}}`,
            }}
          />
        ) : null}
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
