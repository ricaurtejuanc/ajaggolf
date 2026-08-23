"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruta: pathname, referrer: document.referrer || null }),
      keepalive: true,
    }).catch(() => {
      // El contador de visitas nunca debe romper la navegación.
    });
  }, [pathname]);

  return null;
}
