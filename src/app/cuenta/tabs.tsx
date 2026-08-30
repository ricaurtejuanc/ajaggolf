"use client";

import { User, FileCheck, Zap } from "lucide-react";

type Tab = "datos" | "inscripciones" | "rondas";

interface TabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  paneles: Record<Tab, React.ReactNode>;
}

export function CuentaTabs({ activeTab, onTabChange, paneles }: TabsProps) {
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
            onClick={() => onTabChange(tab.id)}
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
