import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import JSZip from "jszip";

function getExtFromUrl(url: string): string {
    const known = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"];
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    const candidate = match?.[1]?.toLowerCase();
    return candidate && known.includes(candidate) ? candidate : "jpg";
}

function sanitize(name: string): string {
    return name.replace(/[/\\:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ date: string }> }
) {
    const { date } = await params;
    const supabase = await createClient();

    // ── 1. Auth check ──
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 });
    }

    const userId = userData.user.id;
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // ── 2. Admin client (bypasses RLS) — auth was already verified ──
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Get logged-in user info ──
    const { data: authUser } = await supabaseAdmin
        .from("usuario")
        .select("rol_id, nombres, apellidos")
        .eq("id", userId)
        .single();

    if (!authUser) {
        return NextResponse.json({ error: "Usuario no encontrado en la base de datos." }, { status: 401 });
    }

    const role = authUser.rol_id?.toString();
    const userName = sanitize(`${authUser.nombres} ${authUser.apellidos}`);

    // ── 4. Build full hierarchy: secretarias → tecnicos (with names) ──
    type TecnicoInfo = { id: string; name: string };
    type SecretariaInfo = { name: string; tecnicos: TecnicoInfo[] };
    const secretariaMap = new Map<string, SecretariaInfo>();

    if (role === "2") {
        // Secretaria: get all her tecnicos
        const { data: tecnicos } = await supabaseAdmin
            .from("usuario")
            .select("id, nombres, apellidos")
            .eq("creadoPor", userId)
            .eq("rol_id", 3);

        secretariaMap.set(userId, {
            name: userName,
            tecnicos: (tecnicos ?? []).map((t: any) => ({
                id: t.id,
                name: sanitize(`${t.nombres} ${t.apellidos}`),
            })),
        });
    } else if (role === "1") {
        // Admin: get all secretarias and all their tecnicos
        const { data: secretarias } = await supabaseAdmin
            .from("usuario")
            .select("id, nombres, apellidos")
            .eq("creadoPor", userId)
            .eq("rol_id", 2);

        for (const sec of secretarias ?? []) {
            const { data: tecnicos } = await supabaseAdmin
                .from("usuario")
                .select("id, nombres, apellidos")
                .eq("creadoPor", sec.id)
                .eq("rol_id", 3);

            secretariaMap.set(sec.id, {
                name: sanitize(`${sec.nombres} ${sec.apellidos}`),
                tecnicos: (tecnicos ?? []).map((t: any) => ({
                    id: t.id,
                    name: sanitize(`${t.nombres} ${t.apellidos}`),
                })),
            });
        }
    }

    if (secretariaMap.size === 0) {
        return NextResponse.json({ error: "No hay secretarias asociadas a tu cuenta." }, { status: 404 });
    }

    // ── 5. Build ZIP with full hierarchy, then fill with date-filtered suministros ──
    const zip = new JSZip();
    const allErrors: string[] = [];
    let totalAdded = 0;

    // Helper: fetch suministros for a tecnico on the given date and add to folder
    async function addTecnicoContent(tecFolder: JSZip, tecnicoId: string, pathPrefix: string) {
        // Get ALL suministros for this tecnico
        const { data: suministros } = await supabaseAdmin
            .from("suministro")
            .select("id, nombre")
            .eq("asignado_a", tecnicoId)
            .order("nombre", { ascending: true });

        if (!suministros || suministros.length === 0) return;

        for (const suministro of suministros) {
            const suministroFolderName = sanitize(suministro.nombre) || `suministro_${suministro.id.slice(0, 8)}`;
            const suministroFolder = tecFolder.folder(suministroFolderName)!;

            // Get photos for this suministro
            const { data: conFotos } = await supabaseAdmin
                .from("suministro")
                .select(`id, nombre, fotos:fotos( id, nombre, direccion )`)
                .eq("id", suministro.id)
                .single();

            const fotos = Array.isArray(conFotos?.fotos) ? conFotos.fotos : [];
            if (fotos.length === 0) continue;

            await Promise.all(
                fotos.map(async (foto: any, index: number) => {
                    if (!foto.direccion) return;
                    try {
                        const res = await fetch(foto.direccion);
                        if (!res.ok) {
                            allErrors.push(`${pathPrefix}/${suministroFolderName} foto ${index + 1}: HTTP ${res.status}`);
                            return;
                        }
                        const buffer = await res.arrayBuffer();
                        const ext = getExtFromUrl(foto.direccion);
                        const name = sanitize(foto.nombre || `foto_${index + 1}`);
                        suministroFolder.file(`${String(index + 1).padStart(2, "0")}_${name}.${ext}`, buffer);
                        totalAdded++;
                    } catch (err: any) {
                        allErrors.push(`${pathPrefix}/${suministroFolderName} foto ${index + 1}: ${err.message}`);
                    }
                })
            );
        }
    }

    if (role === "1") {
        // ── ADMIN: admin_name / fecha / secretaria / tecnico / suministro / fotos ──
        const rootFolder = zip.folder(userName)!;
        const dateFolder = rootFolder.folder(date)!;

        for (const [, secInfo] of secretariaMap) {
            const secFolder = dateFolder.folder(secInfo.name)!;
            for (const tec of secInfo.tecnicos) {
                const tecFolder = secFolder.folder(tec.name)!;
                await addTecnicoContent(tecFolder, tec.id, `${secInfo.name}/${tec.name}`);
            }
        }
    } else {
        // ── SECRETARIA (role 2): secretaria_name / fecha / tecnico / suministro / fotos ──
        const rootFolder = zip.folder(userName)!;
        const dateFolder = rootFolder.folder(date)!;

        for (const [, secInfo] of secretariaMap) {
            for (const tec of secInfo.tecnicos) {
                const tecFolder = dateFolder.folder(tec.name)!;
                await addTecnicoContent(tecFolder, tec.id, `${tec.name}`);
            }
        }
    }

    const zipFileName = `${userName} - ${date}.zip`;
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const body = new Uint8Array(zipBuffer);

    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipFileName}"`,
            "Content-Length": body.byteLength.toString(),
        },
    });
}
