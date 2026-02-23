import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExtFromUrl, sanitize } from "@/lib/download-helpers";
import { getUsuarioById, getSuministrosByTecnico, getSuministroById } from "@/lib/queries";
import { nodeStreamToWebStream } from "@/lib/stream-helpers";
import JSZip from "jszip";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tecnicoId: string }> }
) {
    const { tecnicoId } = await params;
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: tecnico } = await getUsuarioById(supabase, tecnicoId, "nombres, apellidos");

    // Paso 1: obtener IDs/nombres de suministros
    const { data: suministros, error } = await getSuministrosByTecnico(supabase, tecnicoId, "id, nombre");

    if (error || !suministros || suministros.length === 0) {
        return NextResponse.json({ error: "Este técnico no tiene suministros." }, { status: 404 });
    }

    const zip = new JSZip();
    const allErrors: string[] = [];

    // Paso 2: Load and attach all photos concurrently
    await Promise.all(
        suministros.map(async (suministro: any) => {
            const { data: suministroConFotos } = await getSuministroById(supabase, suministro.id);

            const fotos = Array.isArray(suministroConFotos?.fotos) ? suministroConFotos.fotos : [];
            if (fotos.length === 0) return;

            const folderName = sanitize(suministro.nombre) || `suministro_${suministro.id.slice(0, 8)}`;
            const folder = zip.folder(folderName)!;

            await Promise.all(
                fotos.map(async (foto: any, index: number) => {
                    if (!foto.direccion) return;
                    try {
                        const res = await fetch(foto.direccion);
                        if (!res.ok) {
                            allErrors.push(`[${folderName}] foto ${index + 1}: HTTP ${res.status}`);
                            return;
                        }
                        const buffer = await res.arrayBuffer();
                        const ext = getExtFromUrl(foto.direccion);
                        const name = sanitize(foto.nombre || `foto_${index + 1}`);
                        folder.file(`${String(index + 1).padStart(2, "0")}_${name}.${ext}`, buffer);
                    } catch (err: any) {
                        allErrors.push(`[${folderName}] foto ${index + 1}: ${err.message}`);
                    }
                })
            );
        })
    );

    const zipFileName = tecnico
        ? `${sanitize(`${tecnico.nombres} ${tecnico.apellidos}`)}.zip`
        : "Tecnico.zip";

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
