"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Foto {
  id: string;
  nombre: string | null;
  direccion: string | null;
  created_at: string | null;
}

export interface Suministro {
  id: string;
  nombre: string;
  estado: string | null;
  activo: boolean | null;
  created_at: string | null;
  fotos: Foto[];
}

interface SuministrosContextType {
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  suministros: Suministro[];
  setSuministros: React.Dispatch<React.SetStateAction<Suministro[]>>;
  animationKey: number;
  setAnimationKey: React.Dispatch<React.SetStateAction<number>>;
}

const SuministrosContext = createContext<SuministrosContextType | null>(null);

export function SuministrosProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [suministros, setSuministros] = useState<Suministro[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <SuministrosContext.Provider
      value={{
        selected,
        setSelected,
        suministros,
        setSuministros,
        animationKey,
        setAnimationKey,
      }}
    >
      {children}
    </SuministrosContext.Provider>
  );
}

export function useSuministrosContext() {
  const context = useContext(SuministrosContext);
  if (!context) {
    throw new Error(
      "useSuministrosContext must be used within a SuministrosProvider",
    );
  }
  return context;
}
