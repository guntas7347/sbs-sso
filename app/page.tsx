"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { clients, ClientId, Client } from "@/lib/clients";
import {
  getActiveSession,
  handleSessionLogin,
  redirectToSourceSSO,
  clearSessionAction,
  saveAuthContext,
} from "@/lib/login";

// Lucide React Icons
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeftRight,
  LogOut,
  Loader2,
  Code2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

// Shared & UI Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { SecurityFooter } from "@/components/SecurityFooter";
import {
  SessionProfileCard,
  SessionUserData,
} from "@/components/SessionProfileCard";
import { LiveClientSelector } from "@/components/LiveClientSelector";
import { RegisteredClientCard } from "@/components/RegisteredClientCard";
import { ExamPortalGuidance } from "@/components/ExamPortalGuidance";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { CheckingSessionOverlay } from "@/components/CheckingSessionOverlay";
import { SSOLoadingScreen } from "@/components/SSOLoadingScreen";

// Dev mode toggle: set to true to display full payload box and enable Dev Login playground
const dev = false;

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
 * Resolves a raw callback parameter (ID, URL, or case variance) to a recognized ClientId.
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

function LoginForm() {
  const searchParams = useSearchParams();

  // Robustly extract callback parameter supporting common naming & query variations
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

  // Loading safety timeout: prevent loading overlay from hanging indefinitely
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setLoginError(
        "Request timed out. Please try again or select a portal directly.",
      );
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

  // Active client: either the registered client from URL or the manually chosen live client
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
  // Guarantees the site NEVER hangs at loading forever on first visit!
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

  const handleContinueAsSession = async (overrideClientId?: ClientId) => {
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
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCallbackParam, isValidRequest, sessionUser, loading, loginError]);

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

      {/* Left Column: University Branding & Identity */}
      <BrandSection
        badgeText={
          sessionUser
            ? "Active SSO Session (30 Days)"
            : isUnregisteredChild
              ? "External Authorization"
              : isValidRequest
                ? "Official Portal Gate"
                : "Security Gateway"
        }
        titlePrefix={
          sessionUser
            ? "Unified Gateway"
            : isValidRequest
              ? "Connecting You to"
              : "Single Sign-On"
        }
        titleGradient={
          sessionUser && !isValidRequest
            ? "Portal Hub"
            : appDisplayName || "Central Identity"
        }
        description={
          sessionUser
            ? "Your centralized SSO session is active. Choose an authorized live university portal below to continue with your verified credentials."
            : isRegisteredClient && currentClient?.description
              ? `Sign in with your centralized credentials to access ${currentClient.name}. ${currentClient.description}.`
              : isUnregisteredChild
                ? `Sign in with your centralized credentials to authorize ${appDisplayName} (Unregistered Child).`
                : "Shaheed Bhagat Singh State University SSO provides secure and unified authentication. Select an authorized campus application below to begin sign-in."
        }
        statusText={
          sessionUser
            ? "SSO Session Valid (30 Days)"
            : isUnregisteredChild
              ? "External client gateway handshake active"
              : "All authentication gateways are fully operational"
        }
        securityGuideline={
          sessionUser
            ? "Always log out when using public or shared computers."
            : "Never disclose your university credentials to anyone."
        }
      />

      {/* Right Column: Interactive SSO Card */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        <ThemeToggle />

        <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
          <SSOHeader
            title={
              sessionUser
                ? "Identity Verified"
                : isValidRequest
                  ? "Single Sign-On"
                  : "Select University Portal"
            }
            description={
              sessionUser
                ? isValidRequest
                  ? `Authenticated session active. Continue to ${appDisplayName}.`
                  : "Choose a university application to proceed with your active session."
                : isValidRequest
                  ? `Authenticate via University Portal to access ${appDisplayName}.`
                  : "Choose an authorized campus service to sign in via SBS Single Sign-On."
            }
          />

          {/* Registered Client Application Details Card (if URL provided callback) */}
          {isValidRequest && (
            <RegisteredClientCard
              isRegisteredClient={isRegisteredClient}
              currentClient={currentClient}
              isUnregisteredChild={isUnregisteredChild}
              appDisplayName={appDisplayName}
              redirectUriParam={redirectUriParam}
              showClientSwitcher={showClientSwitcher}
              onToggleSwitcher={() => setShowClientSwitcher((prev) => !prev)}
              liveClients={LIVE_CLIENTS}
              selectedManualClient={selectedManualClient}
              onSelectManualClient={setSelectedManualClient}
              onSwitchAndConnect={(key) => {
                if (sessionUser) {
                  handleContinueAsSession(key);
                } else {
                  handleStartSourceLogin(key);
                }
              }}
              disabled={loading}
            />
          )}

          {/* Connection Security Badge */}
          <ConnectionBadge />

          {/* Error banner if any */}
          {loginError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-[shake_0.4s_ease-in-out]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          {/* User has active SSO session */}
          {sessionUser ? (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <SessionProfileCard
                sessionUser={sessionUser}
                devMode={dev}
                showNotice={isValidRequest}
                appDisplayName={appDisplayName}
              />

              {/* If no valid callback was in URL, show manual client selector */}
              {!isValidRequest && (
                <LiveClientSelector
                  liveClients={LIVE_CLIENTS}
                  selectedKey={selectedManualClient}
                  onSelect={setSelectedManualClient}
                  disabled={loading}
                />
              )}

              {/* Action Buttons for Logged-In User */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleContinueAsSession(
                      !isValidRequest ? selectedManualClient : undefined,
                    )
                  }
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
                        Continue to {appDisplayName} as{" "}
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

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
                >
                  <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Log Out SSO Session</span>
                </button>
              </div>
            </div>
          ) : (
            /* User is NOT logged in: Show Portal Selection (if needed), Visual Guidance with /sarthi-button.png, and Sign In */
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              {!isValidRequest ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>No Destination Portal Specified</span>
                    </div>
                    <p className="leading-relaxed">
                      Select an official campus portal from the live list below
                      to sign in via the SBS Exam Portal:
                    </p>
                  </div>

                  <LiveClientSelector
                    liveClients={LIVE_CLIENTS}
                    selectedKey={selectedManualClient}
                    onSelect={setSelectedManualClient}
                    disabled={loading}
                  />
                </>
              ) : (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="size-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        University Central Login
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Authentication is completed securely on the University
                        Exam Portal (<strong>sbsexam.edu.in</strong>). You will
                        be returned here automatically upon successful sign-in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guidance component explaining SBS Exam login & displaying /sarthi-button.png */}
              <ExamPortalGuidance compact={false} />

              {/* Action Buttons for non-logged in user */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleStartSourceLogin(
                      !isValidRequest ? selectedManualClient : undefined,
                    )
                  }
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
                      <span>Sign In to {appDisplayName} via SBS Exam</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isValidRequest && (
                  <button
                    type="button"
                    onClick={() => handleStartSourceLogin()}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
                  >
                    <span>Direct Sign In via SBS Exam (General Access)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dev Mode Playground Link */}
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

export default function Home() {
  return (
    <Suspense fallback={<SSOLoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}
