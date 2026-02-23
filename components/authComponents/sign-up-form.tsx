"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [codigoUsuario, setCodigoUsuario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Concatenación dinámica del email basada en el DNI
    const generatedEmail = `${codigoUsuario.trim()}@gmail.com`;

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: generatedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;

      // 2. Crear el registro en public.usuario usando el ID generado
      if (data.user) {
        const { error: dbError } = await supabase.from("usuario").insert({
          id: data.user.id,
          nombres,
          apellidos,
          codigoUsuario,
          empresa_id: 1, // Requisito de la base de datos
          rol_id: 1, // Asumimos rol Administrador por defecto en el registro público
          activo: true,
        });

        if (dbError) {
          // If there's an error inserting into the public.usuario table,
          // you might want to handle it, e.g., log it or delete the auth user.
          console.error("Error inserting user into public.usuario:", dbError);
          // Optionally, delete the auth user if the public profile creation fails
          // await supabase.auth.admin.deleteUser(data.user.id); // This requires admin privileges, usually not available on client-side
          throw new Error("Failed to create user profile.");
        }
      }

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Crea tu cuenta de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  type="text"
                  placeholder="Ej. Juan Carlos"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  type="text"
                  placeholder="Ej. Pérez"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="codigoUsuario">Código de Usuario / DNI</Label>
                <Input
                  id="codigoUsuario"
                  type="text"
                  placeholder="Ej. 12345678"
                  required
                  value={codigoUsuario}
                  onChange={(e) => setCodigoUsuario(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Será usado como tu identificador de ingreso.</p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repetir Contraseña</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
