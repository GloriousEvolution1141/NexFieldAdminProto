"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
  CheckSquare,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTecnicosContext } from "./TecnicosContext";
import { useSearch } from "@/app/dashboard/components/SearchContext";
import { CreateTecnicoDialog } from "@/app/dashboard/components/CreateTecnicoDialog";
import { toggleTecnicosState } from "@/app/dashboard/actions/updateTecnicoState";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TecnicosHeader({
  userId,
  showHeader = true,
}: {
  userId: string;
  showHeader?: boolean;
}) {
  const { selected, setSelected, tecnicos, setAnimationKey } =
    useTecnicosContext();
  const { query: q } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  // Mismo filtrado que en la grilla para saber cuántos seleccionar
  const filtered = q
    ? tecnicos.filter(
        (t) =>
          `${t.nombres} ${t.apellidos}`
            .toLowerCase()
            .includes(q.toLowerCase()) ||
          (t.codigoUsuario || "").toLowerCase().includes(q.toLowerCase()),
      )
    : tecnicos;

  // Deshabilita los botones si no hay data todavía
  const isDataLoaded = tecnicos.length > 0;

  function handleBulkToggleStatus() {
    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await toggleTecnicosState(ids);
      if (result?.error) {
        toast.error("Error al cambiar estado", { description: result.error });
      } else {
        toast.success(
          `${ids.length} técnico${ids.length !== 1 ? "s" : ""} actualizado${ids.length !== 1 ? "s" : ""} correctamente.`,
          { duration: 2500 },
        );
        setSelected(new Set());
        router.refresh(); // Trigger page reload to show new states
      }
      setConfirmOpen(false);
    });
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setAnimationKey((prev) => prev + 1);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500); // Visual cue duration
  }

  const activeCount = tecnicos.filter((t) => t.activo !== false).length;
  const inactiveCount = tecnicos.length - activeCount;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        {showHeader ? (
          <div>
            <h1 className="text-[28px] md:text-3xl font-extrabold tracking-tight text-slate-900">
              Técnicos
            </h1>
            <p className="text-[15px] text-slate-500 w-full max-w-2xl mt-1.5">
              Aquí podrás ver a todos los técnicos que has registrado en el
              sistema.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-slate-900">
              Técnicos
            </h2>
            <p className="text-[15px] text-slate-500 w-full max-w-2xl mt-1.5">
              Listado de técnicos asignados a esta secretaria.
            </p>
          </div>
        )}
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
            variant="secondary"
            size="sm"
            className="gap-2 w-36 hover:bg-slate-200"
            disabled={selected.size === 0 || isPending || !isDataLoaded}
            onClick={() => setConfirmOpen(true)}
          >
            <Power className="h-4 w-4" />
            {isPending ? "Aplicando..." : `Estado (${selected.size})`}
          </Button>
        </div>
      </div>

      {/* Contenedor de KPIs y Crear Tecnico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <CreateTecnicoDialog adminOrSecretariaId={userId} asCard />

        <div className="flex flex-col items-center justify-center gap-1 min-h-[160px] border rounded-xl bg-white shadow-sm p-4 text-center">
          <Users className="h-6 w-6 text-blue-500 mb-1" />
          <h3 className="text-3xl font-bold text-slate-900">
            {tecnicos.length}
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Total
            <br />
            Técnicos
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 min-h-[160px] border rounded-xl bg-white shadow-sm p-4 text-center">
          <UserCheck className="h-6 w-6 text-emerald-500 mb-1" />
          <h3 className="text-3xl font-bold text-slate-900">{activeCount}</h3>
          <p className="text-sm font-medium text-slate-500">
            Técnicos
            <br />
            Activos
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 min-h-[160px] border rounded-xl bg-white shadow-sm p-4 text-center">
          <UserX className="h-6 w-6 text-rose-500 mb-1" />
          <h3 className="text-3xl font-bold text-slate-900">{inactiveCount}</h3>
          <p className="text-sm font-medium text-slate-500">
            Técnicos
            <br />
            Inactivos
          </p>
        </div>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-200">
          <DialogHeader>
            <DialogTitle>
              ¿Cambiar el estado de {selected.size} técnico
              {selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              Esta acción invertirá el estado actual (Activo ↔ Inactivo) para{" "}
              <strong>
                {selected.size} técnico{selected.size !== 1 ? "s" : ""}
              </strong>
              .
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
            <Button onClick={handleBulkToggleStatus} disabled={isPending}>
              {isPending ? "Cambiando..." : "Sí, cambiar estado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
