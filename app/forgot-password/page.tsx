"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import {
  callUserApi,
  resetPasswordAction,
  getNewTotpSecret,
} from "@/lib/actions/login";
import QRCode from "react-qr-code";

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();

  // Step state: 1 = Verify Username & Reset Code, 2 = Enter New Password & TOTP, 3 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [secret, setSecret] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetched user data (stored for step 2 submission)
  const [userData, setUserData] = useState<any>(null);

  // Step 1: Verify username and match reset code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !resetCode.trim()) {
      setErrorMsg("Username and Reset Code are required");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch user details from /user API (via server action)
      const res = await callUserApi(username.trim());
      if (!res.success) {
        throw new Error(res.error || "User not found");
      }

      const user = res.data.user;
      if (!user) {
        throw new Error("User details not found");
      }

      // 2. Match reset code
      const expectedCode = user.resetCode || user.resetcode;
      if (!expectedCode || expectedCode !== resetCode.trim()) {
        throw new Error("Invalid reset code");
      }

      // 3. Check expiry
      const expiry = user.resetExpiry || user.resetexpiry;
      if (expiry && new Date(expiry).getTime() < Date.now()) {
        throw new Error("Reset code has expired");
      }

      // Save user details for step 2
      setUserData(user);

      // Generate new TOTP secret on server
      const newSecret = await getNewTotpSecret();
      setSecret(newSecret);

      // Advance to step 2
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || !totp.trim()) {
      setErrorMsg("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const totpKey = secret;
      const originalResetCode = userData.resetCode || userData.resetcode;
      const originalResetExpiry = userData.resetExpiry || userData.resetexpiry;

      // Call /reset-password API (via server action)
      const res = await resetPasswordAction(
        username.trim(),
        newPassword,
        totp.trim(),
        totpKey,
        originalResetCode,
        originalResetExpiry,
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to reset password");
      }

      // Advance to step 3 (Success)
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
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
            Account Recovery Gate
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Recover Access <br />
            <span className="bg-gradient-to-r from-brand-orange via-amber-400 to-brand-green bg-clip-text text-transparent">To Your Accounts</span>
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            Self-service SSO credentials verification and multi-factor authentication re-initialization portal. Follow the steps carefully to securely update your credentials.
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SSO security protocols active
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
              <span>Reset codes expire. Do not share generated verification parameters.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Reset Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        
        {/* Floating Theme Toggler */}
        <button
          onClick={toggleTheme}
          type="button"
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
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

        {/* Reset form container */}
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
                {step === 3 ? "Password Updated" : "Reset Credentials"}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                {step === 1 && "Enter your university identifier and authorized recovery reset code."}
                {step === 2 && "Configure your authenticator secret and set your new account password."}
                {step === 3 && "Credentials synchronized. You can now access official platforms."}
              </p>
            </div>
          </div>

          {/* Alert Message for verification errors */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-450 text-sm animate-[shake_0.4s_ease-in-out]">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            /* Step 1 Form */
            <form onSubmit={handleVerifyCode} className="space-y-5">
              
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
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Reset Code Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="resetCode" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Recovery Reset Code
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <input
                    id="resetCode"
                    type="text"
                    placeholder="Enter your reset code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contact Instructions */}
              <div className="p-4 rounded-xl bg-slate-200/40 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-400 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to retrieve a recovery code:
                </span>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li>
                    <strong className="text-slate-850 dark:text-slate-200 font-semibold">Students:</strong> Request assistance from your Head of Department.
                  </li>
                  <li>
                    <strong className="text-slate-850 dark:text-slate-200 font-semibold">Faculty / Staff:</strong> Contact the Office of Dean Academics.
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-50 text-center text-sm tracking-wide"
              >
                {loading ? "Verifying Credentials..." : "Verify Recovery Code"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="text-xs font-bold text-brand-green hover:underline hover:text-brand-green-hover transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            /* Step 2 Form */
            <form onSubmit={handleResetPassword} className="space-y-5">
              
              {/* QR Scan container */}
              {userData && (
                <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-2 space-y-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider text-center">
                    1. Scan with MFA Authenticator
                  </span>
                  <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                    <QRCode
                      size={160}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      value={`otpauth://totp/SBS%20SSO:${username.trim()}?secret=${secret}&issuer=SBS%20SSO`}
                      viewBox={`0 0 160 160`}
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono select-all block">
                      Secret Key: <span className="font-bold text-slate-650 dark:text-slate-350">{secret}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal block">
                      Use Google Authenticator, Microsoft Authenticator, or Aegis to scan the code.
                    </span>
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  2. Set New Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? (
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
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
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
              </div>

              {/* TOTP Validation Code Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="totp" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  3. Enter Newly Generated TOTP Code
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 dark:text-slate-500">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit TOTP code"
                    value={totp}
                    onChange={(e) =>
                      setTotp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full pl-11 pr-4 py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-50 text-center text-sm tracking-wide"
              >
                {loading ? "Registering Credentials..." : "Commit Password & MFA Reset"}
              </button>
            </form>
          )}

          {step === 3 && (
            /* Success View */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 flex flex-col gap-2.5 text-emerald-800 dark:text-emerald-450 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verification Succeeded!</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400/80">
                  Password has been updated. Your newly configured authenticator app parameters are now active for next authentication loops.
                </p>
              </div>

              <Link
                href="/"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center block text-sm tracking-wide"
              >
                Proceed to Secure Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Warning Policy / Help link footer */}
        <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-850 flex flex-col gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p className="leading-normal text-[11px] text-center lg:text-left">
            <strong className="text-slate-600 dark:text-slate-350">Security Policy:</strong> Centralized authentication recovery is audited. IP addresses and timestamps are recorded for security logs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] pt-2">
            <div>© {new Date().getFullYear()} SBS State University.</div>
            <div className="flex gap-3 font-semibold">
              <Link href="/" className="text-brand-green hover:underline hover:text-brand-green-hover transition-colors">Sign In Portal</Link>
              <span>•</span>
              <Link href="/hod-reset" className="text-brand-orange hover:underline hover:text-brand-orange-hover transition-colors">Admin Utility</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
