"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DownloadTecnicoButton({
  tecnicoId,
  tecnicoNombre,
  suministroCount,
  iconOnly = false,
}: {
  tecnicoId: string;
  tecnicoNombre: string;
  suministroCount: number;
  iconOnly?: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (suministroCount === 0) {
      toast.warning("Sin suministros", {
        description: "Este técnico no tiene suministros con fotos.",
      });
      return;
    }

    setIsDownloading(true);
    toast.info("Preparando descarga...", {
      description: `Empaquetando fotos de "${tecnicoNombre}"`,
    });

    try {
      const response = await fetch(`/api/download/tecnico/${tecnicoId}`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al descargar");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tecnicoNombre}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Descarga lista", {
        description: `"${tecnicoNombre}.zip" descargado correctamente.`,
        duration: 1000,
      });
    } catch (error: any) {
      toast.error("Error en la descarga", { description: error.message });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      variant={iconOnly ? "ghost" : "secondary"}
      size="sm"
      className={
        iconOnly
          ? "w-full h-9 p-0 border text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
          : "w-full gap-2"
      }
      onClick={handleDownload}
      disabled={isDownloading || suministroCount === 0}
      title={iconOnly ? "Descargar fotos" : undefined}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {!iconOnly && (isDownloading ? "Descargando..." : "Descargar Todo")}
    </Button>
  );
}
