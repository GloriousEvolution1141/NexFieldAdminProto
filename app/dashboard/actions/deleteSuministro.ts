"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteSuministro(suministroId: string) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return { error: "No autorizado" };
    }

    // Delete associated photos first (fotos table)  
    const { error: fotosError } = await supabase
        .from("fotos")
        .delete()
        .eq("suministro_id", suministroId);

    if (fotosError) {
        return { error: `Error al eliminar fotos: ${fotosError.message}` };
    }

    // Now delete the suministro itself
    const { error } = await supabase
        .from("suministro")
        .delete()
        .eq("id", suministroId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard", "layout");
    return { success: true };
}

export async function deleteMultipleSuministros(ids: string[]) {
    if (!ids.length) return { success: true };
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: "No autorizado" };

    const { error: fotosError } = await supabase
        .from("fotos")
        .delete()
        .in("suministro_id", ids);

    if (fotosError) return { error: `Error al eliminar fotos: ${fotosError.message}` };

    const { error } = await supabase
        .from("suministro")
        .delete()
        .in("id", ids);

    if (error) return { error: error.message };

    revalidatePath("/dashboard", "layout");
    return { success: true };
}
