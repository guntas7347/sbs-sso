"use client";

import {
  getActiveSession,
  handleSessionLogin,
  redirectToSourceSSO,
  clearSessionAction,
  saveAuthContext,
} from "@/lib/login";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { clients, ClientId } from "@/lib/clients";

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
} from "lucide-react";

// Shared Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { SecurityFooter } from "@/components/SecurityFooter";

// Dev mode toggle: set to true to display the Dev Login (/dev) test launcher button
const dev = true;

interface SessionUserData {
  username: string;
  name?: string;
  user?: Record<string, unknown>;
}

const REDIRECT_MESSAGES = [
  "Securing cryptographic session...",
  "Initiating university gateway handshake...",
  "Verifying identity protocol...",
  "Redirecting to SBS authentication portal...",
];

function LoginForm() {
  const searchParams = useSearchParams();

  const callBackParam =
    searchParams.get("callBack") || searchParams.get("callback") || undefined;
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

  const [loginError, setLoginError] = useState<string | null>(
    urlErrorParam || null,
  );
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUserData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Cycling status messages every second when redirect/login is in progress
  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % REDIRECT_MESSAGES.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  const isRegisteredClient = Boolean(
    callBackParam && clients[callBackParam as ClientId],
  );
  const isUnregisteredChild = Boolean(
    !isRegisteredClient &&
    redirectUriParam &&
    redirectUriParam.trim().length > 0,
  );
  // Challenge code is required for S2 (PKCE), but optional for S1 simple flow
  const isValidRequest = isRegisteredClient || isUnregisteredChild;

  const currentClient = isRegisteredClient
    ? clients[callBackParam as ClientId]
    : null;

  const appDisplayName: string =
    (isRegisteredClient ? currentClient?.name : nameParam?.trim()) ||
    "Unregistered App";

  // Check for active JWT session cookie on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getActiveSession();
        if (session.success && session.username) {
          setSessionUser({
            username: session.username,
            name: session.name || session.username,
            user: session.user,
          });
        }
      } catch (err) {
        console.error("Failed to check active session:", err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  // Save auth context in background if valid request
  useEffect(() => {
    if (isValidRequest) {
      saveAuthContext(
        callBackParam,
        challengeParam,
        redirectUriParam,
        nameParam,
      );
    }
  }, [
    isValidRequest,
    callBackParam,
    challengeParam,
    redirectUriParam,
    nameParam,
  ]);

  const handleContinueAsSession = async () => {
    setLoading(true);
    setLoginError(null);

    try {
      const res = await handleSessionLogin(
        callBackParam,
        challengeParam,
        redirectUriParam,
        isUnregisteredChild,
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
    } finally {
      setLoading(false);
    }
  };

  const handleStartSourceLogin = async () => {
    setLoading(true);
    setLoginError(null);

    try {
      await redirectToSourceSSO(
        callBackParam,
        challengeParam,
        redirectUriParam,
        nameParam,
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

  // Reusable loading overlay component providing immediate feedback with cycling text
  const LoadingOverlay = () => {
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
              {REDIRECT_MESSAGES[loadingMessageIndex]}
            </p>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-orange to-amber-500 rounded-full animate-pulse w-full" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Please wait while the secure authorization completes...
          </p>
        </div>
      </div>
    );
  };

  // If request is missing valid callback or challenge parameters, but user HAS active session
  if (!isValidRequest && sessionUser) {
    return (
      <div
        className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
          loading ? "cursor-wait" : ""
        }`}
      >
        <LoadingOverlay />

        <BrandSection
          badgeText="Active SSO Session"
          titlePrefix="Unified Gateway"
          titleGradient="Central Identity"
          description="Your centralized SSO session is active. You can safely access all authorized campus portals without re-authenticating."
          statusText="SSO Session Valid (24h)"
          securityGuideline="Always log out when using public or shared computers."
        />

        <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
          <ThemeToggle />

          <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
            <SSOHeader
              title="Identity Verified"
              description="Your university Single Sign-On session is currently active."
            />

            <ConnectionBadge />

            {/* User Session Profile Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-hover text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {(sessionUser.name || sessionUser.username)
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Active SSO Session (24h)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {sessionUser.name || sessionUser.username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{sessionUser.username} • Session saved on device
                  </p>
                </div>
              </div>

              {/* User Data Table */}
              {sessionUser.user && typeof sessionUser.user === "object" && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Decrypted Payload Data
                  </span>
                  <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {Object.entries(sessionUser.user).map(([key, val]) => (
                          <tr
                            key={key}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                          >
                            <td className="py-1.5 px-3 font-mono font-medium text-slate-500 dark:text-slate-400 w-1/3 text-[11px]">
                              {key}
                            </td>
                            <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200 font-medium text-[11px] break-all">
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
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  To sign in to a university portal, navigate to that service
                  and click Login. Your active session will be automatically
                  recognized.
                </p>
              </div>
            </div>

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

  // If request is missing valid callback or challenge parameters, show Invalid Sign-In Request UI
  if (!isValidRequest) {
    return (
      <div
        className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
          loading ? "cursor-wait" : ""
        }`}
      >
        <LoadingOverlay />

        <BrandSection
          badgeText="Security Gateway"
          titlePrefix="Centralized Access"
          titleGradient="Security Protocol"
          description="Shaheed Bhagat Singh State University SSO provides secure and unified authentication for university portals, student management systems, and academic networks."
          statusText="SSO authorization gateway active"
          securityGuideline="Sign-in sessions must originate from registered and verified university applications."
        />

        <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
          <ThemeToggle />

          <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
            <SSOHeader
              title="Invalid Sign-In Request"
              description="Authentication handshake could not be established."
            />

            <div className="p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 backdrop-blur-sm space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Invalid Sign-In Request
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    This sign-in page was opened without a valid application
                    request or challenge code.
                  </p>
                </div>
              </div>

              <div className="border-t border-amber-500/20 pt-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  Please return to the application you were trying to sign in to
                  and start the sign-in process again.
                </p>
              </div>
            </div>

            {/* Direct Login Option */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartSourceLogin}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 text-white" />
                    <span>{REDIRECT_MESSAGES[loadingMessageIndex]}</span>
                  </>
                ) : (
                  <>
                    <span>Direct Sign In via SBS Exam</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
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

  return (
    <div
      className={`flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
        loading ? "cursor-wait" : ""
      }`}
    >
      <LoadingOverlay />

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

          {/* Secure Connection Badge */}
          <ConnectionBadge />

          {/* Alert Message for errors */}
          {loginError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-455 text-sm animate-[shake_0.4s_ease-in-out]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Active Session Fast SSO Card */}
          {sessionUser ? (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-hover text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {(sessionUser.name || sessionUser.username)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Active SSO Session (24h)
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

                {/* Returned Data Table in Frontend */}
                {sessionUser.user && typeof sessionUser.user === "object" && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
                        Returned User Data
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {Object.keys(sessionUser.user).length} attributes
                      </span>
                    </div>
                    <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {Object.entries(sessionUser.user).map(
                            ([key, val]) => (
                              <tr
                                key={key}
                                className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
                              >
                                <td className="py-2 px-3 font-mono font-medium text-slate-600 dark:text-slate-400 w-1/3 text-[11px]">
                                  {key}
                                </td>
                                <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-medium text-[11px] break-all">
                                  {val === null
                                    ? "null"
                                    : typeof val === "object"
                                      ? JSON.stringify(val)
                                      : String(val)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click continue to authorize and pass your verified identity
                    data to <strong>{appDisplayName}</strong>.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleContinueAsSession}
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
                  <span>Sign in with a different account</span>
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
                    <span>Single Sign-On session valid for 24 hours</span>
                  </div>
                </div>
              </div>

              {/* Login Button redirecting to Source SSO */}
              <button
                type="button"
                onClick={handleStartSourceLogin}
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
