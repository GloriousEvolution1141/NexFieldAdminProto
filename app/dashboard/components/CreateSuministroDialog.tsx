"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CreateSuministroDialog({ adminOrSecretariaId, tecnicoId, asCard = false }: { adminOrSecretariaId: string; tecnicoId: string; asCard?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const nombresRaw = formData.get("nombres") as string;

        // Procesa el texto plano separado por saltos de línea
        const arrayNombres = nombresRaw
            .split("\n")
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (arrayNombres.length === 0) {
            setIsLoading(false);
            toast.error("Datos vacíos", { description: "Debe proveer al menos un suministro válido." });
            return;
        }

        const bulkPayload = arrayNombres.map((nombre) => ({
            nombre,
            asignado_a: tecnicoId,
            activo: true,
            creado_por: adminOrSecretariaId,
        }));

        const { error } = await supabase.from("suministro").insert(bulkPayload);

        setIsLoading(false);

        if (error) {
            toast.error("Error al crear Suministro", {
                description: error.message,
            });
        } else {
            toast.success("Suministros registrados", {
                description: `Se asignaron ${arrayNombres.length} equipo(s) exitosamente.`,
            });
            setIsOpen(false);
            window.location.reload();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {asCard ? (
                    <Card className="flex flex-col items-center justify-center gap-2 min-h-[160px] border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-muted-foreground hover:text-primary">
                        <div className="h-10 w-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">Agregar Suministros</span>
                    </Card>
                ) : (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Crear Suministro
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Suministros en Lote</DialogTitle>
                    <DialogDescription>
                        Escribe o pega desde Excel los nombres de los suministros (uno por línea).
                        Se asignarán automáticamente al técnico actual.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombres">Lista de Equipos/Materiales</Label>
                        <Textarea
                            id="nombres"
                            name="nombres"
                            placeholder={"Suministro 1\nSuministro 2\nSuministro 3"}

                            required
                            className="min-h-[150px] resize-y"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
