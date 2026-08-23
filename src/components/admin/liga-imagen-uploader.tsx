"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LigaImagenUploader({ imagenUrlInicial }: { imagenUrlInicial?: string | null }) {
  const [imagenUrl, setImagenUrl] = useState(imagenUrlInicial ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("ligas")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir la imagen.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("ligas").getPublicUrl(path);
    setImagenUrl(data.publicUrl);
    setSubiendo(false);
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Imagen</span>
      <input type="hidden" name="imagen_url" value={imagenUrl ?? ""} />

      <div className="mt-1 flex items-center gap-4">
        <div className="relative flex aspect-[16/9] w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ajag-gris-200 bg-ajag-verde-50">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt="Imagen de la liga"
              fill
              unoptimized
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <ImagePlus className="text-ajag-gris-500" size={24} />
          )}
        </div>

        <label className="cursor-pointer rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
          {subiendo ? "Subiendo..." : imagenUrl ? "Cambiar imagen" : "Elegir imagen"}
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
