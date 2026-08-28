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
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#090d16] transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          // Sun Icon
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
          // Moon Icon
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

      {/* Main Login Card */}
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
              SSO Portal Login
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in with your single account credentials
            </p>
          </div>

          {/* Alert Message for validation errors */}
          {loginError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
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
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200 ${
                  checkError && error.username
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                    : ""
                }`}
              />
              {checkError && error.username && (
                <span className="text-xs text-red-500 font-medium">
                  Username is required
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-green hover:text-brand-green-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200 ${
                  checkError && error.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                    : ""
                }`}
              />
              {checkError && error.password && (
                <span className="text-xs text-red-500 font-medium">
                  Password is required
                </span>
              )}
            </div>

            {/* TOTP Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="totp"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                TOTP Code
              </label>
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
                className={`w-full px-4 py-3 border rounded-lg outline-none bg-input-bg border-input-border text-foreground focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 transition-all duration-200 ${
                  checkError && error.totp
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                    : ""
                }`}
              />
              {checkError && error.totp && (
                <span className="text-xs text-red-500 font-medium">
                  OTP is required
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-brand-orange to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Footer / Info bar */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-card-border flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>SBS University</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            SSO Protected
          </span>
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
