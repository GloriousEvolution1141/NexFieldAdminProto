import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Creates and returns a Supabase admin client that bypasses Row Level Security.
 * Use this only in server actions or API routes, AFTER verifying user authorization.
 */
export function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
