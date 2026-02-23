import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TecnicosData } from "@/app/dashboard/components/tables/TecnicosData";

interface PageProps {
    params: Promise<{ secretariaId: string }>;
}

async function PageContent({ paramsPromise }: { paramsPromise: Promise<{ secretariaId: string }> }) {
    const { secretariaId } = await paramsPromise;
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect("/auth/login");

    const { data: secData } = await supabase.from("usuario").select("nombres, apellidos").eq("id", secretariaId).single();
    const secretariaName = secData ? `${secData.nombres} ${secData.apellidos}` : "Secretaria";

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboard">Secretarias</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Secretaria {secretariaName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <TecnicosData userId={secretariaId} basePath={`/dashboard/secretaria/${secretariaId}/tecnico`} showHeader={false} />
        </div>
    );
}

export default function SecretariaPage({ params }: PageProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Suspense fallback={
                <div className="mt-6 flex flex-col items-center justify-center p-12 border rounded-xl bg-card text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p>Cargando técnicos...</p>
                </div>
            }>
                <PageContent paramsPromise={params} />
            </Suspense>
        </div>
    );
}
