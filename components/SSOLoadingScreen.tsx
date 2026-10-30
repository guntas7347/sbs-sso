"use client";

export function SSOLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-lg animate-[fadeIn_0.3s_ease]">
        <div className="relative flex items-center justify-center size-16">
          <div className="absolute inset-0 rounded-full border-2 border-brand-orange/20 border-t-brand-orange animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-brand-green/20 border-b-brand-green animate-[spin_1.5s_linear_infinite_reverse]" />
          <img
            src="/sbssu-logo.png"
            alt="SBS Logo"
            className="size-8 object-contain animate-pulse"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Initializing Gateway
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verifying security handshake...
          </p>
        </div>
      </div>
    </div>
  );
}
