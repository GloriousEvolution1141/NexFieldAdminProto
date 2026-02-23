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
    { params }: { params: Promise<{ tecnicoId: string }> }
) {
    const { tecnicoId } = await params;
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: tecnico } = await supabase
        .from("usuario")
        .select("nombres, apellidos")
        .eq("id", tecnicoId)
        .single();

    // Paso 1: obtener IDs/nombres de suministros
    const { data: suministros, error } = await supabase
        .from("suministro")
        .select("id, nombre")
        .eq("asignado_a", tecnicoId)
        .order("nombre", { ascending: true });

    if (error || !suministros || suministros.length === 0) {
        return NextResponse.json({ error: "Este técnico no tiene suministros." }, { status: 404 });
    }

    const zip = new JSZip();
    let totalAdded = 0;
    const allErrors: string[] = [];

    // Paso 2: para cada suministro, buscar fotos individualmente (mismo query que funciona en el download individual)
    for (const suministro of suministros) {
        const { data: suministroConFotos } = await supabase
            .from("suministro")
            .select(`id, nombre, fotos:fotos( id, nombre, direccion )`)
            .eq("id", suministro.id)
            .single();

        const fotos = Array.isArray(suministroConFotos?.fotos) ? suministroConFotos.fotos : [];
        if (fotos.length === 0) continue;

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
                    totalAdded++;
                } catch (err: any) {
                    allErrors.push(`[${folderName}] foto ${index + 1}: ${err.message}`);
                }
            })
        );
    }

    if (totalAdded === 0) {
        return NextResponse.json(
            { error: `No se pudo descargar ninguna foto. Errores: ${allErrors.join("; ")}` },
            { status: 500 }
        );
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const body = new Uint8Array(zipBuffer);
    const tecnicoName = tecnico
        ? sanitize(`${tecnico.nombres} ${tecnico.apellidos}`)
        : "Tecnico";

    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${tecnicoName}.zip"`,
            "Content-Length": body.byteLength.toString(),
        },
    });
}
