"use client";

import { useState } from "react";

export interface SessionUserData {
  username: string;
  name?: string;
  user?: Record<string, unknown>;
}

interface SessionProfileCardProps {
  sessionUser: SessionUserData;
  devMode?: boolean;
  showNotice?: boolean;
  appDisplayName?: string;
}

export function SessionProfileCard({
  sessionUser,
  devMode = false,
  showNotice = true,
  appDisplayName,
}: SessionProfileCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    (sessionUser.user?.PhotoUrl as string) ||
      (sessionUser.user?.photoUrl as string) ||
      (sessionUser.user?.photo_url as string) ||
      (sessionUser.user?.avatar as string) ||
      (sessionUser.user?.image as string) ||
      "/avatar-placeholder.svg",
  );

  const previewFields = [
    {
      label: "Name",
      value:
        `${(sessionUser.user?.fullname as string) || ""}`.trim() ||
        (sessionUser.name as string) ||
        sessionUser.username,
    },
    {
      label: "Role",
      value:
        (sessionUser.user?.Role as string) ||
        (sessionUser.user?.role as string) ||
        "user",
    },
    {
      label: "Email",
      value:
        (sessionUser.user?.email as string) ||
        (sessionUser.user?.Email as string) ||
        "Not provided",
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shrink-0 relative flex items-center justify-center shadow-sm">
          <img
            src={imgSrc}
            alt={sessionUser.name || sessionUser.username}
            className="size-full object-cover"
            onError={() => setImgSrc("/avatar-placeholder.svg")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Active SSO Session (30 Days)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
            {sessionUser.name || sessionUser.username}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            @{sessionUser.username} • Identity Verified
          </p>
        </div>
      </div>

      {sessionUser.user && typeof sessionUser.user === "object" && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
              {devMode
                ? "Full Decrypted Payload (Dev Mode)"
                : "User Identity Preview"}
            </span>
            {devMode && (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {Object.keys(sessionUser.user).length} attributes
              </span>
            )}
          </div>

          {devMode ? (
            <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 text-xs max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Object.entries(sessionUser.user).map(([key, val]) => (
                    <tr
                      key={key}
                      className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-1.5 px-3 font-mono font-medium text-slate-500 dark:text-slate-400 w-1/3 text-[11px]">
                        {key}
                      </td>
                      <td className="py-1.5 px-3 text-slate-900 dark:text-slate-100 font-mono text-[11px] break-all">
                        {val === null
                          ? "null"
                          : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 text-xs">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {previewFields.map((field) => (
                    <tr
                      key={field.label}
                      className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2 px-3 font-mono font-medium text-slate-500 dark:text-slate-400 w-1/3 text-[11px]">
                        {field.label}
                      </td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-semibold text-[11px] break-all">
                        {field.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showNotice && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {appDisplayName ? (
              <>
                Click continue to authorize and pass your verified identity data
                to <strong>{appDisplayName}</strong>.
              </>
            ) : (
              "To sign in to a university portal, select an application below or navigate to that service."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
