import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

/** Extracts a clean file extension from a URL. Works for Cloudinary and Supabase storage. */
function getExtFromUrl(url: string): string {
    const known = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"];
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    const candidate = match?.[1]?.toLowerCase();
    return candidate && known.includes(candidate) ? candidate : "jpg";
}

/** Sanitizes a string for use as a file or folder name (no slashes). */
function sanitize(name: string): string {
    return name.replace(/[/\\:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}

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

    const { data: suministro, error } = await supabase
        .from("suministro")
        .select(`id, nombre, fotos:fotos( id, nombre, direccion )`)
        .eq("id", suministroId)
        .single();

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

    let added = 0;
    const errors: string[] = [];

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
                added++;
            } catch (err: any) {
                errors.push(`Foto ${index + 1}: ${err.message}`);
            }
        })
    );

    if (added === 0) {
        return NextResponse.json(
            { error: `No se pudo descargar ninguna foto. Errores: ${errors.join("; ")}` },
            { status: 500 }
        );
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const body = new Uint8Array(zipBuffer);
    const zipName = `${folderName}.zip`;

    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipName}"`,
            "Content-Length": body.byteLength.toString(),
        },
    });
}
