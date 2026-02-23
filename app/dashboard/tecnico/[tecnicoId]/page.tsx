import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SuministrosData } from "@/app/dashboard/components/tables/SuministrosData";

interface PageProps {
    params: Promise<{ tecnicoId: string }>;
}

async function PageContent({ paramsPromise }: { paramsPromise: Promise<{ tecnicoId: string }> }) {
    const { tecnicoId } = await paramsPromise;
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect("/auth/login");
    const userId = userData.user.id;

    const { data: tecData } = await supabase.from("usuario").select("nombres, apellidos").eq("id", tecnicoId).single();
    const tecnicoName = tecData ? `${tecData.nombres} ${tecData.apellidos}` : "Técnico";

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboard">Técnicos</Link></BreadcrumbLink>
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

export default function TecnicoPage({ params }: PageProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Suspense fallback={
                <div className="mt-6 flex flex-col items-center justify-center p-12 border rounded-xl bg-card text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p>Cargando suministros...</p>
                </div>
            }>
                <PageContent paramsPromise={params} />
            </Suspense>
        </div>
    );
}
