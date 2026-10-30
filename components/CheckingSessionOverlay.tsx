"use client";

import { Loader2 } from "lucide-react";

interface CheckingSessionOverlayProps {
  checking: boolean;
  message: string;
  onDismiss: () => void;
}

export function CheckingSessionOverlay({
  checking,
  message,
  onDismiss,
}: CheckingSessionOverlayProps) {
  if (!checking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md cursor-wait animate-[fadeIn_0.2s_ease]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-sm w-full mx-4 text-center">
        <div className="relative flex items-center justify-center size-14">
          <div className="absolute inset-0 rounded-full border-2 border-brand-orange/20 border-t-brand-orange animate-spin" />
          <Loader2 className="w-7 h-7 text-brand-orange animate-spin" />
        </div>

        <div className="space-y-1.5 w-full">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Checking Active SSO Session
          </h4>
          <p className="text-xs font-semibold text-brand-orange dark:text-amber-400 min-h-[1.5rem] transition-all duration-300">
            {message}
          </p>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-orange to-amber-500 rounded-full animate-pulse w-full" />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Verifying security handshake...
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          Skip & Continue
        </button>
      </div>
    </div>
  );
}
