import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Storage público de Supabase (pósters de torneos, logos de patrocinadores).
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
      { protocol: "https" as const, hostname: "*.supabase.co" },
    ],
  },
  async redirects() {
    return [
      // /ligas se renombró a /clasificaciones; mantenemos el enlace antiguo vivo.
      { source: "/ligas", destination: "/clasificaciones", permanent: true },
      { source: "/ligas/:slug", destination: "/clasificaciones/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
