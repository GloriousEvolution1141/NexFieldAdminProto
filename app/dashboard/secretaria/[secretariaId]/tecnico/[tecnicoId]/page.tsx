import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioById } from "@/lib/queries";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SuministrosData } from "@/app/dashboard/components/tables/SuministrosData";

interface PageProps {
  params: Promise<{ secretariaId: string; tecnicoId: string }>;
}

async function PageContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ secretariaId: string; tecnicoId: string }>;
}) {
  const { secretariaId, tecnicoId } = await paramsPromise;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/auth/login");
  const userId = userData.user.id;

  const [secRes, tecRes] = await Promise.all([
    getUsuarioById(supabase, secretariaId, "nombres, apellidos"),
    getUsuarioById(supabase, tecnicoId, "nombres, apellidos"),
  ]);

  const secretariaName = secRes.data
    ? `${secRes.data.nombres} ${secRes.data.apellidos}`
    : "Secretaria";
  const tecnicoName = tecRes.data
    ? `${tecRes.data.nombres} ${tecRes.data.apellidos}`
    : "Técnico";

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Secretarias</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/secretaria/${secretariaId}`}>
                Secretaria {secretariaName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Técnico {tecnicoName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <SuministrosData tecnicoId={tecnicoId} userId={userId} />
    </div>
  );
}

export default function TecnicoSuministrosPage({ params }: PageProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Suspense
        fallback={
          <div className="mt-6 flex flex-col items-center justify-center p-12 border rounded-xl bg-card text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Cargando suministros...</p>
          </div>
        }
      >
        <PageContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
