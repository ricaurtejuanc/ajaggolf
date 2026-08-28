"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERRORES: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese email. Inicia sesión.",
  "Password should be at least 6 characters.": "La contraseña debe tener al menos 6 caracteres.",
  "Email not confirmed": "Confirma tu email antes de iniciar sesión: revisa tu correo.",
};

function traducirError(mensaje: string): string {
  return ERRORES[mensaje] ?? mensaje;
}

export function PasswordForm({ next }: { next?: string }) {
  const [modo, setModo] = useState<"signin" | "signup">("signin");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoConfirmacion, setAvisoConfirmacion] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function cambiarModo(nuevoModo: "signin" | "signup") {
    setModo(nuevoModo);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (modo === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(traducirError(error.message));
        setPending(false);
        return;
      }
      router.push(next ?? "/cuenta");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre, telefono } },
    });
    if (error) {
      setError(traducirError(error.message));
      setPending(false);
      return;
    }
    if (data.session) {
      router.push(next ?? "/cuenta");
      router.refresh();
      return;
    }
    setAvisoConfirmacion(true);
    setPending(false);
  }

  if (avisoConfirmacion) {
    return (
      <div className="rounded-xl bg-ajag-verde-50 px-4 py-4 text-sm text-ajag-verde-900">
        Te hemos enviado un email para confirmar tu cuenta. Pulsa el enlace
        y podrás iniciar sesión con tu contraseña.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-ajag-gris-100 p-1">
        <button
          type="button"
          onClick={() => cambiarModo("signin")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            modo === "signin"
              ? "bg-white text-ajag-verde-900 shadow-sm"
              : "text-ajag-gris-500 hover:text-ajag-verde-700"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("signup")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            modo === "signup"
              ? "bg-white text-ajag-verde-900 shadow-sm"
              : "text-ajag-gris-500 hover:text-ajag-verde-700"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {modo === "signup" ? (
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-ajag-verde-900">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-3 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ajag-verde-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-3 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>

        {modo === "signup" ? (
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-ajag-verde-900">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="600 000 000"
              className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-3 text-sm outline-none focus:border-ajag-verde-600"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ajag-verde-900">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-ajag-gris-200 px-4 py-3 text-sm outline-none focus:border-ajag-verde-600"
          />
        </div>

        {error ? <p className="text-sm text-ajag-rojo-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-ajag-verde-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-ajag-verde-600 disabled:opacity-60"
        >
          {pending
            ? modo === "signin"
              ? "Entrando..."
              : "Creando cuenta..."
            : modo === "signin"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
