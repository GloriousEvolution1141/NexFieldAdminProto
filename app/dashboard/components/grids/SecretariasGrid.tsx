"use client";

import { useSearch } from "@/app/dashboard/components/SearchContext";
import Link from "next/link";
import { CreateSecretariaDialog } from "@/app/dashboard/components/CreateSecretariaDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar } from "lucide-react";

interface Secretaria {
  id: string;
  codigoUsuario: string | null;
  nombres: string;
  apellidos: string;
  activo: boolean | null;
  created_at: string | null;
}

export function SecretariasGrid({
  secretarias,
  adminId,
}: {
  secretarias: Secretaria[];
  adminId: string;
}) {
  const { query: q } = useSearch();

  const filtered = q
    ? secretarias.filter(
        (s) =>
          `${s.nombres} ${s.apellidos}`.toLowerCase().includes(q) ||
          (s.codigoUsuario || "").toLowerCase().includes(q),
      )
    : secretarias;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <CreateSecretariaDialog adminId={adminId} asCard />

      {filtered.map((sec) => (
        <Link
          key={sec.id}
          href={`/dashboard/secretaria/${sec.id}`}
          className="block"
        >
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    sec.activo !== false
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
                  }
                >
                  {sec.activo !== false ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3 leading-tight">
                {sec.nombres} {sec.apellidos}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {sec.codigoUsuario || "Sin código"}
              </p>
            </CardHeader>
            <CardContent className="pb-4 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(sec.created_at || new Date()).toLocaleDateString(
                    "es-ES",
                    { dateStyle: "medium" },
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {filtered.length === 0 && (
        <p className="col-span-full text-center text-sm text-muted-foreground py-10">
          No se encontraron secretarias para &ldquo;{q}&rdquo;.
        </p>
      )}
    </div>
  );
}
