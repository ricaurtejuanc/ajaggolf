"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function OrganizadorLogoUploader({ logoUrlInicial }: { logoUrlInicial?: string | null }) {
  const [logoUrl, setLogoUrl] = useState(logoUrlInicial ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("organizadores")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir el logo.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("organizadores").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setSubiendo(false);
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Logo</span>
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

        <label className="cursor-pointer rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
          {subiendo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Elegir logo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo}
            onChange={handleFile}
          />
        </label>
      </div>
      {error ? <p className="mt-1 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
