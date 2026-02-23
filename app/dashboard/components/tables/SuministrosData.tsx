import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SuministrosGrid } from "@/app/dashboard/components/grids/SuministrosGrid";

export async function SuministrosData({ tecnicoId, userId }: { tecnicoId: string; userId: string }) {
    const supabase = await createClient();
    const { data: suministros, error } = await supabase
        .from("suministro")
        .select(`id, nombre, activo, created_at, fotos:fotos( id, nombre, direccion, created_at )`)
        .eq("asignado_a", tecnicoId)
        .order("created_at", { ascending: false });

    return (
        <div className="mt-6">
            {error && (
                <div className="p-6 border rounded-xl bg-destructive/10 text-destructive text-sm">
                    Error al cargar suministros: {error.message}
                </div>
            )}

            <Suspense>
                <SuministrosGrid suministros={suministros ?? []} userId={userId} tecnicoId={tecnicoId} />
            </Suspense>
        </div>
    );
}
