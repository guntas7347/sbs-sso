"use server";

import { verifyAuthenticatorToken } from "./totp";
import { hashPassword } from "./bycrypt";

const USER_API_URL = process.env.USER_API_URL!;
const RESET_API_URL = process.env.RESET_API_URL!;
const API_KEY = process.env.API_KEY!;

export interface SarthiUser {
  id: string;
  createdAt: string | null;
  email: string;
  name: string;
  username: string;
  role: string;
  totpKey: string | null;
  password: string | null;
  resetCode: string | null;
  resetExpiry: string | null;
}

export const sarthiGetUser = async (username: string) => {
  try {
    const response = await fetch(USER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        apiKey: API_KEY,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || "Failed to fetch user details",
      };
    }

    const rawUser = data.user || data;

    // Manually map and validate user fields to ensure consistent data structure
    const user: SarthiUser = {
      id: String(rawUser.id || ""),
      createdAt: rawUser.createdAt || null,
      email: String(rawUser.email || ""),
      name: String(rawUser.name || ""),
      username: String(rawUser.username || ""),
      role: String(rawUser.role || "user"),
      totpKey: rawUser.totpKey || rawUser.totp || null,
      password: rawUser.password || null,
      resetCode: rawUser.resetCode || rawUser.resetcode || null,
      resetExpiry: rawUser.resetExpiry || rawUser.resetexpiry || null,
    };

    return {
      success: true,
      data: {
        success: true,
        user,
      },
    };
  } catch (error) {
    console.error("Fetch user details error:", error);
    return {
      success: false,
      error: "Unable to connect to authentication server",
    };
  }
};

export const sarthiResetPassword = async (
  username: string,
  newPassword: string,
  totpCode: string,
  totpKey: string,
  resetCode: string,
  resetExpiry: any,
) => {
  try {
    // 1. Verify TOTP code entered by user
    if (!totpKey) {
      return { success: false, error: "MFA is not configured for this user" };
    }

    const isTokenValid = verifyAuthenticatorToken(totpCode, totpKey);
    if (!isTokenValid) {
      return { success: false, error: "Invalid TOTP code" };
    }

    const hashedPassword = await hashPassword(newPassword);

    // 2. Call reset-password API
    const response = await fetch(RESET_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        newPassword: hashedPassword,
        totpKey,
        resetCode,
        resetExpiry,
        apiKey: API_KEY,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || "Failed to reset password",
      };
    }

    return {
      success: true,
      data: {
        success: true,
        message: data.message || "Password reset successfully",
        user: data.user
          ? {
              id: String(data.user.id || ""),
              createdAt: data.user.createdAt || null,
              email: String(data.user.email || ""),
              name: String(data.user.name || ""),
              username: String(data.user.username || ""),
              role: String(data.user.role || "user"),
              totpKey: data.user.totpKey || null,
              password: data.user.password || null,
              resetCode: data.user.resetCode || null,
              resetExpiry: data.user.resetExpiry || null,
            }
          : undefined,
      },
    };
  } catch (error) {
    console.error("Reset password action error:", error);
    return {
      success: false,
      error: "Unable to connect to authentication server",
    };
  }
};
