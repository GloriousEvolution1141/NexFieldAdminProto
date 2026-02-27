"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Tecnico {
  id: string;
  codigoUsuario: string | null;
  nombres: string;
  apellidos: string;
  activo: boolean | null;
  created_at: string | null;
  suministros: { id: string }[];
}

interface TecnicosContextType {
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  tecnicos: Tecnico[];
  setTecnicos: React.Dispatch<React.SetStateAction<Tecnico[]>>;
  animationKey: number;
  setAnimationKey: React.Dispatch<React.SetStateAction<number>>;
}

const TecnicosContext = createContext<TecnicosContextType | null>(null);

export function TecnicosProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <TecnicosContext.Provider
      value={{
        selected,
        setSelected,
        tecnicos,
        setTecnicos,
        animationKey,
        setAnimationKey,
      }}
    >
      {children}
    </TecnicosContext.Provider>
  );
}

export function useTecnicosContext() {
  const context = useContext(TecnicosContext);
  if (!context) {
    throw new Error(
      "useTecnicosContext must be used within a TecnicosProvider",
    );
  }
  return context;
}
