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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createUsuarioAuthAdmin } from "@/app/dashboard/actions/auth";

export function CreateSecretariaDialog({
  adminId,
  asCard = false,
}: {
  adminId: string;
  asCard?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const nombres = formData.get("nombres") as string;
    const apellidos = formData.get("apellidos") as string;
    const codigoUsuario = formData.get("codigoUsuario") as string;

    const supabase = createClient();

    // Concatenación dinámica del email basada en el DNI
    const generatedEmail = `${codigoUsuario.trim()}@gmail.com`;

    // 1. Crear usuario en Auth SIN auto-logueo
    const authResponse = await createUsuarioAuthAdmin(generatedEmail, password);

    if (!authResponse.success || !authResponse.user) {
      setIsLoading(false);
      toast.error("Error al registrar credenciales", {
        description: authResponse.error,
      });
      return;
    }

    // 2. Insertar perfil en "usuario"
    const { error: dbError } = await supabase.from("usuario").insert({
      id: authResponse.user.id,
      nombres,
      apellidos,
      codigoUsuario,
      empresa_id: 1, // Requisito de la base de datos
      rol_id: 2, // 2 = Secretaria
      creadoPor: adminId,
      activo: true,
      // Forzar fecha actual al timezone de Lima al crearse
      created_at: new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .replace(", ", "T"),
    });

    setIsLoading(false);

    if (dbError) {
      toast.error("Error al registrar de perfil de Secretaria", {
        description: dbError.message,
      });
    } else {
      toast.success("Secretaria creada", {
        description: `Se ha registrado a ${nombres} ${apellidos} correctamente con su cuenta de acceso.`,
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
            <span className="text-sm font-medium">Nueva Secretaria</span>
          </Card>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Secretaria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-200">
        <DialogHeader>
          <DialogTitle>Nueva Secretaria</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la nueva secretaria. Se registrará bajo tu
            administración.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              name="nombres"
              placeholder="Ej. Ana María"
              required
              className="bg-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              name="apellidos"
              placeholder="Ej. García López"
              required
              className="bg-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoUsuario">Código de Usuario / DNI</Label>
            <Input
              id="codigoUsuario"
              name="codigoUsuario"
              placeholder="Ej. 12345678"
              required
              className="bg-slate-100"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Será usado como el identificador de ingreso de la Secretaria.
          </p>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="bg-slate-100"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-400 hover:bg-blue-500"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
