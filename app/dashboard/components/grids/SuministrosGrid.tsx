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
  Eye,
  Package,
  Calendar,
  Trash2,
  CheckSquare,
  Download,
  Loader2,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateToLima, formatDateTimeToLima } from "@/lib/date-helpers";

interface Foto {
  id: string;
  nombre: string | null;
  direccion: string | null;
  created_at: string | null;
  nota?: string | null;
  latitud?: string | null;
  longitud?: string | null;
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
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);

  useEffect(() => {
    if (open && fotoCount > 0 && !selectedFoto) {
      setSelectedFoto(s.fotos[0]);
    } else if (!open) {
      setTimeout(() => setSelectedFoto(null), 300); // clear after animation
    }
  }, [open, fotoCount, s.fotos, selectedFoto]);

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
        <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col bg-white overflow-hidden gap-0 border-none shadow-2xl rounded-2xl">
          {/* Main header spanning full width */}
          <DialogHeader className="p-6 border-b border-slate-100 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {s.nombre}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />{" "}
                    {formatDateToLima(s.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-500" /> #
                    {String(s.id).slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Split Content Area */}
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row bg-slate-50/50">
            {/* Left Column: Thumbnails */}
            <div className="w-full md:w-[60%] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  Evidencia de Campo ({fotoCount} Fotos)
                </h3>
              </div>

              {fotoCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <ImageIcon className="w-12 h-12 mb-3 text-slate-300" />
                  <p>Este suministro no tiene fotos registradas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {s.fotos.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFoto(f)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        selectedFoto?.id === f.id
                          ? "border-blue-500 shadow-md transform scale-[1.02]"
                          : "border-transparent border-slate-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      {f.direccion ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.direccion}
                          alt={f.nombre || "Foto"}
                          className="w-full h-full object-cover bg-slate-200 transition-transform duration-500 hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      {selectedFoto?.id === f.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm animate-in zoom-in duration-200">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                        <p className="text-white text-xs font-medium truncate drop-shadow-md">
                          {f.nombre || "Sin Título"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Selected Photo Details */}
            <div className="w-full md:w-[40%] bg-white border-l border-slate-100 overflow-y-auto custom-scrollbar flex flex-col">
              {selectedFoto ? (
                <div className="p-6 flex flex-col gap-6">
                  {/* Basic Info */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Foto Seleccionada
                    </h4>
                    <h3 className="text-lg font-bold text-slate-800 break-words leading-tight">
                      {selectedFoto.nombre || "Sin Título"}
                    </h3>
                  </div>

                  {/* Main Image View */}
                  <div
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-zoom-in group shadow-inner"
                    onClick={() => setMaxFoto(selectedFoto)}
                  >
                    {selectedFoto.direccion ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedFoto.direccion}
                        alt={selectedFoto.nombre || "Foto"}
                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Clic para ampliar
                      </span>
                    </div>
                  </div>

                  {/* Geolocation Section */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                      <MapPin className="w-3.5 h-3.5" /> Geolocalización
                    </h4>

                    <a
                      href={
                        selectedFoto.latitud && selectedFoto.longitud
                          ? `https://www.google.com/maps?q=${selectedFoto.latitud},${selectedFoto.longitud}&ll=${selectedFoto.latitud},${selectedFoto.longitud}&z=17`
                          : "#"
                      }
                      target={
                        selectedFoto.latitud && selectedFoto.longitud
                          ? "_blank"
                          : "_self"
                      }
                      rel="noopener noreferrer"
                      className="block w-full h-28 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      {/* Decorative map background placeholder */}
                      <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=2&size=400x200&sensor=false')] bg-cover bg-center opacity-[0.15] group-hover:opacity-30 transition-opacity grayscale group-hover:grayscale-0" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white mb-2 group-hover:-translate-y-1 transition-transform">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                          {selectedFoto.latitud && selectedFoto.longitud
                            ? "Abrir en Google Maps"
                            : "Ubicación no disponible"}
                        </span>
                      </div>
                    </a>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5">
                          Latitud
                        </span>
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {selectedFoto.latitud || "No registrada"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5">
                          Longitud
                        </span>
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {selectedFoto.longitud || "No registrada"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Notes Section */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Notas Técnicas
                    </h4>
                    <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-500 text-sm text-slate-700">
                      {selectedFoto.nota ? (
                        <p className="italic">"{selectedFoto.nota}"</p>
                      ) : (
                        <span className="text-slate-400 italic">
                          Sin notas registradas para esta evidencia.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="mt-auto space-y-2.5 pt-5 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Fecha de subida</span>
                      <span className="text-slate-700">
                        {selectedFoto.created_at
                          ? formatDateTimeToLima(selectedFoto.created_at)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="font-medium text-slate-600 mb-1">
                    Ninguna foto seleccionada
                  </h3>
                  <p className="text-sm">
                    Selecciona una foto de la cuadrícula para ver sus detalles y
                    ubicación
                  </p>
                </div>
              )}
            </div>
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
