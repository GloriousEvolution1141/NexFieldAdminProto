import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getExtFromUrl, sanitize } from "@/lib/download-helpers";
import { getUsuarioById, getSecretariasByAdmin, getTecnicosByCreador, getSuministrosByTecnico, getSuministroById } from "@/lib/queries";
import { nodeStreamToWebStream } from "@/lib/stream-helpers";
import JSZip from "jszip";

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

    // ── 2. Admin client (bypasses RLS) — auth was already verified ──
    const supabaseAdmin = getAdminClient();

    // ── 3. Get logged-in user info ──
    const { data: authUser } = await getUsuarioById(supabaseAdmin, userId);

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
        const { data: tecnicos } = await getTecnicosByCreador(supabaseAdmin, userId);

        secretariaMap.set(userId, {
            name: userName,
            tecnicos: (tecnicos ?? []).map((t: any) => ({
                id: t.id,
                name: sanitize(`${t.nombres} ${t.apellidos}`),
            })),
        });
    } else if (role === "1") {
        // Admin: get all secretarias and all their tecnicos
        const { data: secretarias } = await getSecretariasByAdmin(supabaseAdmin, userId);

        for (const sec of secretarias ?? []) {
            const { data: tecnicos } = await getTecnicosByCreador(supabaseAdmin, sec.id);

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

    // ── 5. Build ZIP stream with full hierarchy ──
    const zip = new JSZip();
    const allErrors: string[] = [];

    // Helper: fetch suministros for a tecnico and attach photos to the folder
    async function addTecnicoContent(tecFolder: JSZip, tecnicoId: string, pathPrefix: string) {
        // Get ALL suministros for this tecnico
        const { data: suministros } = await getSuministrosByTecnico(supabaseAdmin, tecnicoId);

        if (!suministros || suministros.length === 0) return;

        // Process all suministros in parallel
        await Promise.all(suministros.map(async (suministro: any) => {
            const suministroFolderName = sanitize(suministro.nombre) || `suministro_${suministro.id.slice(0, 8)}`;
            const suministroFolder = tecFolder.folder(suministroFolderName)!;

            // Get photos for this suministro
            const { data: conFotos } = await getSuministroById(supabaseAdmin, suministro.id);

            const fotos = Array.isArray(conFotos?.fotos) ? conFotos.fotos : [];
            if (fotos.length === 0) return;

            // Process all fotos in parallel
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
                    } catch (err: any) {
                        allErrors.push(`${pathPrefix}/${suministroFolderName} foto ${index + 1}: ${err.message}`);
                    }
                })
            );
        }));
    }

    // Load structure concurrently
    const preparationPromises: Promise<void>[] = [];

    if (role === "1") {
        // ── ADMIN: admin_name / fecha / secretaria / tecnico / suministro / fotos ──
        const rootFolder = zip.folder(userName)!;
        const dateFolder = rootFolder.folder(date)!;

        for (const [, secInfo] of secretariaMap) {
            const secFolder = dateFolder.folder(secInfo.name)!;
            for (const tec of secInfo.tecnicos) {
                const tecFolder = secFolder.folder(tec.name)!;
                preparationPromises.push(addTecnicoContent(tecFolder, tec.id, `${secInfo.name}/${tec.name}`));
            }
        }
    } else {
        // ── SECRETARIA (role 2): secretaria_name / fecha / tecnico / suministro / fotos ──
        const rootFolder = zip.folder(userName)!;
        const dateFolder = rootFolder.folder(date)!;

        for (const [, secInfo] of secretariaMap) {
            for (const tec of secInfo.tecnicos) {
                const tecFolder = dateFolder.folder(tec.name)!;
                preparationPromises.push(addTecnicoContent(tecFolder, tec.id, `${tec.name}`));
            }
        }
    }

    // Wait for all fetches and file attachments to finish
    await Promise.all(preparationPromises);

    const zipFileName = `${userName} - ${date}.zip`;
    
    // Instead of buffer -> Uint8Array, we generate a node stream and convert it to a web stream.
    const nodeStream = zip.generateNodeStream({ type: "nodebuffer", streamFiles: true, compression: "DEFLATE" });
    const stream = nodeStreamToWebStream(nodeStream);

    return new NextResponse(stream as unknown as BodyInit, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipFileName}"`,
        },
    });
}
