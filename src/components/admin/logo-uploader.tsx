"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoUploader({ logoUrlInicial, organizadorId }: { logoUrlInicial?: string | null; organizadorId: string }) {
  const [logoUrl, setLogoUrl] = useState(logoUrlInicial ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tieneOrganizador = !!organizadorId;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!tieneOrganizador) {
      setError("Error: no hay contexto de organizador");
      console.error("LogoUploader: organizadorId es vacío", { organizadorId });
      return;
    }

    setSubiendo(true);
    setError(null);

    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop() ?? "png";
      const path = `organizations/${organizadorId}/${crypto.randomUUID()}.${extension}`;
      console.log("Subiendo logo a:", path);

      const { error: uploadError } = await supabase.storage
        .from("patrocinadores")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        setError(`No se pudo subir el logo: ${uploadError.message || "error desconocido"}`);
        setSubiendo(false);
        return;
      }

      const { data } = supabase.storage.from("patrocinadores").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      setSubiendo(false);
    } catch (err) {
      console.error("Excepción al subir logo:", err);
      setError(`Error inesperado: ${err instanceof Error ? err.message : "desconocido"}`);
      setSubiendo(false);
    }
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Logo *</span>
      <input type="hidden" name="logo_url" value={logoUrl ?? ""} />

      <div className="mt-1 flex items-center gap-4">
        <div className="relative flex aspect-[4/3] w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ajag-gris-200 bg-ajag-verde-50">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              fill
              unoptimized
              className="object-contain p-2"
              sizes="128px"
            />
          ) : (
            <ImagePlus className="text-ajag-gris-500" size={24} />
          )}
        </div>

        <label className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
          subiendo || !tieneOrganizador
            ? "cursor-not-allowed border-ajag-gris-200 bg-ajag-gris-50 text-ajag-gris-500"
            : "cursor-pointer border-ajag-gris-200 text-ajag-verde-900 hover:bg-ajag-verde-50"
        }`}>
          {subiendo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Elegir logo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo || !tieneOrganizador}
            onChange={handleFile}
          />
        </label>
      </div>
      {error ? <p className="mt-1 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
