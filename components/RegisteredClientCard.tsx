"use client";

import { Client, ClientId } from "@/lib/clients";
import { LiveClientSelector } from "./LiveClientSelector";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

interface RegisteredClientCardProps {
  isRegisteredClient: boolean;
  currentClient: Client | null;
  isUnregisteredChild: boolean;
  appDisplayName: string;
  redirectUriParam?: string;
  showClientSwitcher: boolean;
  onToggleSwitcher: () => void;
  liveClients: [ClientId, Client][];
  selectedManualClient: ClientId;
  onSelectManualClient: (key: ClientId) => void;
  onSwitchAndConnect: (key: ClientId) => void;
  disabled?: boolean;
}

export function RegisteredClientCard({
  isRegisteredClient,
  currentClient,
  isUnregisteredChild,
  appDisplayName,
  redirectUriParam,
  showClientSwitcher,
  onToggleSwitcher,
  liveClients,
  selectedManualClient,
  onSelectManualClient,
  onSwitchAndConnect,
  disabled = false,
}: RegisteredClientCardProps) {
  return (
    <div className="space-y-3">
      {/* Registered Client Application Details Card */}
      {isRegisteredClient && currentClient && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 transition-all">
          <div className="size-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 flex items-center justify-center overflow-hidden relative">
            <img
              src={currentClient.logo || "/sbssu-logo.png"}
              alt={currentClient.name}
              className="size-8 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="hidden size-full items-center justify-center font-black text-xs text-brand-orange bg-brand-orange/10">
              {currentClient.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Signing in to
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {currentClient.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentClient.description}
            </p>
          </div>
        </div>
      )}

      {/* Unregistered Child Application Details Card */}
      {isUnregisteredChild && (
        <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/25 shadow-sm flex items-center gap-3.5 transition-all">
          <div className="size-12 shrink-0 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-sm text-amber-600 dark:text-amber-400 uppercase">
            {appDisplayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                (Unregistered Child)
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {appDisplayName}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
              {redirectUriParam}
            </p>
          </div>
        </div>
      )}

      {/* Option to switch portal manually */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={onToggleSwitcher}
          className="text-xs font-semibold text-brand-orange hover:text-brand-orange-hover dark:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{showClientSwitcher ? "Hide other portals" : "Need to switch portal?"}</span>
          {showClientSwitcher ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>

        {showClientSwitcher && (
          <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 animate-[fadeIn_0.2s_ease]">
            <LiveClientSelector
              liveClients={liveClients}
              selectedKey={selectedManualClient}
              onSelect={onSelectManualClient}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => onSwitchAndConnect(selectedManualClient)}
              disabled={disabled}
              className="w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>
                Switch & Connect to {selectedManualClient}
              </span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
