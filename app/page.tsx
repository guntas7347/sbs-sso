"use client";

import { useForm } from "@/hooks/useForm";
import { handleLogin } from "@/lib/login";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Shared Components
import { BrandSection } from "@/components/BrandSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SSOHeader } from "@/components/SSOHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { InputField } from "@/components/InputField";
import { SecurityFooter } from "@/components/SecurityFooter";

function LoginForm() {
  const [loginError, setLoginError] = useState<string | null>(null);
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
      <BrandSection
        badgeText="Official Portal Gate"
        titlePrefix="Connecting You to"
        titleGradient="Your Academic Journey"
        description="Sign in with your centralized credentials to securely connect to official resources, student and staff portals, research hubs, and communication networks."
        statusText="All authentication gateways are fully operational"
        securityGuideline="Never disclose your password or TOTP parameters to anyone."
      />

      {/* Right Column: Login Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-slate-50 dark:bg-[#0c1220] transition-colors duration-300">
        {/* Floating Theme Toggler */}
        <ThemeToggle />

        {/* Login form container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8 py-8">
          {/* Logo & Heading */}
          <SSOHeader
            title="Single Sign-On"
            description="Provide your identity parameters and multi-factor authenticator token to verify."
          />

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/10 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm tracking-wide mt-2"
            >
              Secure Authenticate
            </button>
          </form>
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
