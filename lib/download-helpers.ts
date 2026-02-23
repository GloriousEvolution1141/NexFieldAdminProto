/** Extracts a clean file extension from a URL. Works for Cloudinary and Supabase storage. */
export function getExtFromUrl(url: string): string {
    const known = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"];
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    const candidate = match?.[1]?.toLowerCase();
    return candidate && known.includes(candidate) ? candidate : "jpg";
}

/** Sanitizes a string for use as a file or folder name (no slashes). */
export function sanitize(name: string): string {
    return name.replace(/[/\\:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}
