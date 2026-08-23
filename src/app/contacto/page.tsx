import type { Metadata } from "next";
import { ContactoForm } from "./contacto-form";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-ajag-verde-900">Contacto</h1>
      <p className="mt-2 text-sm text-ajag-gris-500">
        ¿Tienes dudas sobre un torneo, tu inscripción o quieres proponer algo?
        Escríbenos.
      </p>
      <div className="mt-6">
        <ContactoForm />
      </div>
    </div>
  );
}
