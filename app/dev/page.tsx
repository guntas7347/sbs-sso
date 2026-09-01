"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------
const DEV_PASSWORD = "guntas";
const API_KEY = "asnjhijcs";
const BASE_API = "https://sbs-sso-api.guntassandhu.com/internal/sso";
const ALL_USERS_URL = `${BASE_API}/all-users?apiKey=${API_KEY}`;
const CREATE_USER_URL = `${BASE_API}/create-user`;
const EDIT_USER_URL = `${BASE_API}/edit-user`;
const RESET_CODE_URL = `${BASE_API}/generate-reset-code`;

interface User {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  username: string;
  role: string;
  totpKey?: string | null;
  password?: string | null;
  resetCode?: string | null;
  resetExpiry?: string | null;
}

export default function DevUsersPage() {
  // ---------------------------------------------------------------------------
  // Dev Password Gate State
  // ---------------------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    // Check if session storage has authenticated flag
    const storedAuth = sessionStorage.getItem("sso_dev_authenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === DEV_PASSWORD) {
      sessionStorage.setItem("sso_dev_authenticated", "true");
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect developer password.");
    }
  };

  const handleLockSession = () => {
    sessionStorage.removeItem("sso_dev_authenticated");
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  // ---------------------------------------------------------------------------
  // Data State
  // ---------------------------------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // ---------------------------------------------------------------------------
  // Modals & Action State
  // ---------------------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    name: "",
    role: "student",
    email: "",
  });
  const [creatingUser, setCreatingUser] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editUserForm, setEditUserForm] = useState({
    id: "",
    username: "",
    name: "",
    role: "student",
    email: "",
  });
  const [editingUser, setEditingUser] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Reset Code Modal
  const [activeResetUser, setActiveResetUser] = useState<User | null>(null);
  const [resetCodeResult, setResetCodeResult] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Fetch Users
  // ---------------------------------------------------------------------------
  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(ALL_USERS_URL, {
        headers: {
          "x-api-key": API_KEY,
        },
      });
      const data = await response.json();
      console.log(data);
      if (response.ok && data.success && Array.isArray(data.users)) {
        const mappedUsers: User[] = data.users.map((u: any) => ({
          id: String(u.id || ""),
          createdAt: u.createdAt || null,
          email: String(u.email || ""),
          name: String(u.name || ""),
          username: String(u.username || ""),
          role: String(u.role || "user"),
          totpKey: u.totpKey || null,
          password: u.password || null,
          resetCode: u.resetCode || null,
          resetExpiry: u.resetExpiry || null,
        }));
        setUsers(mappedUsers);
      } else {
        setFetchError(data.message || "Failed to load users list.");
      }
    } catch (err: any) {
      setFetchError(err.message || "Network error while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  // ---------------------------------------------------------------------------
  // Filtered Users
  // ---------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q);

      const matchRole =
        selectedRole === "all" ||
        u.role?.toLowerCase() === selectedRole.toLowerCase();

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, selectedRole]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((u) => {
      if (u.role) roles.add(u.role.toLowerCase());
    });
    return Array.from(roles);
  }, [users]);

  // ---------------------------------------------------------------------------
  // Create User Handler
  // ---------------------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createUserForm.username.trim()) {
      setCreateError("Username is required.");
      return;
    }
    if (!createUserForm.email.trim()) {
      setCreateError("Email is required.");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch(CREATE_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          username: createUserForm.username.trim(),
          name: createUserForm.name.trim(),
          role: createUserForm.role.trim(),
          email: createUserForm.email.trim(),
          apiKey: API_KEY,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCreateSuccess(
          `User '${createUserForm.username}' created successfully!`,
        );
        setCreateUserForm({
          username: "",
          name: "",
          role: "student",
          email: "",
        });
        fetchUsers();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateSuccess(null);
        }, 1200);
      } else {
        setCreateError(data.message || "Failed to create user.");
      }
    } catch (err: any) {
      setCreateError(err.message || "An unexpected error occurred.");
    } finally {
      setCreatingUser(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit User Handlers
  // ---------------------------------------------------------------------------
  const handleOpenEditModal = (user: User) => {
    setEditUserForm({
      id: user.id,
      username: user.username,
      name: user.name || "",
      role: user.role || "student",
      email: user.email || "",
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    if (!editUserForm.id.trim()) {
      setEditError("User ID is required.");
      return;
    }
    if (!editUserForm.username.trim()) {
      setEditError("Username is required.");
      return;
    }
    if (!editUserForm.email.trim()) {
      setEditError("Email is required.");
      return;
    }

    setEditingUser(true);
    try {
      const response = await fetch(EDIT_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          id: editUserForm.id.trim(),
          name: editUserForm.name.trim(),
          email: editUserForm.email.trim(),
          role: editUserForm.role.trim(),
          username: editUserForm.username.trim(),
          apiKey: API_KEY,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEditSuccess(`User '${editUserForm.username}' updated successfully!`);
        fetchUsers();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditSuccess(null);
        }, 1200);
      } else {
        setEditError(data.message || "Failed to update user.");
      }
    } catch (err: any) {
      setEditError(err.message || "An unexpected error occurred.");
    } finally {
      setEditingUser(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Generate Reset Code Handler
  // ---------------------------------------------------------------------------
  const handleGenerateResetCode = async (user: User) => {
    setActiveResetUser(user);
    setResetCodeResult(null);
    setResetError(null);
    setCopiedCode(false);
    setResetLoading(true);

    try {
      const response = await fetch(RESET_CODE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          username: user.username.trim(),
          apiKey: API_KEY,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.resetCode) {
        setResetCodeResult(data.resetCode);
      } else {
        setResetError(data.message || "Failed to generate reset code.");
      }
    } catch (err: any) {
      setResetError(err.message || "Network error generating reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyResetCode = () => {
    if (resetCodeResult) {
      navigator.clipboard.writeText(resetCodeResult);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // ---------------------------------------------------------------------------
  // Role Styling Helper
  // ---------------------------------------------------------------------------
  const getRoleBadgeStyle = (role?: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "faculty":
      case "teacher":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "hod":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "student":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "staff":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  // ---------------------------------------------------------------------------
  // Render Password Gate if unauthenticated
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="size-12 mx-auto rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl">
              ⚡
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Dev Only Utility
            </div>
            <h1 className="text-2xl font-black text-white">
              SBS SSO Dev Console
            </h1>
            <p className="text-xs text-slate-400">
              Enter developer password to access internal user management &
              reset tools.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="dev-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Developer Access Password
              </label>
              <input
                id="dev-password"
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Default password:{" "}
                <code className="text-amber-400 font-mono font-bold">
                  devadmin123
                </code>
              </p>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-[0.99]"
            >
              Unlock Dev Console
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              &larr; Return to SBS SSO Sign-in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Authenticated Dev Dashboard
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Dev Only Warning Banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <span className="animate-pulse text-base">⚠️</span>
            <span>INTERNAL DEV UTILITY — NOT FOR PRODUCTION USE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              SSO Login &rarr;
            </Link>
            <Link
              href="/forgot-password"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              Reset Page &rarr;
            </Link>
            <button
              type="button"
              onClick={handleLockSession}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-[11px] font-bold border border-rose-500/30 transition-colors cursor-pointer"
            >
              Lock Console 🔒
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected: {BASE_API.replace("https://", "")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              SSO Users & Accounts Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Directly view all Firestore users, create test accounts, and
              generate password reset codes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <svg
                className={`size-4 ${loading ? "animate-spin text-amber-400" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Users
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {loading ? "..." : users.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Filtered
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {loading ? "..." : filteredUsers.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Roles Count
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {uniqueRoles.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              API Status
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Operational</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <div className="relative flex-1">
            <svg
              className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by username, name, email, or id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold shrink-0">
              Role:
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Roles ({users.length})</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role.toUpperCase()} (
                  {users.filter((u) => u.role?.toLowerCase() === role).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {fetchError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between gap-3">
            <span>{fetchError}</span>
            <button
              type="button"
              onClick={fetchUsers}
              className="underline font-bold hover:text-rose-300 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Users Table / List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="size-8 mx-auto border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">
                Loading Firestore users from SBS API...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="text-2xl">🔍</div>
              <p className="text-sm font-bold text-white">No users found</p>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or filter parameters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3.5 px-5">User</th>
                      <th className="py-3.5 px-5">Full Name</th>
                      <th className="py-3.5 px-5">Email</th>
                      <th className="py-3.5 px-5">Role</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id || user.username}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                              {(user.name || user.username)
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white font-mono">
                                @{user.username}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-slate-300 font-medium">
                          {user.name || (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-slate-300 font-mono text-[11px]">
                          {user.email}
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getRoleBadgeStyle(
                              user.role,
                            )}`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(user)}
                              className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateResetCode(user)}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            >
                              <span>🔑</span>
                              <span>Reset Code</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-slate-800/60">
                {filteredUsers.map((user) => (
                  <div key={user.id || user.username} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {(user.name || user.username)
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {user.name || user.username}
                          </div>
                          <div className="text-xs text-amber-400/90 font-mono">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getRoleBadgeStyle(
                          user.role,
                        )}`}
                      >
                        {user.role || "user"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono break-all bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      {user.email}
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {user.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateResetCode(user)}
                          className="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>🔑</span>
                          <span>Reset Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Create User Modal                                                     */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  Create Test User
                </h3>
                <p className="text-xs text-slate-400">
                  Adds a new user profile directly into Sarthi / SBS SSO
                  database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Username <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2214099 or test_student"
                  value={createUserForm.username}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      username: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={createUserForm.name}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      role: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={createUserForm.email}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      email: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {createError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium">
                  {createSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Edit User Modal                                                       */}
      {/* ===================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Edit User Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update user attributes in Sarthi / SBS SSO database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  User ID (Immutable)
                </label>
                <input
                  type="text"
                  value={editUserForm.id}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Username <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2214099 or test_student"
                  value={editUserForm.username}
                  onChange={(e) =>
                    setEditUserForm({
                      ...editUserForm,
                      username: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={editUserForm.name}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={editUserForm.role}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address <span className="text-blue-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={editUserForm.email}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, email: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium">
                  {editSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {editingUser ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Reset Code Result Modal                                               */}
      {/* ===================================================================== */}
      {activeResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <h3 className="text-base font-black text-white">
                  Password Reset Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResetUser(null)}
                className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">
                Target User:
              </div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>{activeResetUser.name || activeResetUser.username}</span>
                <span className="text-xs text-amber-400 font-mono">
                  @{activeResetUser.username}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {activeResetUser.email}
              </div>
            </div>

            {resetLoading ? (
              <div className="py-8 text-center space-y-3">
                <div className="size-8 mx-auto border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">
                  Generating reset code via API...
                </p>
              </div>
            ) : resetError ? (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {resetError}
              </div>
            ) : resetCodeResult ? (
              <div className="space-y-4">
                <div className="text-center p-5 bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-2xl space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                    Generated Reset Code (Valid 15m)
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest selection:bg-amber-500 selection:text-black">
                    {resetCodeResult}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyResetCode}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>
                      {copiedCode
                        ? "✓ Copied to Clipboard!"
                        : "📋 Copy Reset Code"}
                    </span>
                  </button>

                  <Link
                    href={`/forgot-password?username=${encodeURIComponent(activeResetUser.username)}&resetCode=${resetCodeResult}`}
                    target="_blank"
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Reset UI</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setActiveResetUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
