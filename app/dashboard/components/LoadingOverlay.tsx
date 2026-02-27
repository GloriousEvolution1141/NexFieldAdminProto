"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function LoadingOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex flex-col items-center justify-center bg-black/60">
      <div className="relative w-48 h-16 overflow-hidden rounded-lg">
        {/* Placeholder for the image that fades from left to right */}
        <div className="absolute inset-0 bg-white/20 w-[200%] animate-[slide_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );

  if (!mounted) {
    // Return early to avoid hydration mismatch, or if needed immediately:
    return null;
  }

  return createPortal(content, document.body);
}
