import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const { data: authUser } = await supabase
        .from("usuario")
        .select("rol_id, nombres, apellidos")
        .eq("id", userId)
        .single();

    if (!authUser) {
        return NextResponse.json({ error: "Usuario no encontrado en la base de datos." }, { status: 401 });
    }

    const role = authUser.rol_id?.toString();

    // Build a map of secretariaId → { name, tecnicoIds[] }
    // This gives us the secretaria→tecnico hierarchy for the ZIP structure.
    type SecretariaGroup = { name: string; tecnicoIds: string[] };
    const secretariaMap = new Map<string, SecretariaGroup>();

    if (role === "2") {
        // Logged-in user IS the secretaria
        const secName = sanitize(`${authUser.nombres} ${authUser.apellidos}`);
        const { data: tecnicos } = await supabase
            .from("usuario")
            .select("id")
            .eq("creadoPor", userId)
            .eq("rol_id", 3);
        secretariaMap.set(userId, { name: secName, tecnicoIds: (tecnicos ?? []).map((t: any) => t.id) });
    } else if (role === "1") {
        // Admin: get all secretarias and their technicians
        const { data: secretarias } = await supabase
            .from("usuario")
            .select("id, nombres, apellidos")
            .eq("creadoPor", userId)
            .eq("rol_id", 2);

        for (const sec of secretarias ?? []) {
            const { data: tecnicos } = await supabase
                .from("usuario")
                .select("id")
                .eq("creadoPor", sec.id)
                .eq("rol_id", 3);
            secretariaMap.set(sec.id, {
                name: sanitize(`${sec.nombres} ${sec.apellidos}`),
                tecnicoIds: (tecnicos ?? []).map((t: any) => t.id),
            });
        }
    }

    if (secretariaMap.size === 0) {
        return NextResponse.json({ error: "No hay secretarias asociadas a tu cuenta." }, { status: 404 });
    }

    const allTecnicoIds = [...secretariaMap.values()].flatMap((s) => s.tecnicoIds);
    if (allTecnicoIds.length === 0) {
        return NextResponse.json({ error: "No hay técnicos asociados." }, { status: 404 });
    }

    // Get suministros from those technicians on the given date, joining the technician
    const { data: suministros, error } = await supabase
        .from("suministro")
        .select(`
      id, nombre, asignado_a,
      tecnico:usuario!suministro_asignado_a_fkey( id, nombres, apellidos, creadoPor )
    `)
        .in("asignado_a", allTecnicoIds)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("nombre", { ascending: true });

    if (error || !suministros || suministros.length === 0) {
        return NextResponse.json({ error: `No hay suministros registrados el ${date}.` }, { status: 404 });
    }

    // Build reverse map: tecnicoId → secretariaId
    const tecnicoToSecretaria = new Map<string, string>();
    for (const [secId, group] of secretariaMap) {
        for (const tId of group.tecnicoIds) tecnicoToSecretaria.set(tId, secId);
    }

    const zip = new JSZip();
    const dateFolder = zip.folder(date)!;
    let totalAdded = 0;
    const allErrors: string[] = [];

    // Group: secretaria → tecnico → [suministros]
    type TecnicoGroup = { name: string; suministros: typeof suministros };
    const hierarchy = new Map<string, { secName: string; tecnicos: Map<string, TecnicoGroup> }>();

    for (const s of suministros) {
        const tec = s.tecnico as any;
        const tecId = s.asignado_a || "unknown";
        const secId = tecnicoToSecretaria.get(tecId) || "unknown";
        const secName = secretariaMap.get(secId)?.name || "Sin_Secretaria";
        const tecName = tec ? sanitize(`${tec.nombres} ${tec.apellidos}`) : "Sin_Técnico";

        if (!hierarchy.has(secId)) {
            hierarchy.set(secId, { secName, tecnicos: new Map() });
        }
        const secGroup = hierarchy.get(secId)!;
        if (!secGroup.tecnicos.has(tecId)) {
            secGroup.tecnicos.set(tecId, { name: tecName, suministros: [] });
        }
        secGroup.tecnicos.get(tecId)!.suministros.push(s);
    }

    for (const [, secGroup] of hierarchy) {
        const secFolder = dateFolder.folder(secGroup.secName)!;

        for (const [, tecGroup] of secGroup.tecnicos) {
            const tecFolder = secFolder.folder(tecGroup.name)!;

            for (const suministro of tecGroup.suministros) {
                const { data: conFotos } = await supabase
                    .from("suministro")
                    .select(`id, nombre, fotos:fotos( id, nombre, direccion )`)
                    .eq("id", suministro.id)
                    .single();

                const fotos = Array.isArray(conFotos?.fotos) ? conFotos.fotos : [];
                if (fotos.length === 0) continue;

                const suministroFolderName = sanitize(suministro.nombre) || `suministro_${suministro.id.slice(0, 8)}`;
                const suministroFolder = tecFolder.folder(suministroFolderName)!;

                await Promise.all(
                    fotos.map(async (foto: any, index: number) => {
                        if (!foto.direccion) return;
                        try {
                            const res = await fetch(foto.direccion);
                            if (!res.ok) {
                                allErrors.push(`${secGroup.secName}/${tecGroup.name}/${suministroFolderName} foto ${index + 1}: HTTP ${res.status}`);
                                return;
                            }
                            const buffer = await res.arrayBuffer();
                            const ext = getExtFromUrl(foto.direccion);
                            const name = sanitize(foto.nombre || `foto_${index + 1}`);
                            suministroFolder.file(`${String(index + 1).padStart(2, "0")}_${name}.${ext}`, buffer);
                            totalAdded++;
                        } catch (err: any) {
                            allErrors.push(`${secGroup.secName}/${tecGroup.name}/${suministroFolderName} foto ${index + 1}: ${err.message}`);
                        }
                    })
                );
            }
        }
    }

    if (totalAdded === 0) {
        return NextResponse.json(
            { error: `No se pudo descargar ninguna foto. ${allErrors.join("; ")}` },
            { status: 500 }
        );
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const body = new Uint8Array(zipBuffer);

    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${date}.zip"`,
            "Content-Length": body.byteLength.toString(),
        },
    });
}
