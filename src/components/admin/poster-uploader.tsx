"use client";

import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PosterUploader({
  posterUrlInicial,
  focalXInicial = 50,
  focalYInicial = 50,
}: {
  posterUrlInicial: string | null;
  focalXInicial?: number;
  focalYInicial?: number;
}) {
  const [posterUrl, setPosterUrl] = useState(posterUrlInicial);
  const [focal, setFocal] = useState({ x: focalXInicial, y: focalYInicial });
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("posters")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("No se pudo subir la imagen.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("posters").getPublicUrl(path);
    setPosterUrl(data.publicUrl);
    setFocal({ x: 50, y: 50 });
    setSubiendo(false);
  }

  function handleClickImagen(e: MouseEvent<HTMLDivElement>) {
    const rect = contenedorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocal({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  return (
    <div>
      <span className="text-sm font-medium text-ajag-verde-900">Póster del torneo</span>
      <input type="hidden" name="poster_url" value={posterUrl ?? ""} />
      <input type="hidden" name="poster_focal_x" value={focal.x} />
      <input type="hidden" name="poster_focal_y" value={focal.y} />

      {posterUrl ? (
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            ref={contenedorRef}
            onClick={handleClickImagen}
            className="relative aspect-[16/9] w-full max-w-sm shrink-0 cursor-crosshair overflow-hidden rounded-xl border border-ajag-gris-200 bg-ajag-verde-50"
          >
            <Image src={posterUrl} alt="Póster" fill className="object-contain" sizes="384px" />
            <span
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ajag-verde-700 shadow"
              style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-ajag-gris-500">
              Haz clic en la imagen para marcar el punto que debe verse siempre en la miniatura.
            </p>
            <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-xl border border-ajag-gris-200">
              <Image
                src={posterUrl}
                alt="Vista previa de la miniatura"
                fill
                className="object-cover"
                style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
                sizes="128px"
              />
            </div>
            <label className="w-fit cursor-pointer rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
              {subiendo ? "Subiendo..." : "Cambiar imagen"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={subiendo}
                onChange={handleFile}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-4">
          <div className="relative flex aspect-[4/3] w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ajag-gris-200 bg-ajag-verde-50">
            <ImagePlus className="text-ajag-gris-500" size={24} />
          </div>
          <label className="cursor-pointer rounded-xl border border-ajag-gris-200 px-4 py-2.5 text-sm font-medium text-ajag-verde-900 hover:bg-ajag-verde-50">
            {subiendo ? "Subiendo..." : "Elegir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendo}
              onChange={handleFile}
            />
          </label>
        </div>
      )}
      {error ? <p className="mt-1 text-sm text-ajag-rojo-600">{error}</p> : null}
    </div>
  );
}
