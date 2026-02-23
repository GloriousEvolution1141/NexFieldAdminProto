import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TecnicosGrid } from "@/app/dashboard/components/grids/TecnicosGrid";

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
        .select(`
      id, codigoUsuario, nombres, apellidos, activo, created_at,
      suministros:suministro!suministro_asignado_a_fkey( id )
    `)
        .eq("creadoPor", userId)
        .eq("rol_id", 3)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6 mt-6">
            {showHeader ? (
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Técnicos</h1>
                    <p className="text-muted-foreground w-full max-w-2xl mt-2">
                        Aquí podrás ver a todos los técnicos que has registrado en el sistema.
                    </p>
                </div>
            ) : (
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Técnicos</h2>
                    <p className="text-muted-foreground w-full max-w-2xl mt-1 text-sm">
                        Listado de técnicos asignados a esta secretaria.
                    </p>
                </div>
            )}

            {error && (
                <div className="p-6 border rounded-xl bg-destructive/10 text-destructive text-sm">
                    Error al cargar técnicos: {error.message}
                </div>
            )}

            <Suspense>
                <TecnicosGrid tecnicos={tecnicos ?? []} userId={userId} basePath={basePath} />
            </Suspense>
        </div>
    );
}
