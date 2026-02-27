"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateToLima } from "@/lib/date-helpers";

function getTodayISO(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // Formato YYYY-MM-DD local a Lima
}

function formatDisplayDate(isoDate: string): string {
  return formatDateToLima(`${isoDate}T12:00:00.000Z`); // Agregamos hora central para evitar desplazamientos por GMT en el constructor de JS
}

export function HeaderDateDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const today = getTodayISO();

  async function handleDownload() {
    setIsDownloading(true);

    toast.info("Preparando descarga del día...", {
      description: `Empaquetando suministros del ${formatDisplayDate(today)}`,
    });

    try {
      const response = await fetch(`/api/download/fecha/${today}`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al descargar");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${today}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Descarga lista", {
        description: `Archivo del día ${formatDisplayDate(today)} descargado.`,
        duration: 1000,
      });
    } catch (error: any) {
      toast.error("Error en la descarga", { description: error.message });
    } finally {
      setIsDownloading(false);
    }
  }

  // 🔹 Contenido real
  return (
    <Button
      variant="outline"
      className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-lg bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-medium shadow-sm"
      onClick={handleDownload}
      disabled={isDownloading}
      title={`Descargar datos del ${formatDisplayDate(today)}`}
    >
      <Calendar className="h-4 w-4 text-slate-500 group-hover:text-blue-500" />
      <span>{formatDisplayDate(today)}</span>

      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin ml-2 text-slate-400" />
      ) : (
        <Download className="h-4 w-4 ml-2 text-slate-400" />
      )}
    </Button>
  );
}
