"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export function LoadingOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex flex-col items-center justify-center bg-black/60">
      <div className="relative inline-flex items-center justify-center p-4">
        <Image
          src="/loading_w.png"
          alt="Cargando..."
          width={800}
          height={266}
          className="w-auto h-32 md:h-48 lg:h-64 object-contain opacity-50"
          priority
        />

        {/* Overlay con máscara para que el brillo solo afecte la imagen */}
        <div
          className="absolute inset-4 pointer-events-none"
          style={{
            WebkitMaskImage: "url('/loading_w.png')",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: "url('/loading_w.png')",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        >
          <div className="absolute inset-0 -left-[100%] w-[200%] h-full animate-[slide_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    // Return early to avoid hydration mismatch, or if needed immediately:
    return null;
  }

  return createPortal(content, document.body);
}
