"use client";

import { useState, useTransition } from "react";
import { useSearch } from "@/app/dashboard/components/SearchContext";
import { CreateSuministroDialog } from "@/app/dashboard/components/CreateSuministroDialog";
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
  Maximize2,
  Package,
  Calendar,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { deleteMultipleSuministros } from "@/app/dashboard/actions/deleteSuministro";
import { toast } from "sonner";

interface Foto {
  id: string;
  nombre: string | null;
  direccion: string | null;
  created_at: string | null;
}

interface Suministro {
  id: string;
  nombre: string;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = q
    ? suministros.filter((s) => s.nombre.toLowerCase().includes(q))
    : suministros;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await deleteMultipleSuministros(ids);
      if (result?.error) {
        toast.error("Error al eliminar", { description: result.error });
      } else {
        toast.success(
          `${ids.length} suministro${ids.length !== 1 ? "s" : ""} eliminado${ids.length !== 1 ? "s" : ""} correctamente.`,
          { duration: 2500 },
        );
        setSelected(new Set());
      }
      setConfirmOpen(false);
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suministros</h2>
          <p className="text-muted-foreground w-full max-w-2xl mt-1 text-sm">
            Listado de suministros asignados a este técnico.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-48"
            onClick={() => {
              if (selected.size === filtered.length) {
                setSelected(new Set());
              } else {
                setSelected(new Set(filtered.map((s) => s.id)));
              }
            }}
          >
            <CheckSquare className="h-4 w-4" />
            {selected.size === filtered.length
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="gap-2 w-32"
            onClick={() => setConfirmOpen(true)}
            disabled={selected.size === 0 || isPending}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar {selected.size}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <CreateSuministroDialog
          adminOrSecretariaId={userId}
          tecnicoId={tecnicoId}
          asCard
        />

        {filtered.map((s) => {
          const fotoCount = Array.isArray(s.fotos) ? s.fotos.length : 0;
          return (
            <SuministroCard
              key={s.id}
              s={s}
              fotoCount={fotoCount}
              isSelected={selected.has(s.id)}
              onToggle={() => toggleSelect(s.id)}
            />
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-10">
            No se encontraron suministros para &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>

      {/* Confirm bulk delete — usa Dialog normal para poder cerrarse al hacer click fuera */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              ¿Eliminar {selected.size} suministro
              {selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará{" "}
              <strong>
                {selected.size} suministro{selected.size !== 1 ? "s" : ""}
              </strong>{" "}
              y todas sus fotos de forma permanente. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuministroCard({
  s,
  fotoCount,
  isSelected,
  onToggle,
}: {
  s: Suministro;
  fotoCount: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Estado separado para el maximizador — se renderiza fuera del DialogContent con overflow
  const [maxFoto, setMaxFoto] = useState<Foto | null>(null);

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge
              variant="outline"
              className={
                s.activo
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
              }
            >
              {s.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <CardTitle className="text-sm mt-3 leading-snug line-clamp-2">
            {s.nombre}
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-2 flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(s.created_at || new Date()).toLocaleDateString(
                "es-ES",
                { dateStyle: "medium" },
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {fotoCount} foto{fotoCount !== 1 ? "s" : ""}
          </p>
        </CardContent>

        <CardFooter className="pt-2 pb-4 flex items-center justify-between gap-2 border-t">
          <Button
            size="sm"
            variant={isSelected ? "destructive" : "outline"}
            className="w-16 h-8 p-0"
            onClick={onToggle}
            title={isSelected ? "Deseleccionar" : "Seleccionar"}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Ver
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog de fotos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos de {s.nombre}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 px-8">
            {fotoCount === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-6">
                Este suministro no tiene fotos registradas.
              </p>
            ) : (
              <Carousel className="w-full max-w-3xl mx-auto">
                <CarouselContent>
                  {s.fotos.map((f) => (
                    <CarouselItem key={f.id}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-lg border p-4 bg-muted/30">
                        <div className="flex flex-col gap-2 h-[350px] lg:col-span-2">
                          <span className="font-semibold text-lg truncate">
                            {f.nombre || "Sin Título"}
                          </span>
                          <div className="w-full h-full bg-muted-foreground/10 rounded-md overflow-hidden flex items-center justify-center relative">
                            {f.direccion ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={f.direccion}
                                  alt={f.nombre || "Foto"}
                                  className="absolute inset-0 w-full h-full object-contain bg-black/5"
                                />
                                {/* Botón maximizar — abre el dialog fuera del overflow */}
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="absolute top-2 right-2 z-20 bg-background/80 hover:bg-background backdrop-blur"
                                  onClick={() => setMaxFoto(f)}
                                >
                                  <Maximize2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Sin URL de imagen
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              f.created_at || new Date(),
                            ).toLocaleString("es-ES", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })}
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

      {/* Dialog de maximizar — renderizado FUERA del DialogContent con overflow
                para que el portal se posicione correctamente en el viewport (centro) */}
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
