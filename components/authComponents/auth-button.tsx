import Link from "next/link";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { Badge } from "@/components/ui/badge";

type UsuarioConRol = {
  nombres: string;
  apellidos: string;
  rol: {
    nombre: string;
  } | null;
};

export async function AuthButton() {
  const supabase = await createClient();

  // 1️⃣ Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // 2️⃣ Traer usuario + rol (relación many-to-one)
  const { data: usuario } = await supabase
    .from("usuario")
    .select(`
      nombres,
      apellidos,
      rol:rol_id (
        nombre
      )
    `)
    .eq("id", user.id)
    .single<UsuarioConRol>();

  return (
    <div className="flex items-center gap-4">
      <Badge
        variant="secondary"
        className="h-9 w-40 pointer-events-none bg-slate-100 flex items-center justify-center"
      >
        <div className="flex flex-col text-sm text-center leading-tight">
          <span>
            {usuario?.nombres} {usuario?.apellidos}
          </span>
          <span className="text-gray-500 text-xs">
            Rol: {usuario?.rol?.nombre}
          </span>
        </div>
      </Badge>

      <LogoutButton />
    </div>
  );
}