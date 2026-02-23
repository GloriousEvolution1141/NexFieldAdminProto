"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteSuministro } from "@/app/dashboard/actions/deleteSuministro";

export function DeleteSuministroCheckbox({
    suministroId,
    suministroNombre,
}: {
    suministroId: string;
    suministroNombre: string;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleCheck(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    }

    function handleConfirm() {
        startTransition(async () => {
            const result = await deleteSuministro(suministroId);
            if (result?.error) {
                toast.error("Error al eliminar", { description: result.error });
            } else {
                toast.success("Suministro eliminado", {
                    description: `"${suministroNombre}" fue eliminado correctamente.`,
                    duration: 2000,
                });
            }
            setOpen(false);
        });
    }

    return (
        <>
            {/* Checkbox trigger — stops propagation so it doesn't open the photo dialog */}
            <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={handleCheck}
            >
                <Checkbox
                    id={`del-${suministroId}`}
                    checked={false}
                    className="border-destructive/50 data-[state=checked]:bg-destructive pointer-events-none"
                    aria-label="Eliminar suministro"
                />
                <label
                    htmlFor={`del-${suministroId}`}
                    className="text-xs text-muted-foreground group-hover:text-destructive transition-colors cursor-pointer select-none flex items-center gap-1"
                >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                </label>
            </div>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-screen-xl w-[95vw] h-[95vh] p-0 flex items-center justify-center bg-black/80 border-none shadow-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar suministro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará <strong>&ldquo;{suministroNombre}&rdquo;</strong> y todas sus fotos de forma permanente. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Eliminando..." : "Sí, eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
