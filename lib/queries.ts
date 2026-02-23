import { SupabaseClient } from "@supabase/supabase-js";

// ==========================================
// USUARIOS
// ==========================================

export async function getUsuarioById(client: SupabaseClient, id: string, selectFields = "rol_id, nombres, apellidos"): Promise<{ data: any; error: any }> {
    return client.from("usuario").select(selectFields).eq("id", id).single();
}

export async function getSecretariasByAdmin(client: SupabaseClient, adminId: string, selectFields = "id, nombres, apellidos"): Promise<{ data: any; error: any }> {
    return client.from("usuario").select(selectFields).eq("creadoPor", adminId).eq("rol_id", 2);
}

export async function getTecnicosByCreador(client: SupabaseClient, creadorId: string, selectFields = "id, nombres, apellidos"): Promise<{ data: any; error: any }> {
    return client.from("usuario").select(selectFields).eq("creadoPor", creadorId).eq("rol_id", 3);
}

// ==========================================
// SUMINISTROS
// ==========================================

export async function getSuministroById(client: SupabaseClient, suministroId: string, selectFields = "id, nombre, fotos:fotos( id, nombre, direccion )"): Promise<{ data: any; error: any }> {
    return client.from("suministro").select(selectFields).eq("id", suministroId).single();
}

export async function getSuministrosByTecnico(client: SupabaseClient, tecnicoId: string, selectFields = "id, nombre"): Promise<{ data: any; error: any }> {
    return client.from("suministro").select(selectFields).eq("asignado_a", tecnicoId).order("nombre", { ascending: true });
}

export async function getSuministrosByTecnicoDate(client: SupabaseClient, tecnicoId: string, startOfDay: string, endOfDay: string, selectFields = "id, nombre"): Promise<{ data: any; error: any }> {
    return client.from("suministro")
        .select(selectFields)
        .eq("asignado_a", tecnicoId)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("nombre", { ascending: true });
}
