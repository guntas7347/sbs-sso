import React from "react";

interface BrandSectionProps {
  badgeText: string;
  titlePrefix: string;
  titleGradient: string;
  description: string;
  statusText: string;
  securityGuideline: string;
}

export function BrandSection({
  badgeText,
  titlePrefix,
  titleGradient,
  description,
  statusText,
  securityGuideline,
}: BrandSectionProps) {
  return (
    <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-16 overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 dark:from-[#090d16] dark:via-[#090d16]/95 dark:to-emerald-950/40 text-slate-800 dark:text-white select-none transition-colors duration-300">
      {/* Decorative Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Ambient Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-orange/5 dark:bg-brand-orange/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />

      {/* Top Branding Section */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="size-11 shrink-0 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden">
          <img
            src="/sbssu-logo.png"
            alt="SBS Logo"
            className="size-9 object-contain"
          />
        </div>
        <div>
          <div className="font-black tracking-wide text-lg leading-none text-slate-900 dark:text-white">
            Shaheed Bhagat Singh State University
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold tracking-widest mt-1 uppercase">
            Secure Single Sign On
          </div>
        </div>
      </div>

      {/* Middle Greeting / Marketing Section */}
      <div className="relative z-10 my-auto max-w-lg space-y-6">
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20 tracking-wide uppercase">
          {badgeText}
        </span>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
          {titlePrefix} <br />
          <span className="bg-gradient-to-r from-brand-orange via-amber-500 to-brand-green bg-clip-text text-transparent">
            {titleGradient}
          </span>
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          {description}
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/5 dark:bg-white/5 border border-slate-500/10 dark:border-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {statusText}
        </div>
      </div>

      {/* Bottom Support & Security section */}
      <div className="relative z-10 flex flex-col gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/10 pt-8">
        <div className="flex justify-between items-center gap-8 flex-wrap">
          <div>
            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
              Need IT Helpdesk Support?
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Contact University IT Helpdesk for any assistance.
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
              Security Guidelines
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              {securityGuideline}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
