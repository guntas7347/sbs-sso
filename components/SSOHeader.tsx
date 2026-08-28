import React from "react";

interface SSOHeaderProps {
  title: string;
  description: string;
}

export function SSOHeader({ title, description }: SSOHeaderProps) {
  return (
    <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-4">
      <div className="relative bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-center">
        <img
          src="/sbssu-logo.png"
          alt="SBS Logo"
          className="object-contain p-1.5 size-20"
        />
      </div>
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
