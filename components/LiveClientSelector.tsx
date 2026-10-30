"use client";

import { ClientId, Client } from "@/lib/clients";
import { Layers, Globe, Check } from "lucide-react";

interface LiveClientSelectorProps {
  liveClients: [ClientId, Client][];
  selectedKey: ClientId;
  onSelect: (key: ClientId) => void;
  disabled?: boolean;
}

export function LiveClientSelector({
  liveClients,
  selectedKey,
  onSelect,
  disabled = false,
}: LiveClientSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Layers className="size-3.5 text-brand-orange" />
          <span>Select University Application</span>
        </label>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {liveClients.length} Live Portals
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {liveClients.map(([key, client]) => {
          const isSelected = selectedKey === key;
          let hostname = "";
          try {
            hostname = new URL(client.redirectUri).hostname;
          } catch {
            hostname = client.redirectUri;
          }

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => !disabled && onSelect(key)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(key);
                }
              }}
              className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                isSelected
                  ? "border-brand-orange bg-brand-orange/[0.07] dark:bg-brand-orange/[0.12] shadow-sm ring-1 ring-brand-orange/40"
                  : "border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Logo container */}
              <div
                className={`size-12 shrink-0 rounded-xl border flex items-center justify-center overflow-hidden transition-all ${
                  isSelected
                    ? "bg-white dark:bg-slate-800 border-brand-orange/30 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/70"
                }`}
              >
                <img
                  src={client.logo || "/sbssu-logo.png"}
                  alt={client.name}
                  className="size-7 object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="hidden size-full items-center justify-center font-black text-xs text-brand-orange bg-brand-orange/10">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Client Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {client.name}
                  </h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {client.description}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  <Globe className="size-3 shrink-0" />
                  <span className="truncate">{hostname}</span>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className="shrink-0 pl-1">
                <div
                  className={`size-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-brand-orange text-white shadow-sm ring-2 ring-brand-orange/20"
                      : "border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-600"
                  }`}
                >
                  {isSelected && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
