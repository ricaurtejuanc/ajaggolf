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
};

export default nextConfig;
