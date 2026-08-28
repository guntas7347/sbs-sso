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
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#090d16] transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-indigo-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Card container */}
      <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">
        {/* Top Accent Bar (Green and Orange Touch) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-orange to-brand-green"></div>

        <div className="p-8">
          {/* Logo Container */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-36 h-16 flex items-center justify-center">
              <Image
                src="/sbssu-logo.png"
                alt="SBS Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {step === 3 ? "Password Reset" : "Reset Password"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
              {step === 1 && "Verify your username and reset code to proceed"}
              {step === 2 && "Enter your new credentials and TOTP code"}
              {step === 3 && "Your password has been updated successfully"}
            </p>
          </div>

          {/* Error Box */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-pulse">
              <svg
                className="w-5 h-5 shrink-0"
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
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            /* Step 1 Form */
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="resetCode"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Reset Code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  placeholder="Enter your reset code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>

              {/* Reset Code Instructions */}
              <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 text-xs text-gray-650 dark:text-gray-400 space-y-1.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                  Whom to Contact for Reset Code:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong className="text-gray-800 dark:text-gray-200">Students:</strong> Contact your Head of the Department
                  </li>
                  <li>
                    <strong className="text-gray-800 dark:text-gray-200">Faculty &amp; Staff:</strong> Contact Dean Academics
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-brand-green hover:text-brand-green-hover transition-colors inline-flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            /* Step 2 Form */
            <form onSubmit={handleResetPassword} className="space-y-5">
              {userData && (
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider text-center">
                    Scan with Authenticator App
                  </span>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <QRCode
                      size={180}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      value={`otpauth://totp/SBS%20SSO:${username.trim()}?secret=${secret}&issuer=SBS%20SSO`}
                      viewBox={`0 0 180 180`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-mono break-all text-center max-w-xs select-all">
                    Secret: {secret}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="totp"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  TOTP Code
                </label>
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
                  className="w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}

          {step === 3 && (
            /* Success View */
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 flex flex-col gap-2 text-green-800 dark:text-green-400 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400/80">
                  Your new credentials are now active on your account.
                </p>
              </div>

              <Link
                href="/"
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all duration-200 cursor-pointer text-center block"
              >
                Proceed to Login
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-card-border flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>SBS University</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
            SSO Recovery
          </span>
        </div>
      </div>
    </div>
  );
}
