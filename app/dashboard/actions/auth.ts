"use server";

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Creates a user via the Supabase Admin API.
 * This bypasses the typical "signUp" flow so it DOES NOT
 * automatically log the newly created user in on the client.
 */
export async function createUsuarioAuthAdmin(email: string, password?: string) {
    // We need the service role key to bypass RLS and Auth rules
    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email if desired
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
}
