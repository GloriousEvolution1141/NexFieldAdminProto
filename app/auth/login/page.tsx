"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/authComponents/login-form";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoggedIn(true);
        // Redirige al dashboard y reemplaza el historial
        router.replace("/dashboard");
      }
      setLoading(false);
    });
  }, [router]);

  // Mientras verifica la sesión → no renderiza nada o puedes mostrar un skeleton
  if (loading) return null;

  // Si ya está logueado, tampoco renderiza (el router ya hizo replace)
  if (loggedIn) return null;

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative p-6 md:p-10"
        style={{ backgroundImage: "url('/fondo1.webp')" }}
      >
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Contenido */}
        <div className="relative w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
