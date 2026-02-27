"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleTecnicosState(tecnicoIds: string[]) {
  const supabase = await createClient();

  // First, get the current true state to flip it
  const { data: currentTecnicos, error: getError } = await supabase
    .from("usuario")
    .select("id, activo")
    .in("id", tecnicoIds);

  if (getError || !currentTecnicos) {
    return { error: getError?.message || "No se pudo obtener el estado actual" };
  }

  // Update in sequence or Promise.all
  try {
    const promises = currentTecnicos.map((tk) => 
      supabase.from("usuario").update({ activo: tk.activo === false ? true : false }).eq("id", tk.id)
    );

    const results = await Promise.all(promises);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
        return { error: "Hubo un error al actualizar algunos técnicos." };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error desconocido al actualizar" };
  }
}
