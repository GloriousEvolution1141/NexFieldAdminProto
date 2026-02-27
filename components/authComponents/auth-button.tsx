import Link from "next/link";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { User } from "lucide-react";

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
    .select(
      `
      nombres,
      apellidos,
      rol:rol_id (
        nombre
      )
    `,
    )
    .eq("id", user.id)
    .single<UsuarioConRol>();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-[14px] font-semibold text-slate-900 leading-tight">
            {usuario?.nombres} {usuario?.apellidos?.charAt(0)}.
          </span>
          <span className="text-[12px] text-slate-500 font-medium">
            {usuario?.rol?.nombre}
          </span>
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-slate-500" />
        </div>
      </div>

      <LogoutButton />
    </div>
  );
}
