"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DownloadSuministroButton({ suministroId, suministroNombre, fotoCount }: {
    suministroId: string;
    suministroNombre: string;
    fotoCount: number;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    async function handleDownload(e: React.MouseEvent) {
        // Prevent the card's Dialog from opening
        e.stopPropagation();

        if (fotoCount === 0) {
            toast.warning("Sin fotos", { description: "Este suministro no tiene fotos para descargar." });
            return;
        }

        setIsDownloading(true);
        toast.info("Preparando descarga...", { description: `Empaquetando ${fotoCount} foto(s) de "${suministroNombre}"` });

        try {
            const response = await fetch(`/api/download/suministro/${suministroId}`);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Error al descargar");
            }

            // Trigger browser download
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${suministroNombre}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            toast.success("Descarga lista", { description: `"${suministroNombre}.zip" descargado correctamente.`, duration: 1000 });
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
            disabled={isDownloading || fotoCount === 0}
        >
            {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Download className="h-3.5 w-3.5" />
            )}
            {isDownloading ? "Descargando..." : `Descargar Todo`}
        </Button>
    );
}
