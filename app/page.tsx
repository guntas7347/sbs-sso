"use client";

import { useForm } from "@/hooks/useForm";
import { handleLogin, getActiveSession, handleSessionLogin } from "@/lib/login";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { clients, ClientId } from "@/lib/clients";

// Shared Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { InputField } from "@/components/InputField";
import { SecurityFooter } from "@/components/SecurityFooter";

function LoginForm() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    username: string;
    name?: string;
  } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [useManualLogin, setUseManualLogin] = useState(false);
  const searchParams = useSearchParams();

  const callBackParam =
    searchParams.get("callBack") || searchParams.get("callback") || undefined;
  const challengeParam =
    searchParams.get("challenge") ||
    searchParams.get("code_challenge") ||
    undefined;

  const isValidCallback = Boolean(
    callBackParam && clients[callBackParam as ClientId],
  );
  const isValidChallenge = Boolean(
    challengeParam && challengeParam.trim().length > 0,
  );
  const isValidRequest = isValidCallback && isValidChallenge;

  // Check for active JWT session cookie on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getActiveSession();
        if (session.success && session.username) {
          setSessionUser({
            username: session.username,
            name: session.name || session.username,
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

  // Initialize useForm with default values
  const { form, handleChange, error, checkError, setCheckError, setFields } =
    useForm({
      username: "",
      password: "",
      totp: "",
    });

  const handleContinueAsSession = async () => {
    setLoading(true);
    setLoginError(null);

    try {
      const res = await handleSessionLogin(callBackParam, challengeParam);
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
          "Active session expired or invalid. Please sign in with your credentials.",
      );
      setSessionUser(null);
      setUseManualLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckError(true);

    // If any field is empty (matching default value)
    if (error.username || error.password || error.totp) {
      return;
    }

    setLoading(true);
    setLoginError(null);

    try {
      const res = await handleLogin(
        form.username.trim(),
        form.password,
        form.totp.trim(),
        callBackParam,
        challengeParam,
      );
      if (!res.success) {
        throw new Error(res.error);
      }

      console.log("Login returned:", res.data);
      setLoginError(null);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      if (errorObj?.message?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Login failed:", err);
      setLoginError(
        errorObj?.message ||
          "Invalid username, password, or OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };


  // If request is missing valid callback or challenge parameters, show Invalid Sign-In Request UI
  if (!isValidRequest) {
    return (
      <div className="flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {/* Left Column: Branding and University info */}
        <BrandSection
          badgeText="Security Gateway"
          titlePrefix="Centralized Access"
          titleGradient="Security Protocol"
          description="Shaheed Bhagat Singh State University SSO provides secure and unified authentication for university portals, student management systems, and academic networks."
          statusText="SSO authorization gateway active"
          securityGuideline="Sign-in sessions must originate from registered and verified university applications."
        />

        {/* Right Column: Invalid Request Message Card */}
        <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
          {/* Floating Theme Toggler */}
          <ThemeToggle />

          {/* Invalid Request Container */}
          <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
            {/* Logo & Heading */}
            <SSOHeader
              title="Invalid Sign-In Request"
              description="Authentication handshake could not be established."
            />

            {/* Warning Message Card */}
            <div className="p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 backdrop-blur-sm space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Invalid Sign-In Request
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    This sign-in page was opened without a valid application
                    request.
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

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.close();
                    setTimeout(() => {
                      if (!window.closed) {
                        alert(
                          "Please close this browser tab or window to return to your application.",
                        );
                      }
                    }, 250);
                  }
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm tracking-wide flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close Webpage
              </button>
            </div>
          </div>

          {/* Warning Policy / Help link footer */}
          <SecurityFooter
            policyType="auth"
            links={[
              {
                label: "Forgot Password?",
                href: "/forgot-password",
                colorClass: "text-brand-green hover:text-brand-green-hover",
              },
              {
                label: "Admin Utility",
                href: "/hod-reset",
                colorClass: "text-brand-orange hover:text-brand-orange-hover",
              },
            ]}
          />
        </div>
      </div>
    );
  }

  const currentClient =
    callBackParam && clients[callBackParam as ClientId]
      ? clients[callBackParam as ClientId]
      : null;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Left Column: Branding and University info - hidden on mobile, visible on lg viewports */}
      <BrandSection
        badgeText="Official Portal Gate"
        titlePrefix="Connecting You to"
        titleGradient={currentClient?.name || "Your Academic Journey"}
        description={
          currentClient?.description
            ? `Sign in with your centralized credentials to access ${currentClient.name}. ${currentClient.description}.`
            : "Sign in with your centralized credentials to securely connect to official resources, student and staff portals, research hubs, and communication networks."
        }
        statusText="All authentication gateways are fully operational"
        securityGuideline="Never disclose your password or TOTP parameters to anyone."
      />

      {/* Right Column: Login Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        {/* Floating Theme Toggler */}
        <ThemeToggle />

        {/* Login form container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 py-8">
          {/* Logo & Heading */}
          <SSOHeader
            title="Single Sign-On"
            description={
              currentClient?.name
                ? `Provide your identity parameters and multi-factor token to verify access for ${currentClient.name}.`
                : "Provide your identity parameters and multi-factor authenticator token to verify."
            }
          />

          {/* Client Application Details Card */}
          {currentClient && (
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

          {/* Secure Connection established badge */}
          <ConnectionBadge />

          {/* Alert Message for validation / login errors */}
          {loginError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-455 text-sm animate-[shake_0.4s_ease-in-out]">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5 text-rose-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {/* Active Session Fast SSO Card */}
          {sessionUser && !useManualLogin ? (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-hover text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {(sessionUser.name || sessionUser.username).slice(0, 2).toUpperCase()}
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
                      @{sessionUser.username} • Session active on this device
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click continue to instantly authorize your access
                    {currentClient?.name ? ` to ${currentClient.name}` : ""} without re-entering credentials.
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
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Authorizing Access...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue as {sessionUser.name || sessionUser.username}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setLoginError(null);
                    setUseManualLogin(true);
                  }}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 dark:border-slate-700/50"
                >
                  <svg
                    className="w-4 h-4 text-slate-500 dark:text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                  <span>Use a different account</span>
                </button>
              </div>
            </div>
          ) : (
            /* Manual Form */
            <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.3s_ease]">
              {sessionUser && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    Saved session: <strong className="text-brand-orange">{sessionUser.name || sessionUser.username}</strong> <span className="text-slate-500 dark:text-slate-400">(@{sessionUser.username})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError(null);
                      setUseManualLogin(false);
                    }}
                    className="font-bold text-brand-orange hover:underline cursor-pointer ml-2 shrink-0"
                  >
                    Continue as {sessionUser.name || sessionUser.username} &rarr;
                  </button>
                </div>
              )}

              {/* Username Field */}
              <InputField
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                label="University Username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                error={checkError && !!error.username}
                errorText="Username credentials are required"
                icon={
                  <svg
                    className="w-4.5 h-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
              />

              {/* Password Field */}
              <InputField
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                label="Secret Password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                error={checkError && !!error.password}
                errorText="Secret password is required"
                showPasswordToggle={true}
                icon={
                  <svg
                    className="w-4.5 h-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              {/* TOTP Field */}
              <InputField
                id="totp"
                name="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                label="TOTP Auth Code"
                placeholder="Enter 6-digit TOTP code"
                value={form.totp}
                disabled={loading}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setFields({ totp: val });
                }}
                error={checkError && !!error.totp}
                errorText="6-digit TOTP verification is required"
                icon={
                  <svg
                    className="w-4.5 h-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                }
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-center text-sm tracking-wide mt-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  "Secure Authenticate"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Warning Policy / Help link footer */}
        <SecurityFooter
          policyType="auth"
          links={[
            {
              label: "Forgot Password?",
              href: "/forgot-password",
              colorClass: "text-brand-green hover:text-brand-green-hover",
            },
            {
              label: "Admin Utility",
              href: "/hod-reset",
              colorClass: "text-brand-orange hover:text-brand-orange-hover",
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
