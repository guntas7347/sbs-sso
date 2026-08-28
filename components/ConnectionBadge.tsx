import React from "react";

export function ConnectionBadge() {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-200/40 dark:bg-slate-900/60 text-[10px] text-slate-650 dark:text-slate-400 font-bold tracking-wider uppercase border border-slate-200/50 dark:border-slate-850">
      <svg
        className="w-4 h-4 text-emerald-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      Secure SSO Channel Connection
    </div>
  );
}
