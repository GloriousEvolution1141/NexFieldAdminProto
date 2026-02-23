"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout} variant={"outline"} className="bg-red-600 border-red-400 text-white hover:bg-red-600 hover:text-white  hover:border-red-600 w-20">Salir</Button>;
}
