"use client";

import { useState } from "react";
import { User, FileCheck, Zap } from "lucide-react";

type Tab = "datos" | "inscripciones" | "rondas";

interface TabsProps {
  defaultTab: Tab;
  paneles: Record<Tab, React.ReactNode>;
}

// El cambio de pestaña es puramente visual y vive enteramente en el
// cliente: activeTab NO se recibe como prop controlada desde el servidor,
// porque eso obligaría a pasar también el setter (onTabChange) desde un
// Server Component a un Client Component, y React/Next.js no permite pasar
// funciones así (solo Server Actions) — eso es justo lo que tumbaba /cuenta
// con "Event handlers cannot be passed to Client Component props.".
export function CuentaTabs({ defaultTab, paneles }: TabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "datos", label: "Mis Datos", icon: <User size={18} /> },
    { id: "inscripciones", label: "Mis Inscripciones", icon: <FileCheck size={18} /> },
    { id: "rondas", label: "Mis Rondas", icon: <Zap size={18} /> },
  ];

  return (
    <div>
      <div className="mb-8 flex gap-2 border-b border-ajag-gris-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-ajag-verde-700 text-ajag-verde-700"
                : "border-transparent text-ajag-gris-500 hover:text-ajag-verde-600"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div>{paneles[activeTab]}</div>
    </div>
  );
}
