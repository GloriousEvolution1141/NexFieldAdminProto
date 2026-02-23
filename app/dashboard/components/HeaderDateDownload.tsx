"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function getTodayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-");
    return `${d} / ${m} / ${y}`;
}

export function HeaderDateDownload() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const today = getTodayISO();

    // Simula carga inicial (puedes quitar el timeout si tienes data real)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // 0.8 segundos

        return () => clearTimeout(timer);
    }, []);

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

    // 🔹 Skeleton
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 animate-pulse">
                <div className="h-7 w-24 bg-slate-200 rounded-full" />
                <div className="h-9 w-9 bg-slate-200 rounded-lg" />
            </div>
        );
    }

    // 🔹 Contenido real
    return (
        <>
            <Badge
                variant="secondary"
                className="hidden sm:inline-flex h-7 px-3 text-xs font-medium pointer-events-none rounded-full bg-white border-blue-50 text-center"
            >
                {formatDisplayDate(today)}
            </Badge>

            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg hidden sm:flex hover:bg-green-100 hover:border-green-600"
                onClick={handleDownload}
                disabled={isDownloading}
                title={`Descargar datos del ${formatDisplayDate(today)}`}
            >
                {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                    <Download className="h-4 w-4 text-green-600" />
                )}
            </Button>
        </>
    );
}