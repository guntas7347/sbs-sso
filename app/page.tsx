"use client";

import Image from "next/image";
import Link from "next/link";
import { useForm } from "@/hooks/useForm";
import { useTheme } from "@/hooks/useTheme";
import { handleLogin } from "@/lib/actions/login";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callBackParam = searchParams.get("callBack") || undefined;
  const challengeParam = searchParams.get("challenge") || undefined;

  // Initialize useForm with default values
  const { form, handleChange, error, checkError, setCheckError, setFields } =
    useForm({
      username: "",
      password: "",
      totp: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckError(true);

    // If any field is empty (matching default value)
    if (error.username || error.password || error.totp) {
      return;
    }

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
      alert("Login Successful");
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginError(
        err.message || "Invalid username, password, or OTP. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Left Column: Branding and University info - hidden on mobile, visible on lg viewports */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-16 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white select-none">
        
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Ambient Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />

        {/* Top Branding Section */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md">
            SB
          </div>
          <div>
            <div className="font-black tracking-wide text-lg leading-none">SBS STATE UNIVERSITY</div>
            <div className="text-[10px] text-emerald-400 font-bold tracking-widest mt-1">SECURE IDENTITY IDENTITY SYSTEM</div>
          </div>
        </div>

        {/* Middle Greeting / Marketing Section */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20 tracking-wide uppercase">
            Official Portal Gate
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Connecting You to <br />
            <span className="bg-gradient-to-r from-brand-orange via-amber-400 to-brand-green bg-clip-text text-transparent">Your Academic Journey</span>
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            Sign in with your centralized credentials to securely connect to official resources, student and staff portals, research hubs, and communication networks.
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All authentication gateways are fully operational
          </div>
        </div>

        {/* Bottom Support & Security section */}
        <div className="relative z-10 flex flex-col gap-4 text-xs text-slate-400 border-t border-white/10 pt-8">
          <div className="flex justify-between items-center gap-8 flex-wrap">
            <div>
              <span className="font-bold text-white block mb-0.5">Need IT Helpdesk Support?</span>
              <span>Tech Helpline: +1 (555) 234-5678  |  helpdesk@sbssu.edu</span>
            </div>
            <div>
              <span className="font-bold text-white block mb-0.5">Security Guidelines</span>
              <span>Never disclose your password or TOTP parameters to anyone.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        
        {/* Floating Theme Toggler */}
        <button
          onClick={toggleTheme}
          type="button"
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Login form container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8 py-8">
          
          {/* Logo & Heading */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-4">
            <div className="relative w-44 h-16 bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-center">
              <Image
                src="/sbssu-logo.png"
                alt="SBS Logo"
                fill
                priority
                className="object-contain p-1.5"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Single Sign-On
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                Provide your identity parameters and multi-factor authenticator token to verify.
              </p>
            </div>
          </div>

          {/* Secure Connection established badge */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-200/40 dark:bg-slate-900/60 text-[10px] text-slate-650 dark:text-slate-400 font-bold tracking-wider uppercase border border-slate-200/50 dark:border-slate-850">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure SSO Channel Connection
          </div>

          {/* Alert Message for validation / login errors */}
          {loginError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-450 text-sm animate-[shake_0.4s_ease-in-out]">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                University Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200 ${
                    checkError && error.username
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
                      : ""
                  }`}
                />
              </div>
              {checkError && error.username && (
                <span className="text-xs text-rose-550 dark:text-rose-450 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-rose-550"></span>
                  Username credentials are required
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Secret Password
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200 ${
                    checkError && error.password
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {checkError && error.password && (
                <span className="text-xs text-rose-550 dark:text-rose-450 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-rose-550"></span>
                  Secret password is required
                </span>
              )}
            </div>

            {/* TOTP Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totp" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                TOTP Auth Code
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  id="totp"
                  name="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit TOTP code"
                  value={form.totp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setFields({ totp: val });
                  }}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200 ${
                    checkError && error.totp
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
                      : ""
                  }`}
                />
              </div>
              {checkError && error.totp && (
                <span className="text-xs text-rose-550 dark:text-rose-450 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-rose-550"></span>
                  6-digit TOTP verification is required
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm tracking-wide mt-2"
            >
              Secure Authenticate
            </button>
          </form>
        </div>

        {/* Warning Policy / Help link footer */}
        <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-850 flex flex-col gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p className="leading-normal text-[11px] text-center lg:text-left">
            <strong className="text-slate-600 dark:text-slate-350">Authorized Use Only:</strong> By accessing this system, you agree to comply with the university Acceptable Computer Use Policy. Logins are encrypted and recorded.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] pt-2">
            <div>© {new Date().getFullYear()} SBS State University.</div>
            <div className="flex gap-3 font-semibold">
              <Link href="/forgot-password" className="text-brand-green hover:underline hover:text-brand-green-hover transition-colors">Forgot Password?</Link>
              <span>•</span>
              <Link href="/hod-reset" className="text-brand-orange hover:underline hover:text-brand-orange-hover transition-colors">Admin Utility</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
