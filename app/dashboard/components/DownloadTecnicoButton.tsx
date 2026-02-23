"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DownloadTecnicoButton({ tecnicoId, tecnicoNombre, suministroCount }: {
    tecnicoId: string;
    tecnicoNombre: string;
    suministroCount: number;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    async function handleDownload(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (suministroCount === 0) {
            toast.warning("Sin suministros", { description: "Este técnico no tiene suministros con fotos." });
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
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={handleDownload}
            disabled={isDownloading || suministroCount === 0}
        >
            {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Download className="h-3.5 w-3.5" />
            )}
            {isDownloading ? "Descargando..." : "Descargar Todo"}
        </Button>
    );
}
