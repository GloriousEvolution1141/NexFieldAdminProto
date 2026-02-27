import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioById } from "@/lib/queries";
import { SecretariasData } from "./components/tables/SecretariasData";
import { TecnicosData } from "./components/tables/TecnicosData";
import { LoadingOverlay } from "./components/LoadingOverlay";

function UnderConstructionData() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Panel de Control
        </h1>
      </div>
      <div className="mt-8 p-12 border rounded-xl bg-card text-muted-foreground flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-16 w-16 bg-muted shadow-sm rounded-full flex items-center justify-center text-3xl mb-2">
          🛠️
        </div>
        <h2 className="text-2xl font-bold text-foreground">En proceso</h2>
        <p className="max-w-md">
          El panel de control interactivo para tu rol de usuario aún está en
          desarrollo.
        </p>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/auth/login");

  const userId = userData.user.id;
  const { data: dbUser } = await getUsuarioById(supabase, userId, "rol_id");
  const role = dbUser?.rol_id?.toString() || "";

  if (role === "2") {
    return (
      <TecnicosData
        userId={userId}
        basePath="/dashboard/tecnico"
        showHeader={true}
      />
    );
  }
  if (role === "1") {
    return <SecretariasData userId={userId} />;
  }
  return <UnderConstructionData />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
      <Suspense fallback={<LoadingOverlay />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
