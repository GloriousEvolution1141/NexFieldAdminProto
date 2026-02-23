"use client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [codigoUsuario, setCodigoUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Concatenación dinámica para Login basada en el DNI
    const generatedEmail = `${codigoUsuario.trim()}@gmail.com`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: generatedEmail,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Código o contraseña incorrectos",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl text-white">
        {" "}
        <CardHeader>
          <div className="pb-4">
            <AspectRatio
              ratio={16 / 9}
              className="bg-muted rounded-md overflow-hidden"
            >
              <Image
                src="/logo.webp"
                alt="ImagenNext"
                fill
                className="object-cover"
                priority
              />
            </AspectRatio>
          </div>
          <CardTitle className="text-2xl text-center text-white">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Ingresa tu Código de Usuario para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="codigoUsuario" className="text-slate-300">
                  Código de Usuario
                </Label>
                <Input
                  id="codigoUsuario"
                  type="text"
                  placeholder="Ej. 12345678"
                  required
                  value={codigoUsuario}
                  onChange={(e) => setCodigoUsuario(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  {/* <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link> */}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading}
                className="
  w-full
  text-white
  bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700
  bg-[length:200%_100%]
  bg-left
  hover:bg-right
  transition-all
  duration-500
  shadow-lg shadow-blue-900/40
"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </div>
            {/* <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Regístrate
              </Link>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
