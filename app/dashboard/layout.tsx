import { AuthButton } from "@/components/authComponents/auth-button";
import { ThemeSwitcher } from "@/components/authComponents/theme-switcher";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { HeaderDateDownload } from "./components/HeaderDateDownload";
import { HeaderSearch } from "./components/HeaderSearch";
import { SearchProvider } from "./components/SearchContext";
import { AuthButtonSkeleton } from "@/components/authComponents/AuthButtonSkeleton ";
import Link from "next/link";

export default function dashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <SearchProvider>
        <div className="relative min-h-screen flex flex-col bg-slate-50">
          <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
            <div className="h-[72px] grid grid-cols-3 items-center px-6 md:px-10 max-w-[1600px] mx-auto w-full">
              {/* Zona izquierda */}
              <div className="flex items-center justify-start gap-3">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="font-bold text-white text-sm">N</span>
                  </div>
                  <h1 className="font-bold text-xl text-slate-900 tracking-tight">
                    NextField
                  </h1>
                </Link>
              </div>

              {/* Zona centro */}
              <div className="flex justify-center items-center w-full max-w-xl mx-auto px-4">
                <HeaderSearch />
              </div>

              {/* Zona derecha */}
              <div className="flex justify-end items-center gap-5">
                <HeaderDateDownload />
                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                <AuthButton />
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-6 md:px-10 py-8 lg:py-10 bg-transparent">
            {children}
          </main>
        </div>
      </SearchProvider>
    </Suspense>
  );
}
