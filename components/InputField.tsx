import React, { useState } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: boolean;
  errorText?: string;
  showPasswordToggle?: boolean;
}

export function InputField({
  id,
  label,
  icon,
  error,
  errorText,
  showPasswordToggle,
  type = "text",
  className = "",
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={id}
        className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-slate-400 dark:text-slate-500">
          {icon}
        </span>
        <input
          id={id}
          type={inputType}
          className={`w-full pl-11 ${
            showPasswordToggle ? "pr-12" : "pr-4"
          } py-3 border rounded-xl outline-none bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-orange dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all duration-200 ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
              : ""
          } ${className}`}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer flex items-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
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
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && errorText && (
        <span className="text-xs text-rose-550 dark:text-rose-450 font-semibold flex items-center gap-1.5 mt-0.5 animate-[fadeIn_0.2s_ease]">
          <span className="w-1 h-1 rounded-full bg-rose-550"></span>
          {errorText}
        </span>
      )}
    </div>
  );
}
