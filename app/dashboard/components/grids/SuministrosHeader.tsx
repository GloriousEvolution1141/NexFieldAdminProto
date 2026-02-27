"use client";

import { useTransition, useState } from "react";
import {
  CheckSquare,
  Trash2,
  Package,
  CheckCircle2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSuministrosContext } from "./SuministrosContext";
import { deleteMultipleSuministros } from "@/app/dashboard/actions/deleteSuministro";
import { toast } from "sonner";
import { useSearch } from "@/app/dashboard/components/SearchContext";
import { CreateSuministroDialog } from "@/app/dashboard/components/CreateSuministroDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SuministrosHeader({
  tecnicoId,
  userId,
}: {
  tecnicoId: string;
  userId: string;
}) {
  const { selected, setSelected, suministros, setAnimationKey } =
    useSuministrosContext();
  const { query: q } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  // Mismo filtrado que en la grilla para saber cuántos seleccionar
  const filtered = q
    ? suministros.filter((s) =>
        s.nombre.toLowerCase().includes(q.toLowerCase()),
      )
    : suministros;

  function handleBulkDelete() {
    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await deleteMultipleSuministros(ids);
      if (result?.error) {
        toast.error("Error al eliminar", { description: result.error });
      } else {
        toast.success(
          `${ids.length} suministro${
            ids.length !== 1 ? "s" : ""
          } eliminado${ids.length !== 1 ? "s" : ""} correctamente.`,
          { duration: 2500 },
        );
        setSelected(new Set());
      }
      setConfirmOpen(false);
    });
  }

  // Deshabilita los botones si no hay data todavía (ej. array vacío durante skeletons)
  const isDataLoaded = suministros.length > 0;

  function handleRefresh() {
    setIsRefreshing(true);
    setAnimationKey((prev) => prev + 1);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500); // Visual cue duration
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-slate-900">
            Suministros
          </h2>
          <p className="text-[15px] text-slate-500 mt-1.5 w-full max-w-2xl">
            Listado de suministros asignados a este técnico.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 shrink-0 text-slate-500"
            onClick={handleRefresh}
            disabled={isRefreshing || !isDataLoaded}
            title="Actualizar datos"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-48"
            disabled={!isDataLoaded}
            onClick={() => {
              if (selected.size === filtered.length && filtered.length > 0) {
                setSelected(new Set());
              } else {
                setSelected(new Set(filtered.map((s) => s.id)));
              }
            }}
          >
            <CheckSquare className="h-4 w-4" />
            {selected.size === filtered.length && filtered.length > 0
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="gap-2 w-32"
            disabled={selected.size === 0 || isPending || !isDataLoaded}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {isPending ? "Borrando..." : `Eliminar ${selected.size}`}
          </Button>
        </div>
      </div>

      {/* Contenedor de KPIs y Crear Suministro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <CreateSuministroDialog
          adminOrSecretariaId={userId}
          tecnicoId={tecnicoId}
          asCard
        />
        <div className="flex flex-col items-center justify-center gap-1 min-h-[160px] border rounded-xl bg-white shadow-sm p-4 text-center">
          <Package className="h-6 w-6 text-blue-500 mb-1" />
          <h3 className="text-3xl font-bold text-slate-900">
            {suministros.length}
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Suministros
            <br />
            Asignados
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 min-h-[160px] border rounded-xl bg-white shadow-sm p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
          <h3 className="text-3xl font-bold text-slate-900">
            {suministros.filter((s) => s.estado === "completado").length}
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Suministros
            <br />
            Completados
          </p>
        </div>
        <div
          onClick={() => alert("Componente en proceso")}
          className="flex flex-col items-center justify-center gap-2 min-h-[160px] border-2 border-dashed rounded-xl bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-all cursor-pointer text-center p-4 text-slate-500 hover:text-slate-700"
        >
          <FileText className="h-7 w-7 mb-1" />
          <p className="text-sm font-medium">
            Documentos
            <br />
            Escaneados
          </p>
        </div>
      </div>

      {/* Confirm bulk delete */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-200">
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
    </>
  );
}
