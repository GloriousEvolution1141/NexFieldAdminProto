import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { SecretariasGrid } from "@/app/dashboard/components/grids/SecretariasGrid";

export async function SecretariasData({ userId }: { userId: string }) {
    const supabase = await createClient();
    const { data: secretarias, error } = await supabase
        .from("usuario")
        .select(`id, codigoUsuario, nombres, apellidos, activo, created_at`)
        .eq("creadoPor", userId)
        .eq("rol_id", 2)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Secretarias</h1>
                <p className="text-muted-foreground w-full max-w-2xl mt-2">
                    Administra de forma integral a las secretarias encargadas de los tecnicos.
                </p>
            </div>

            {error && (
                <div className="p-6 border rounded-xl bg-destructive/10 text-destructive text-sm">
                    Error al cargar: {error.message}
                </div>
            )}

            <Suspense>
                <SecretariasGrid secretarias={secretarias ?? []} adminId={userId} />
            </Suspense>
        </div>
    );
}
