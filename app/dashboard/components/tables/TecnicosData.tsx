import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TecnicosGrid } from "@/app/dashboard/components/grids/TecnicosGrid";
import { TecnicosProvider } from "@/app/dashboard/components/grids/TecnicosContext";
import { TecnicosHeader } from "@/app/dashboard/components/grids/TecnicosHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export async function TecnicosData({
  userId,
  basePath,
  showHeader = true,
}: {
  userId: string;
  basePath: string;
  showHeader?: boolean;
}) {
  const supabase = await createClient();
  const { data: tecnicos, error } = await supabase
    .from("usuario")
    .select(
      `
      id, codigoUsuario, nombres, apellidos, activo, created_at,
      suministros:suministro!suministro_asignado_a_fkey( id )
    `,
    )
    .eq("creadoPor", userId)
    .eq("rol_id", 3)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              Técnicos
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <TecnicosProvider>
        <TecnicosHeader userId={userId} showHeader={showHeader} />

        {error && (
          <div className="p-6 border rounded-xl bg-destructive/10 text-destructive text-sm">
            Error al cargar técnicos: {error.message}
          </div>
        )}

        <Suspense>
          <TecnicosGrid tecnicos={tecnicos ?? []} basePath={basePath} />
        </Suspense>
      </TecnicosProvider>
    </div>
  );
}
