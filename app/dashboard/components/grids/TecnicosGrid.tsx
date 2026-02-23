"use client";

import { useSearch } from "@/app/dashboard/components/SearchContext";
import Link from "next/link";
import { CreateTecnicoDialog } from "@/app/dashboard/components/CreateTecnicoDialog";
import { DownloadTecnicoButton } from "@/app/dashboard/components/DownloadTecnicoButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Calendar, Wrench } from "lucide-react";

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
  userId,
  basePath,
}: {
  tecnicos: Tecnico[];
  userId: string;
  basePath: string;
}) {
  const { query: q } = useSearch();

  const filtered = q
    ? tecnicos.filter(
        (t) =>
          `${t.nombres} ${t.apellidos}`.toLowerCase().includes(q) ||
          (t.codigoUsuario || "").toLowerCase().includes(q),
      )
    : tecnicos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <CreateTecnicoDialog adminOrSecretariaId={userId} asCard />

      {filtered.map((tk) => {
        const suministroCount = Array.isArray(tk.suministros)
          ? tk.suministros.length
          : 0;
        return (
          <Link key={tk.id} href={`${basePath}/${tk.id}`} className="block">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
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
                <CardTitle className="text-base mt-3 leading-tight">
                  {tk.nombres} {tk.apellidos}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  {tk.codigoUsuario || "Sin código"}
                </p>
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
                  <span>
                    {new Date(tk.created_at || new Date()).toLocaleDateString(
                      "es-ES",
                      { dateStyle: "medium" },
                    )}
                  </span>
                </div>
                <DownloadTecnicoButton
                  tecnicoId={tk.id}
                  tecnicoNombre={`${tk.nombres} ${tk.apellidos}`}
                  suministroCount={suministroCount}
                />
              </CardContent>
            </Card>
          </Link>
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
