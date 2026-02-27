"use client";

import { useSearch } from "@/app/dashboard/components/SearchContext";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DownloadTecnicoButton } from "@/app/dashboard/components/DownloadTecnicoButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { HardHat, Calendar, Wrench, CheckSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateToLima } from "@/lib/date-helpers";
import { useTecnicosContext } from "./TecnicosContext";
import { useEffect } from "react";

interface Tecnico {
  id: string;
  codigoUsuario: string | null;
  nombres: string;
  apellidos: string;
  activo: boolean | null;
  created_at: string | null;
  suministros: { id: string }[];
}

export function TecnicosGrid({
  tecnicos,
  basePath,
}: {
  tecnicos: Tecnico[];
  basePath: string;
}) {
  const { query: q } = useSearch();
  const { selected, setSelected, setTecnicos, animationKey } =
    useTecnicosContext();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    setTecnicos(tecnicos);
  }, [tecnicos, setTecnicos]);

  const filtered = q
    ? tecnicos.filter(
        (t) =>
          `${t.nombres} ${t.apellidos}`
            .toLowerCase()
            .includes(q.toLowerCase()) ||
          (t.codigoUsuario || "").toLowerCase().includes(q.toLowerCase()),
      )
    : tecnicos;

  return (
    <div
      key={animationKey}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {filtered.map((tk, index) => {
        const suministroCount = Array.isArray(tk.suministros)
          ? tk.suministros.length
          : 0;
        const isSelected = selected.has(tk.id);

        return (
          <Card
            key={tk.id}
            className="hover:shadow-lg transition-all flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: "backwards",
            }}
          >
            <Link
              href={`${basePath}/${tk.id}`}
              className="block flex-1 cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <HardHat className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      tk.activo !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
                    }
                  >
                    {tk.activo !== false ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2 leading-tight">
                  {tk.nombres} {tk.apellidos}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex-1 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>
                    {suministroCount} suministro
                    {suministroCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDateToLima(tk.created_at)}</span>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="pt-4 pb-5 px-5 flex items-center gap-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="ghost"
                className={`w-10 h-9 p-0 shrink-0 transition-colors border  ${
                  isSelected
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    : "text-slate-400 hover:bg-red-50 hover:text-red-600 border-slate-200"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleSelect(tk.id);
                }}
                title={isSelected ? "Deseleccionar" : "Seleccionar"}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <DownloadTecnicoButton
                  tecnicoId={tk.id}
                  tecnicoNombre={`${tk.nombres} ${tk.apellidos}`}
                  suministroCount={suministroCount}
                  iconOnly={true}
                />
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <p className="col-span-full text-center text-sm text-muted-foreground py-10">
          No se encontraron técnicos para &ldquo;{q}&rdquo;.
        </p>
      )}
    </div>
  );
}
