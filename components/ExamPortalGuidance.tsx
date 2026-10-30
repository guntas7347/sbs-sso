"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, ZoomIn, X } from "lucide-react";

interface ExamPortalGuidanceProps {
  compact?: boolean;
}

export function ExamPortalGuidance({ compact = false }: ExamPortalGuidanceProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-amber-500/10 dark:hover:bg-amber-500/15 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                How to Sign In via SBS Exam
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log in and tap the SSO / Portal button on your homepage
              </p>
            </div>
          </div>
          <div className="text-slate-400 dark:text-slate-500">
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-amber-500/20 animate-[fadeIn_0.2s_ease]">
            <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Click <strong>Sign In via SBS Exam Portal</strong> below to open{" "}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                    sbsexam.edu.in
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Log in with your university <strong>Roll Number</strong> and <strong>Password</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  On the student homepage dashboard, locate the <strong>Students</strong> box and click the{" "}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">SSO LOGIN / Portal button</strong>{" "}
                  (such as <em>91 Grievance Portal</em>) to complete verification.
                </span>
              </li>
            </ol>

            {/* Visual Screenshot of Homepage SSO Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>SBS Exam Homepage Reference:</span>
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="flex items-center gap-1 text-brand-orange hover:text-brand-orange-hover dark:text-amber-400 transition-colors cursor-pointer text-[10px]"
                >
                  <ZoomIn className="size-3" />
                  <span>Enlarge</span>
                </button>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsZoomed(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsZoomed(true);
                  }
                }}
                className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                <img
                  src="/sarthi-button.png"
                  alt="SBS Exam Portal Homepage SSO Button"
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                    <ZoomIn className="size-3" />
                    <span>Click to expand reference image</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                After logging into sbsexam.edu.in, click the highlighted portal button on your student homepage to be redirected back here automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                SBS Exam Portal Homepage Guide
              </h3>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950">
              <img
                src="/sarthi-button.png"
                alt="SBS Exam Portal Homepage SSO Button"
                className="w-full h-auto object-contain"
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When logged into the <strong>SBS Exam Portal (sbsexam.edu.in)</strong>, look for the <strong>Students</strong> widget on the homepage and click the <strong>SSO / Portal button</strong> (e.g. <em>91 Grievance Portal</em>) to authenticate your Single Sign-On session.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
