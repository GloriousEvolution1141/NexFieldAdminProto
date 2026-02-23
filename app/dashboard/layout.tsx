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
        <div className="relative min-h-screen flex flex-col bg-blue-300">
          <header className="sticky top-0 z-50 w-full border-y-blue-500 shadow-md bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="h-16 grid grid-cols-3 items-center px-4 sm:px-8 max-w-8xl mx-auto w-full">
              {/* Zona izquierda */}
              <Link
                href="/dashboard"
                className="h-12 flex items-center justify-start gap-4 "
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <span className="font-bold text-sm">N</span>
                </Button>
                <div className="flex flex-col ">
                  <h1 className="font-bold  leading-tight tracking-tight">
                    NextField
                  </h1>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                    Admin
                  </p>
                </div>
              </Link>

              {/* Zona centro */}
              <div className="h-12 flex justify-center items-center w-full max-w-md mx-auto">
                <HeaderSearch />
              </div>

              {/* Zona derecha */}
              <div className="h-12 flex justify-end items-center gap-4">
                <Suspense
                  fallback={
                    <div className="hidden sm:flex gap-2">
                      <div className="h-7 w-28 rounded-full bg-muted animate-pulse" />
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                    </div>
                  }
                >
                  <HeaderDateDownload />
                </Suspense>
                <Suspense fallback={<AuthButtonSkeleton />}>
                  <AuthButton />
                </Suspense>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col max-w-8xl w-full px-24 py-6 bg-blue-50">
            {children}
          </main>
          {/* 
          <footer className="fixed bottom-0 left-0 w-full flex items-center justify-center border-t text-center text-xs gap-8 py-4 bg-background z-50">
            <ThemeSwitcher />
          </footer> */}
        </div>
      </SearchProvider>
    </Suspense>
  );
}
