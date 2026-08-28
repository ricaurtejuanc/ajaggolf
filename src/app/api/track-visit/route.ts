import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrganizadorIdActual } from "@/lib/data/organizador";

export async function POST(request: NextRequest) {
  let body: { ruta?: string; referrer?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ruta = typeof body.ruta === "string" ? body.ruta.slice(0, 500) : null;
  if (!ruta) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const salt = process.env.VISIT_IP_SALT ?? "ajag-golf";
  const ipHash = ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null;

  const supabase = await createClient();
  await supabase.from("visitas_web").insert({
    ruta,
    referrer: body.referrer ?? null,
    user_agent: request.headers.get("user-agent"),
    ip_hash: ipHash,
    organizador_id: await obtenerOrganizadorIdActual(),
  });

  return NextResponse.json({ ok: true });
}
