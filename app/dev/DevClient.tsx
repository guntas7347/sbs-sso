"use client";

import { useState } from "react";
import { generateDevSSOCallback, SampleUser } from "@/app/dev/dev";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import {
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Zap,
  Loader2,
  ExternalLink,
  Copy,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

interface DevClientProps {
  sampleUsers: SampleUser[];
}

export default function DevClient({ sampleUsers }: DevClientProps) {
  const [mode, setMode] = useState<"sample" | "custom">("sample");
  const [selectedUserId, setSelectedUserId] = useState<string>(
    sampleUsers[0]?.id || "",
  );

  // Custom user fields
  const [customUser, setCustomUser] = useState({
    name: "Dev Tester",
    username: "235099",
    email: "dev.tester@example.com",
    role: "student",
    department: "Computer Science and Engineering",
    fathersName: "Rajesh Tester",
    rollNo: "235099",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<
    string,
    unknown
  > | null>(null);

  const activeSampleUser =
    sampleUsers.find((u) => u.id === selectedUserId) || sampleUsers[0];

  function getActiveUserObject(): Record<string, unknown> {
    if (mode === "sample" && activeSampleUser) {
      return {
        ...activeSampleUser,
        username: activeSampleUser.Username,
        name: activeSampleUser.Name,
        role: activeSampleUser.Role,
        email: activeSampleUser.email,
        department: activeSampleUser["Departure name"],
        rollNo: activeSampleUser["Roll no"],
        fathersName: activeSampleUser.FathersName,
      };
    }
    return {
      id: `custom_${Date.now()}`,
      username: customUser.username.trim(),
      Username: customUser.username.trim(),
      name: customUser.name.trim(),
      Name: customUser.name.trim(),
      email: customUser.email.trim(),
      role: customUser.role.trim(),
      Role: customUser.role.trim(),
      "Departure name": customUser.department.trim(),
      department: customUser.department.trim(),
      "Roll no": customUser.rollNo.trim() || null,
      rollNo: customUser.rollNo.trim() || null,
      FathersName: customUser.fathersName.trim(),
    };
  }

  async function handleCallSSO(openInNewTab = false) {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const userObj = getActiveUserObject();
      const result = await generateDevSSOCallback(userObj);

      if (!result.success || !result.url) {
        throw new Error(
          result.error || "Failed to generate encrypted SSO payload",
        );
      }

      console.log(result);

      setLastGeneratedUrl(result.url);
      setLastPayload(result.payload || null);

      if (openInNewTab) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        setStatus("Opened callback URL in a new tab.");
      } else {
        setStatus("Redirecting to SSO callback...");
        window.location.href = result.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "SSO handshake generation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyUrl() {
    try {
      const userObj = getActiveUserObject();
      const result = await generateDevSSOCallback(userObj);

      if (!result.success || !result.url) {
        throw new Error(result.error || "Failed to generate payload");
      }

      setLastGeneratedUrl(result.url);
      setLastPayload(result.payload || null);

      const absoluteUrl = new URL(
        result.url,
        window.location.origin,
      ).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setStatus("Callback URL copied to clipboard!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy URL");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 py-10 px-4 sm:px-6">
      <ThemeToggle />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-wider">
            <span className="size-2 rounded-full bg-brand-orange animate-pulse" />
            SBS SSO Dev Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            SSO Test Playground
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Select a sample student/faculty member or define a custom user, then
            click <strong>Call</strong> to simulate an authenticated SBS Exam
            portal callback.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 flex gap-1 border border-slate-300/60 dark:border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setMode("sample")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              mode === "sample"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-brand-orange" />
            <span>Select Sample User ({sampleUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              mode === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-4 h-4 text-brand-green" />
            <span>Create Custom User</span>
          </button>
        </div>

        {/* Content Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {mode === "sample" ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="sample-user-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                >
                  Choose a Preconfigured User
                </label>
                <select
                  id="sample-user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
                >
                  {sampleUsers.map((user: SampleUser) => (
                    <option key={user.id} value={user.id}>
                      {user.Name} — @{user.Username} ({user.Role.toUpperCase()})
                      • {user["Departure name"]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected User Details Preview */}
              {activeSampleUser && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-hover text-white flex items-center justify-center font-black text-sm shadow-sm">
                      {activeSampleUser.Name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                          {activeSampleUser.Role}
                        </span>
                        {activeSampleUser["Roll no"] && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Roll: {activeSampleUser["Roll no"]}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {activeSampleUser.Name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {activeSampleUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                        Username
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {activeSampleUser.Username}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                        Department
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">
                        {activeSampleUser["Departure name"]}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Custom User Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="custom-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="custom-name"
                    type="text"
                    value={customUser.name}
                    onChange={(e) =>
                      setCustomUser((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Jaspreet Singh"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-username"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Username / ID *
                  </label>
                  <input
                    id="custom-username"
                    type="text"
                    value={customUser.username}
                    onChange={(e) =>
                      setCustomUser((prev) => ({
                        ...prev,
                        username: e.target.value,
                        rollNo: e.target.value,
                      }))
                    }
                    placeholder="e.g. 235088"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="custom-email"
                    type="email"
                    value={customUser.email}
                    onChange={(e) =>
                      setCustomUser((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="e.g. jaspreet@example.com"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-role"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Role *
                  </label>
                  <select
                    id="custom-role"
                    value={customUser.role}
                    onChange={(e) =>
                      setCustomUser((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="custom-department"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Department
                  </label>
                  <input
                    id="custom-department"
                    type="text"
                    value={customUser.department}
                    onChange={(e) =>
                      setCustomUser((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Status */}
          {status && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{status}</span>
            </div>
          )}

          {/* Actions: The Main "Call" Button and secondary triggers */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCallSSO(false)}
              className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-brand-orange-hover hover:from-brand-orange-hover hover:to-brand-orange text-white font-extrabold rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/20 transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  <span>Authenticating via Dev Callback...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-white" />
                  <span>Call SSO Callback (Sign In)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCallSSO(true)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in New Tab</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleCopyUrl}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Callback URL</span>
              </button>
            </div>
          </div>

          {/* Collapsible Inspector for developers */}
          <details className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs group">
            <summary className="cursor-pointer font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-between py-1 select-none">
              <span>Inspect Payload & Encryption Details</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-3 pt-2">
              <div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Active User Payload:
                </span>
                <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                  {JSON.stringify(
                    lastPayload || getActiveUserObject(),
                    null,
                    2,
                  )}
                </pre>
              </div>

              {lastGeneratedUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Last Generated Callback URL:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[10px] break-all text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {lastGeneratedUrl}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-orange transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Central Gateway Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
