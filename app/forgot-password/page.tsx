"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { callUserApi, resetPasswordAction } from "@/lib/login";
import { generateAuthenticatorSecret } from "@/lib/totp";
import QRCode from "react-qr-code";

// Shared Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { InputField } from "@/components/InputField";
import { SecurityFooter } from "@/components/SecurityFooter";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const autoSubmittedRef = useRef(false);

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

  // Fetched user data (stored for step 2 submission)
  const [userData, setUserData] = useState<any>(null);

  // Verify username and match reset code core logic
  const verifyCode = async (userToVerify: string, codeToVerify: string) => {
    if (!userToVerify.trim() || !codeToVerify.trim()) {
      setErrorMsg("Username and Reset Code are required");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch user details from /user API (via server action)
      const res = await callUserApi(userToVerify.trim());
      if (!res.success) {
        throw new Error(res.error || "User not found");
      }

      const user = res.data.user;
      if (!user) {
        throw new Error("User details not found");
      }

      // 2. Match reset code
      const expectedCode = user.resetCode || user.resetcode;
      if (!expectedCode || expectedCode !== codeToVerify.trim()) {
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
      const newSecret = await generateAuthenticatorSecret();
      setSecret(newSecret);

      // Advance to step 2
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Handle manual submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyCode(username, resetCode);
  };

  // Auto-populate and auto-submit if query params exist
  useEffect(() => {
    const qUsername = searchParams.get("username");
    const qResetCode =
      searchParams.get("resetCode") || searchParams.get("resetcode");

    if (qUsername) {
      setUsername(qUsername);
    }
    if (qResetCode) {
      setResetCode(qResetCode);
    }

    if (qUsername && qResetCode && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      verifyCode(qUsername, qResetCode);
    }
  }, [searchParams]);

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
      <BrandSection
        badgeText="Account Recovery Gate"
        titlePrefix="Recover Access"
        titleGradient="To Your Accounts"
        description="Self-service SSO credentials verification and multi-factor authentication re-initialization portal. Follow the steps carefully to securely update your credentials."
        statusText="SSO security protocols active"
        securityGuideline="Reset codes expire. Do not share generated verification parameters."
      />

      {/* Right Column: Reset Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        {/* Floating Theme Toggler */}
        <ThemeToggle />

        {/* Reset form container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8 py-8">
          {/* Logo & Heading */}
          <SSOHeader
            title={step === 3 ? "Password Updated" : "Reset Credentials"}
            description={
              step === 1
                ? "Enter your university identifier and authorized recovery reset code."
                : step === 2
                  ? "Configure your authenticator secret and set your new account password."
                  : "Credentials synchronized. You can now access official platforms."
            }
          />

          {/* Alert Message for verification errors */}
          {errorMsg && (
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
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            /* Step 1 Form */
            <form onSubmit={handleVerifyCode} className="space-y-5">
              {/* Username Field */}
              <InputField
                id="username"
                type="text"
                label="University Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
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

              {/* Reset Code Field */}
              <InputField
                id="resetCode"
                type="text"
                label="Recovery Reset Code"
                placeholder="Enter your reset code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                disabled={loading}
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />

              {/* Contact Instructions */}
              <div className="p-4 rounded-xl bg-slate-200/40 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850 text-xs text-slate-655 dark:text-slate-400 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-brand-orange"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  How to retrieve a recovery code:
                </span>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li>
                    <strong className="text-slate-850 dark:text-slate-200 font-semibold">
                      Students:
                    </strong>{" "}
                    Request assistance from your Head of Department.
                  </li>
                  <li>
                    <strong className="text-slate-850 dark:text-slate-200 font-semibold">
                      Faculty / Staff:
                    </strong>{" "}
                    Contact the Office of Dean Academics.
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
              {/* QR Scan container */}
              {userData && (
                <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-2 space-y-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider text-center">
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
                    <span className="text-[10px] text-slate-455 dark:text-slate-500 font-mono select-all block">
                      Secret Key:{" "}
                      <span className="font-bold text-slate-655 dark:text-slate-350">
                        {secret}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal block">
                      Use Google Authenticator, Microsoft Authenticator, or
                      Aegis to scan the code.
                    </span>
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <InputField
                id="newPassword"
                type="password"
                label="2. Set New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
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

              {/* Confirm Password Field */}
              <InputField
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
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

              {/* TOTP Validation Code Field */}
              <InputField
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                label="3. Enter Newly Generated TOTP Code"
                placeholder="Enter 6-digit TOTP code"
                value={totp}
                onChange={(e) =>
                  setTotp(e.target.value.replace(/[^0-9]/g, ""))
                }
                required
                disabled={loading}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-50 text-center text-sm tracking-wide"
              >
                {loading
                  ? "Registering Credentials..."
                  : "Commit Password & MFA Reset"}
              </button>
            </form>
          )}

          {step === 3 && (
            /* Success View */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 flex flex-col gap-2.5 text-emerald-800 dark:text-emerald-455 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <svg
                    className="w-5 h-5 shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Verification Succeeded!</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400/80">
                  Password has been updated. Your newly configured authenticator
                  app parameters are now active for next authentication loops.
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
        <SecurityFooter
          policyType="recovery"
          links={[
            {
              label: "Sign In Portal",
              href: "/",
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

export default function ForgotPassword() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
