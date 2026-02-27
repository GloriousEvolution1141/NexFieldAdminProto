import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SuministrosData } from "@/app/dashboard/components/tables/SuministrosData";
import { getUsuarioById } from "@/lib/queries";
import { SuministrosProvider } from "@/app/dashboard/components/grids/SuministrosContext";
import { SuministrosHeader } from "@/app/dashboard/components/grids/SuministrosHeader";
import { LoadingOverlay } from "@/app/dashboard/components/LoadingOverlay";
import { Home } from "lucide-react";

interface PageProps {
  params: Promise<{ tecnicoId: string }>;
}

async function TecnicoBreadcrumb({ tecnicoId }: { tecnicoId: string }) {
  const supabase = await createClient();
  const { data: tecData } = await getUsuarioById(
    supabase,
    tecnicoId,
    "nombres, apellidos",
  );
  const tecnicoName = tecData
    ? `${tecData.nombres} ${tecData.apellidos}`
    : "Técnico";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              Técnicos
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Técnico {tecnicoName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

async function SuministrosSection({ tecnicoId }: { tecnicoId: string }) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/auth/login");
  const userId = userData.user.id;

  return <SuministrosData tecnicoId={tecnicoId} userId={userId} />;
}

export default async function TecnicoPage({ params }: PageProps) {
  const { tecnicoId } = await params;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/auth/login");
  const userId = userData.user.id;

  return (
    <div className="space-y-6">
      <TecnicoBreadcrumb tecnicoId={tecnicoId} />

      <SuministrosProvider>
        <SuministrosHeader tecnicoId={tecnicoId} userId={userId} />
        <Suspense fallback={<LoadingOverlay />}>
          <SuministrosSection tecnicoId={tecnicoId} />
        </Suspense>
      </SuministrosProvider>
    </div>
  );
}
