"use client";

import React, { useState } from "react";
import { loginWithSarthi, SarthiLoginResponse } from "@/lib/loginhandler";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandSection } from "@/components/BrandSection";
import { InputField } from "@/components/InputField";

export default function SarthiNewLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [responseResult, setResponseResult] = useState<SarthiLoginResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = "Username is required";
    }
    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setResponseResult(null);

    try {
      const res = await loginWithSarthi(username.trim(), password);
      setResponseResult(res);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during login.";
      setResponseResult({
        status: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setFieldErrors({});
    setResponseResult(null);
  };

  const isSuccess = responseResult?.status?.toLowerCase() === "success";

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <ThemeToggle />

      {/* Left Column: Brand Section */}
      <BrandSection
        badgeText="Sarthi Direct Auth"
        titlePrefix="Direct Authentication"
        titleGradient="Sarthi Portal Login"
        description="Authenticate directly against the Sarthi API backend with live response introspection."
        statusText="Sarthi Gateway Active"
        securityGuideline="Ensure your credentials match your Sarthi portal registration."
      />

      {/* Right Column: Form & Response Data */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Sarthi Login Test
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authenticate via username & password. Results are displayed in real-time below.
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <InputField
                id="username"
                label="Username"
                type="text"
                placeholder="Enter Sarthi username / roll number"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
                error={Boolean(fieldErrors.username)}
                errorText={fieldErrors.username}
                icon={
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
              />

              <InputField
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                showPasswordToggle
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                error={Boolean(fieldErrors.password)}
                errorText={fieldErrors.password}
                icon={
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 focus:ring-4 focus:ring-brand-orange/20 shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                    <span>Sign In with Sarthi</span>
                  )}
                </button>

                {(responseResult || username || password) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Response Display Section */}
          {responseResult && (
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm space-y-4 animate-in fade-in duration-300">
              {/* Status Header Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="mt-0.5">
                  {isSuccess ? (
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30 border border-current">
                      Status: {responseResult.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{responseResult.message}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Returned Response Data</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">
                    {responseResult.user ? `${Object.keys(responseResult.user).length} user attributes` : "no user object"}
                  </span>
                </h3>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-semibold w-1/3">Property</th>
                        <th className="py-2.5 px-4 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                          status
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isSuccess
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            }`}
                          >
                            {responseResult.status}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                          message
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                          {responseResult.message}
                        </td>
                      </tr>

                      {responseResult.user &&
                        typeof responseResult.user === "object" &&
                        Object.entries(responseResult.user).map(([key, val]) => (
                          <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-2.5 px-4 font-mono font-medium text-emerald-700 dark:text-emerald-400">
                              user.{key}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 break-all">
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

              {/* Raw JSON Debug Box */}
              <details className="group pt-2">
                <summary className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer list-none flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>View Raw JSON Response</span>
                </summary>
                <pre className="mt-2 p-3 bg-slate-900 text-emerald-400 dark:bg-black/50 dark:text-emerald-300 text-xs font-mono rounded-xl overflow-x-auto border border-slate-800">
                  {JSON.stringify(responseResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
