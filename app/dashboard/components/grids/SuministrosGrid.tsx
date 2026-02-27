"use client";

import { useState, useEffect } from "react";

import { useSearch } from "@/app/dashboard/components/SearchContext";
import { useSuministrosContext } from "./SuministrosContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Eye,
  Package,
  Calendar,
  Trash2,
  CheckSquare,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateToLima, formatDateTimeToLima } from "@/lib/date-helpers";

interface Foto {
  id: string;
  nombre: string | null;
  direccion: string | null;
  created_at: string | null;
}

interface Suministro {
  id: string;
  nombre: string;
  estado: string | null;
  activo: boolean | null;
  created_at: string | null;
  fotos: Foto[];
}

export function SuministrosGrid({
  suministros,
  userId,
  tecnicoId,
}: {
  suministros: Suministro[];
  userId: string;
  tecnicoId: string;
}) {
  const { query: q } = useSearch();
  const { selected, setSelected, setSuministros, animationKey } =
    useSuministrosContext();
  const [itemsToShow, setItemsToShow] = useState(12);

  // Sync the server-fetched data into the shared context so the header knows about it
  useEffect(() => {
    setSuministros(suministros);
  }, [suministros, setSuministros]);

  const filtered = q
    ? suministros.filter((s) =>
        s.nombre.toLowerCase().includes(q.toLowerCase()),
      )
    : suministros;

  const displayedItems = filtered.slice(0, itemsToShow);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // If no items match search but there are items overall
  if (filtered.length === 0 && suministros.length > 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No se encontraron elementos para "{q}".
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div
        key={animationKey}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {displayedItems.map((s, index) => {
          const fotoCount = Array.isArray(s.fotos) ? s.fotos.length : 0;
          return (
            <SuministroCard
              key={s.id}
              s={s}
              fotoCount={fotoCount}
              isSelected={selected.has(s.id)}
              onToggle={() => toggleSelect(s.id)}
              index={index}
            />
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-10">
            No se encontraron suministros para &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>

      {itemsToShow < filtered.length && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setItemsToShow((prev) => prev + 12)}
            className="w-full max-w-xs"
          >
            Ver más suministros
          </Button>
        </div>
      )}
    </div>
  );
}

function SuministroCard({
  s,
  fotoCount,
  isSelected,
  onToggle,
  index = 0,
}: {
  s: Suministro;
  fotoCount: number;
  isSelected: boolean;
  onToggle: () => void;
  index?: number;
}) {
  const [open, setOpen] = useState(false);
  const [maxFoto, setMaxFoto] = useState<Foto | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (fotoCount === 0) {
      toast.warning("Sin fotos", {
        description: "Este suministro no tiene fotos para descargar.",
      });
      return;
    }

    setIsDownloading(true);
    toast.info("Preparando descarga...", {
      description: `Empaquetando fotos de "${s.nombre}"`,
    });

    try {
      const response = await fetch(`/api/download/suministro/${s.id}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al descargar");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${s.nombre}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Descarga lista", {
        description: `"${s.nombre}.zip" descargado correctamente.`,
        duration: 2000,
      });
    } catch (error: any) {
      toast.error("Error en la descarga", { description: error.message });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Card
        className="h-full flex flex-col bg-white shadow-sm border border-slate-200 rounded-xl hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{
          animationDelay: `${index * 50}ms`,
          animationFillMode: "backwards",
        }}
      >
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
              #{String(s.id).slice(0, 8).toUpperCase()}
            </span>
            <Badge
              variant="outline"
              className={
                s.estado?.toLowerCase() === "completado"
                  ? "bg-emerald-50 text-emerald-600 border-transparent rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  : "bg-amber-50 text-amber-600 border-transparent rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              }
            >
              {s.estado?.toLowerCase() === "completado"
                ? "Completado"
                : "Pendiente"}
            </Badge>
          </div>
          <CardTitle className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
            {s.nombre}
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-4 px-5 flex-1 space-y-2.5">
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {fotoCount} foto{fotoCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDateToLima(s.created_at)}</span>
          </div>
        </CardContent>

        <CardFooter className="pt-4 pb-5 px-5 flex items-center gap-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="ghost"
            className={`w-10 h-9 p-0 shrink-0 transition-colors border  ${
              isSelected
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-slate-400 hover:bg-red-50 hover:text-red-600"
            }`}
            onClick={onToggle}
            title={isSelected ? "Deseleccionar" : "Seleccionar"}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-9 p-0 border text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            onClick={() => setOpen(true)}
            title="Ver Detalles"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="w-10 h-9 p-0 shrink-0 border text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
            onClick={handleDownload}
            disabled={isDownloading || fotoCount === 0}
            title="Descargar fotos"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog de fotos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-200">
          <DialogHeader>
            <DialogTitle>Fotos de {s.nombre}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 px-8">
            {fotoCount === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-6">
                Este suministro no tiene fotos registradas.
              </p>
            ) : (
              <Carousel className="w-full max-w-3xl mx-auto bg-slate-100 rounded-md">
                <CarouselContent>
                  {s.fotos.map((f) => (
                    <CarouselItem key={f.id}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-md border p-4 bg-muted/30">
                        <div className="flex flex-col gap-2 h-[350px] lg:col-span-2 ">
                          <span className="font-semibold text-lg truncate ">
                            {f.nombre || "Sin Título"}
                          </span>
                          <div className="w-full h-full bg-muted-foreground/10 rounded-md overflow-hidden flex items-center justify-center relative">
                            {f.direccion ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={f.direccion}
                                  alt={f.nombre || "Foto"}
                                  className="absolute inset-0 w-full h-full object-contain bg-black/5 cursor-pointer hover:opacity-80  transition-opacity"
                                  onClick={() => setMaxFoto(f)}
                                  title="Clic para maximizar"
                                />
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Sin URL de imagen
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTimeToLima(f.created_at)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h3 className="font-semibold text-foreground/80 border-b pb-2">
                            Descripción y Notas
                          </h3>
                          <div className="flex-1 p-3 bg-background rounded-md border text-sm text-muted-foreground">
                            <p>Sin descripción registrada.</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6 md:-left-12" />
                <CarouselNext className="-right-6 md:-right-12" />
              </Carousel>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de maximizar */}
      <Dialog
        open={!!maxFoto}
        onOpenChange={(v) => {
          if (!v) setMaxFoto(null);
        }}
      >
        <DialogContent className="max-w-screen-xl w-[95vw] h-[95vh] p-0 flex items-center justify-center bg-black/80 border-none shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto maximizada</DialogTitle>
          </DialogHeader>
          {maxFoto?.direccion && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={maxFoto.direccion}
              alt={maxFoto.nombre || "Foto"}
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
