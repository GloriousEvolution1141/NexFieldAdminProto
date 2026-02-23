export function formatDateToLima(isoStringOrDate: string | Date | null | undefined): string {
    if (!isoStringOrDate) return "Sin fecha";

    try {
        const dateObj = typeof isoStringOrDate === "string" ? new Date(isoStringOrDate) : isoStringOrDate;

        // Validar si la fecha es inválida
        if (isNaN(dateObj.getTime())) return "Fecha inválida";

        // Intl.DateTimeFormat soporta timeZone de forma nativa
        const formatter = new Intl.DateTimeFormat("es-ES", {
            timeZone: "America/Lima",
            dateStyle: "medium",
        });

        return formatter.format(dateObj);
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Fecha inválida";
    }
}

export function formatDateTimeToLima(isoStringOrDate: string | Date | null | undefined): string {
    if (!isoStringOrDate) return "Sin fecha";

    try {
        const dateObj = typeof isoStringOrDate === "string" ? new Date(isoStringOrDate) : isoStringOrDate;

        if (isNaN(dateObj.getTime())) return "Fecha inválida";

        const formatter = new Intl.DateTimeFormat("es-ES", {
            timeZone: "America/Lima",
            dateStyle: "long",
            timeStyle: "short",
        });

        return formatter.format(dateObj);
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Fecha inválida";
    }
}
