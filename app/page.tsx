"use client";

import {
  getActiveSession,
  handleSessionLogin,
  redirectToSourceSSO,
  clearSessionAction,
  saveAuthContext,
} from "@/lib/login";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { clients, ClientId, Client } from "@/lib/clients";

// Lucide React Icons
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeftRight,
  LogOut,
  Loader2,
  Code2,
  ExternalLink,
  Check,
  Globe,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Shared Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { SecurityFooter } from "@/components/SecurityFooter";

// Dev mode toggle: set to true to display the full payload box and enable Dev Login button
const dev = false;

interface SessionUserData {
  username: string;
  name?: string;
  user?: Record<string, unknown>;
}

const REDIRECT_MESSAGES = [
  "Securing cryptographic session...",
  "Initiating university gateway handshake...",
  "Verifying identity protocol...",
  "Redirecting to authorized application...",
];

// Pre-filter live clients for manual selection
const LIVE_CLIENTS = (Object.entries(clients) as [ClientId, Client][]).filter(
  ([, client]) => client.live === true,
);

/**
 * Resolves a raw callback parameter (which could be an ID, a URL, or slightly misformatted)
 * to a recognized ClientId from lib/clients.
 */
function resolveClientId(param?: string | null): ClientId | null {
  if (!param) return null;
  const trimmed = param.trim();

  // Exact key match
  if (trimmed in clients) {
    return trimmed as ClientId;
  }

  // Case-insensitive key match
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(clients) as ClientId[]) {
    if (key.toLowerCase() === lower) {
      return key;
    }
  }

  // Match against redirectUri or hostname
  for (const [key, client] of Object.entries(clients) as [ClientId, Client][]) {
    try {
      if (trimmed === client.redirectUri) return key;
      const clientUrl = new URL(client.redirectUri);
      if (trimmed.includes(clientUrl.hostname)) return key;
    } catch {
      // Ignore invalid URL parsing
    }
  }

  return null;
}

/**
 * Session Profile Card displayed when an active session is found.
 */
function SessionProfileCard({
  sessionUser,
  devMode,
  showNotice = true,
  appDisplayName,
}: {
  sessionUser: SessionUserData;
  devMode: boolean;
  showNotice?: boolean;
  appDisplayName?: string;
}) {
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
        `${sessionUser.user?.fullname as string || ""}`.trim() ||
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

/**
 * Interactive Client Selector for live clients with live: true.
 */
function LiveClientSelector({
  liveClients,
  selectedKey,
  onSelect,
  disabled = false,
}: {
  liveClients: [ClientId, Client][];
  selectedKey: ClientId;
  onSelect: (key: ClientId) => void;
  disabled?: boolean;
}) {
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

/**
 * Fullscreen loading overlay for active authentication/redirect transitions.
 */
function LoadingOverlay({
  loading,
  message,
  onCancel,
}: {
  loading: boolean;
  message: string;
  onCancel?: () => void;
}) {
  if (!loading) return null;
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
            Connecting to Security Gateway
          </h4>
          <p className="text-xs font-semibold text-brand-orange dark:text-amber-400 min-h-[1.5rem] transition-all duration-300">
            {message}
          </p>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-orange to-amber-500 rounded-full animate-pulse w-full" />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Please wait while the secure authorization completes...
        </p>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
          >
            Cancel / Return
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Quick non-blocking overlay for session check with self-dismiss timeout and escape button.
 */
function CheckingSessionOverlay({
  checking,
  message,
  onDismiss,
}: {
  checking: boolean;
  message: string;
  onDismiss: () => void;
}) {
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

function LoginForm() {
  const searchParams = useSearchParams();

  // Robustly extract callback parameter supporting common casing & query variations
  const rawCallback =
    searchParams.get("callBack") ||
    searchParams.get("callback") ||
    searchParams.get("callbackUrl") ||
    searchParams.get("callbackurl") ||
    searchParams.get("callback_url") ||
    searchParams.get("client") ||
    searchParams.get("client_id") ||
    searchParams.get("clientId") ||
    searchParams.get("app") ||
    undefined;

  const resolvedCallbackId = resolveClientId(rawCallback);
  const callBackParam = resolvedCallbackId || rawCallback || undefined;

  const challengeParam =
    searchParams.get("challenge") ||
    searchParams.get("code_challenge") ||
    undefined;
  const redirectUriParam =
    searchParams.get("redirect_uri") ||
    searchParams.get("redirectUri") ||
    undefined;
  const nameParam = searchParams.get("name") || undefined;
  const urlErrorParam = searchParams.get("error") || undefined;
  const fromCallbackParam =
    searchParams.get("from_callback") === "true" ||
    searchParams.get("from_callback") === "1";

  const [loginError, setLoginError] = useState<string | null>(
    urlErrorParam || null,
  );
  const [loading, setLoading] = useState(false);

  const [sessionUser, setSessionUser] = useState<SessionUserData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Manual client selection state for when callback parameter is missing or invalid
  const [selectedManualClient, setSelectedManualClient] = useState<ClientId>(
    LIVE_CLIENTS[0]?.[0] || "sbs-form",
  );
  const [showClientSwitcher, setShowClientSwitcher] = useState(false);

  const hasAutoTriggeredRef = useRef(false);

  // Status message cycling effect when loading or checking session
  useEffect(() => {
    if (!loading && !checkingSession) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % REDIRECT_MESSAGES.length);
    }, 1000);

    return () => {
      clearInterval(interval);
      setLoadingMessageIndex(0);
    };
  }, [loading, checkingSession]);

  // Loading safety timeout: prevent any loading overlay from hanging indefinitely
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setLoginError("Request timed out. Please try again or select a portal directly.");
    }, 15000);

    return () => clearTimeout(timer);
  }, [loading]);

  const isRegisteredClient = Boolean(
    callBackParam && clients[callBackParam as ClientId],
  );
  const isUnregisteredChild = Boolean(
    !isRegisteredClient &&
      redirectUriParam &&
      redirectUriParam.trim().length > 0,
  );
  const isValidRequest = isRegisteredClient || isUnregisteredChild;

  // The client to authorize: either the URL registered client or the manually selected live client
  const effectiveClientId: ClientId = isRegisteredClient
    ? (callBackParam as ClientId)
    : selectedManualClient;

  const currentClient = clients[effectiveClientId] || null;

  const appDisplayName: string =
    (isRegisteredClient
      ? currentClient?.name
      : isUnregisteredChild
        ? nameParam?.trim() || "Unregistered App"
        : currentClient?.name) || "SBS Portal";

  // Check for active JWT session cookie on mount with strict timeout protection
  // This ensures the site NEVER hangs at loading forever on first visit!
  useEffect(() => {
    let isMounted = true;

    // Hard safety timer: dismiss checking screen after 1.5s max
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setCheckingSession(false);
      }
    }, 1500);

    async function checkSession() {
      try {
        const timeoutPromise = new Promise<{ success: false }>((resolve) =>
          setTimeout(() => resolve({ success: false }), 1200),
        );

        const session = await Promise.race([
          getActiveSession(),
          timeoutPromise,
        ]);

        if (isMounted && session && session.success && session.username) {
          setSessionUser({
            username: session.username,
            name: session.name || session.username,
            user: session.user,
          });
        }
      } catch (err) {
        console.error("Failed to check active session:", err);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
          clearTimeout(safetyTimer);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Save auth context in background
  useEffect(() => {
    const clientToSave = callBackParam || selectedManualClient;
    if (clientToSave) {
      saveAuthContext(
        clientToSave,
        challengeParam,
        redirectUriParam,
        nameParam,
      );
    }
  }, [
    callBackParam,
    selectedManualClient,
    challengeParam,
    redirectUriParam,
    nameParam,
  ]);

  const handleContinueAsSession = useCallback(
    async (overrideClientId?: ClientId) => {
      setLoading(true);
      setLoginError(null);

      const clientToUse =
        overrideClientId ||
        (isRegisteredClient ? (callBackParam as ClientId) : selectedManualClient);

      try {
        const res = await handleSessionLogin(
          clientToUse,
          challengeParam,
          redirectUriParam,
          isUnregisteredChild && !overrideClientId,
        );
        if (!res.success) {
          throw new Error(res.error || "Session authentication failed");
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        if (errorObj?.message?.includes("NEXT_REDIRECT")) {
          throw err;
        }
        console.error("Session login failed:", err);
        setLoginError(
          errorObj?.message ||
            "Active session expired or invalid. Please sign in via the source SSO.",
        );
        setSessionUser(null);
        setLoading(false);
      }
    },
    [
      isRegisteredClient,
      callBackParam,
      selectedManualClient,
      challengeParam,
      redirectUriParam,
      isUnregisteredChild,
    ],
  );

  // Auto trigger login if redirected back from /api/auth/callback with valid request
  useEffect(() => {
    if (
      fromCallbackParam &&
      isValidRequest &&
      sessionUser &&
      !hasAutoTriggeredRef.current &&
      !loading &&
      !loginError
    ) {
      hasAutoTriggeredRef.current = true;
      handleContinueAsSession();
    }
  }, [
    fromCallbackParam,
    isValidRequest,
    sessionUser,
    loading,
    loginError,
    handleContinueAsSession,
  ]);

  const handleStartSourceLogin = async (overrideClientId?: ClientId) => {
    setLoading(true);
    setLoginError(null);

    const clientToUse =
      overrideClientId ||
      (isRegisteredClient ? (callBackParam as ClientId) : selectedManualClient);

    try {
      await redirectToSourceSSO(
        clientToUse,
        challengeParam,
        redirectUriParam,
        nameParam || (clientToUse ? clients[clientToUse]?.name : undefined),
      );
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      if (errorObj?.message?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Failed to initiate source SSO login:", err);
      setLoginError(
        errorObj?.message ||
          "Failed to redirect to source authentication portal.",
      );
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    setLoading(true);
    try {
      await clearSessionAction();
      setSessionUser(null);
      await handleStartSourceLogin();
    } catch (err: unknown) {
      console.error("Failed to switch account:", err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await clearSessionAction();
      setSessionUser(null);
    } catch (err: unknown) {
      console.error("Failed to log out:", err);
    } finally {
      setLoading(false);
    }
  };

  // SCENARIO 1: Callback param was MISSING or UNRECOGNIZED, but user HAS an active session
  // Show manual client selector so user can seamlessly choose which live portal to access
  if (!isValidRequest && sessionUser) {
    return (
      <div
        className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
          loading ? "cursor-wait" : ""
        }`}
      >
        <CheckingSessionOverlay
          checking={checkingSession}
          message={REDIRECT_MESSAGES[loadingMessageIndex]}
          onDismiss={() => setCheckingSession(false)}
        />
        <LoadingOverlay
          loading={loading}
          message={REDIRECT_MESSAGES[loadingMessageIndex]}
          onCancel={() => setLoading(false)}
        />

        <BrandSection
          badgeText="Active SSO Session (30 Days)"
          titlePrefix="Unified Gateway"
          titleGradient="Portal Hub"
          description="Your centralized SSO session is active. Choose an authorized live university portal below to continue with your verified credentials."
          statusText="SSO Session Valid (30 Days)"
          securityGuideline="Always log out when using public or shared computers."
        />

        <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
          <ThemeToggle />

          <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
            <SSOHeader
              title="Identity Verified"
              description="Choose a university application to proceed with your active session."
            />

            <ConnectionBadge />

            {/* User Session Profile Card with Image & Preview */}
            <SessionProfileCard
              sessionUser={sessionUser}
              devMode={dev}
              showNotice={false}
            />

            {/* Error banner if any */}
            {loginError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-[shake_0.4s_ease-in-out]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Manual Client Selector from lib/clients with live: true */}
            <LiveClientSelector
              liveClients={LIVE_CLIENTS}
              selectedKey={selectedManualClient}
              onSelect={setSelectedManualClient}
              disabled={loading}
            />

            {/* Primary Continue Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleContinueAsSession(selectedManualClient)}
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-extrabold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/15 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 text-center text-sm tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    <span>{REDIRECT_MESSAGES[loadingMessageIndex]}</span>
                  </>
                ) : (
                  <>
                    <span>
                      Continue to {currentClient?.name || "Application"} as{" "}
                      {sessionUser.name || sessionUser.username}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSwitchAccount}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Change User (SBS Exam login required)</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
              >
                <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Log Out SSO Session</span>
              </button>

              {/* Dev Login button when dev === true */}
              {dev && (
                <Link
                  href="/dev"
                  className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <span>Dev Login Playground (/dev)</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Link>
              )}
            </div>
          </div>

          <SecurityFooter
            policyType="auth"
            links={[
              {
                target: "_blank",
                label: "Forgot Password?",
                href: "https://sbsexam.edu.in/user-login",
                colorClass: "text-brand-green hover:text-brand-green-hover",
              },
            ]}
          />
        </div>
      </div>
    );
  }

  // SCENARIO 2: Callback param was MISSING or UNRECOGNIZED, and NO active session exists
  // Present the manual live client selection UI so the user can pick their destination portal to sign in
  if (!isValidRequest) {
    return (
      <div
        className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
          loading ? "cursor-wait" : ""
        }`}
      >
        <CheckingSessionOverlay
          checking={checkingSession}
          message={REDIRECT_MESSAGES[loadingMessageIndex]}
          onDismiss={() => setCheckingSession(false)}
        />
        <LoadingOverlay
          loading={loading}
          message={REDIRECT_MESSAGES[loadingMessageIndex]}
          onCancel={() => setLoading(false)}
        />

        <BrandSection
          badgeText="Security Gateway"
          titlePrefix="Single Sign-On"
          titleGradient="Authorized Portals"
          description="Shaheed Bhagat Singh State University SSO provides secure and unified authentication. Select an authorized campus application below to begin sign-in."
          statusText="SSO authorization gateway active"
          securityGuideline="Sign-in sessions connect securely to official university applications."
        />

        <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
          <ThemeToggle />

          <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
            <SSOHeader
              title="Select University Portal"
              description="Choose an authorized campus service to sign in via SBS Single Sign-On."
            />

            <ConnectionBadge />

            {/* Error banner if any */}
            {loginError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-[shake_0.4s_ease-in-out]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Friendly guidance note */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>No Destination Portal Specified</span>
              </div>
              <p className="leading-relaxed">
                Select an official campus portal from the live list below to sign in via the SBS Exam Portal:
              </p>
            </div>

            {/* Live Client Selector */}
            <LiveClientSelector
              liveClients={LIVE_CLIENTS}
              selectedKey={selectedManualClient}
              onSelect={setSelectedManualClient}
              disabled={loading}
            />

            {/* Primary Sign-In Button targeting selected live client */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleStartSourceLogin(selectedManualClient)}
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-extrabold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/15 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 text-center text-sm tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    <span>{REDIRECT_MESSAGES[loadingMessageIndex]}</span>
                  </>
                ) : (
                  <>
                    <span>
                      Sign In to {currentClient?.name || "Selected Portal"} via SBS Exam
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleStartSourceLogin()}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
              >
                <span>Direct Sign In via SBS Exam (General Access)</span>
              </button>

              {/* Dev Login button when dev === true */}
              {dev && (
                <Link
                  href="/dev"
                  className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <span>Dev Login Playground (/dev)</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Link>
              )}
            </div>
          </div>

          <SecurityFooter
            policyType="auth"
            links={[
              {
                label: "Forgot Password?",
                href: "/forgot-password",
                colorClass: "text-brand-green hover:text-brand-green-hover",
              },
            ]}
          />
        </div>
      </div>
    );
  }

  // SCENARIO 3: Valid callback was provided in the URL
  return (
    <div
      className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
        loading ? "cursor-wait" : ""
      }`}
    >
      <CheckingSessionOverlay
        checking={checkingSession}
        message={REDIRECT_MESSAGES[loadingMessageIndex]}
        onDismiss={() => setCheckingSession(false)}
      />
      <LoadingOverlay
        loading={loading}
        message={REDIRECT_MESSAGES[loadingMessageIndex]}
        onCancel={() => setLoading(false)}
      />

      {/* Left Column: Branding and University info */}
      <BrandSection
        badgeText={
          isUnregisteredChild
            ? "External Authorization"
            : "Official Portal Gate"
        }
        titlePrefix="Connecting You to"
        titleGradient={appDisplayName || "Your Academic Journey"}
        description={
          isRegisteredClient && currentClient?.description
            ? `Sign in with your centralized credentials to access ${currentClient.name}. ${currentClient.description}.`
            : isUnregisteredChild
              ? `Sign in with your centralized credentials to authorize ${appDisplayName} (Unregistered Child).`
              : "Sign in with your centralized credentials to securely connect to official resources, student and staff portals, research hubs, and communication networks."
        }
        statusText={
          isUnregisteredChild
            ? "External client gateway handshake active"
            : "All authentication gateways are fully operational"
        }
        securityGuideline="Never disclose your university credentials to anyone."
      />

      {/* Right Column: SSO Connection Card */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        <ThemeToggle />

        <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
          <SSOHeader
            title="Single Sign-On"
            description={
              appDisplayName
                ? `Authenticate via University Portal to access ${appDisplayName}.`
                : "Authenticate via University Portal."
            }
          />

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
              onClick={() => setShowClientSwitcher((prev) => !prev)}
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
                  liveClients={LIVE_CLIENTS}
                  selectedKey={selectedManualClient}
                  onSelect={setSelectedManualClient}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (sessionUser) {
                      handleContinueAsSession(selectedManualClient);
                    } else {
                      handleStartSourceLogin(selectedManualClient);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>
                    Switch & Connect to {clients[selectedManualClient]?.name || "Selected Portal"}
                  </span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Secure Connection Badge */}
          <ConnectionBadge />

          {/* Alert Message for errors */}
          {loginError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-[shake_0.4s_ease-in-out]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Active Session Fast SSO Card */}
          {sessionUser ? (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <SessionProfileCard
                sessionUser={sessionUser}
                devMode={dev}
                showNotice={true}
                appDisplayName={appDisplayName}
              />

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleContinueAsSession()}
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-center text-sm tracking-wide"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      <span>{REDIRECT_MESSAGES[loadingMessageIndex]}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Continue as {sessionUser.name || sessionUser.username}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSwitchAccount}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
                >
                  <ArrowLeftRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Change User (SBS Exam login required)</span>
                </button>

                {dev && (
                  <Link
                    href="/dev"
                    className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Code2 className="w-4 h-4 text-amber-500" />
                    <span>Dev Login Playground (/dev)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Source SSO Portal Gateway Card */
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      University Central Login
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Authentication is completed securely on the University
                      Exam Portal (<strong>sbsexam.edu.in</strong>). You will be
                      returned here automatically upon successful sign-in.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Origin-verified AES-256-GCM encrypted transfer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Single Sign-On session valid for 30 days (1 month)
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Button redirecting to Source SSO */}
              <button
                type="button"
                onClick={() => handleStartSourceLogin()}
                disabled={loading || checkingSession}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-extrabold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/15 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 text-center text-sm tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    <span>{REDIRECT_MESSAGES[loadingMessageIndex]}</span>
                  </>
                ) : (
                  <>
                    <span>Sign In via SBS Exam Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {dev && (
                <Link
                  href="/dev"
                  className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <span>Dev Login Playground (/dev)</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Link>
              )}
            </div>
          )}
        </div>

        <SecurityFooter
          policyType="auth"
          links={[
            {
              label: "Forgot Password?",
              href: "/forgot-password",
              colorClass: "text-brand-green hover:text-brand-green-hover",
            },
          ]}
        />
      </div>
    </div>
  );
}

function SSOLoadingScreen() {
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

export default function Home() {
  return (
    <Suspense fallback={<SSOLoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}
