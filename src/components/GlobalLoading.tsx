"use client";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function GlobalLoading() {
  const { isLoading, loadingText } = useGlobalLoading();

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/20 flex flex-col items-center space-y-4 min-w-[280px]">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {loadingText}
          </h3>
          <p className="text-sm text-muted-foreground">
            Vui lòng đợi trong giây lát...
          </p>
        </div>

        <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
} 