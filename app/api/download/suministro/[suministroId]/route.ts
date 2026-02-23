import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExtFromUrl, sanitize } from "@/lib/download-helpers";
import { getSuministroById } from "@/lib/queries";
import { nodeStreamToWebStream } from "@/lib/stream-helpers";
import JSZip from "jszip";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ suministroId: string }> }
) {
    const { suministroId } = await params;
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: suministro, error } = await getSuministroById(supabase, suministroId);

    if (error || !suministro) {
        return NextResponse.json({ error: "Suministro no encontrado" }, { status: 404 });
    }

    const fotos = Array.isArray(suministro.fotos) ? suministro.fotos : [];
    if (fotos.length === 0) {
        return NextResponse.json({ error: "Este suministro no tiene fotos descargables." }, { status: 404 });
    }

    const zip = new JSZip();
    const folderName = sanitize(suministro.nombre) || `suministro_${suministroId.slice(0, 8)}`;
    const folder = zip.folder(folderName)!;

    const errors: string[] = [];

    // Parallelize all photo downloads
    await Promise.all(
        fotos.map(async (foto: any, index: number) => {
            if (!foto.direccion) return;
            try {
                const res = await fetch(foto.direccion);
                if (!res.ok) {
                    errors.push(`Foto ${index + 1}: HTTP ${res.status}`);
                    return;
                }
                const buffer = await res.arrayBuffer();
                const ext = getExtFromUrl(foto.direccion);
                const name = sanitize(foto.nombre || `foto_${index + 1}`);
                folder.file(`${String(index + 1).padStart(2, "0")}_${name}.${ext}`, buffer);
            } catch (err: any) {
                errors.push(`Foto ${index + 1}: ${err.message}`);
            }
        })
    );

    const zipName = `${folderName}.zip`;

    const nodeStream = zip.generateNodeStream({ type: "nodebuffer", streamFiles: true, compression: "DEFLATE" });
    const stream = nodeStreamToWebStream(nodeStream);

    return new NextResponse(stream as unknown as BodyInit, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipName}"`,
        },
    });
}
