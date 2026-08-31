"use server";

import { verifyAuthenticatorToken } from "./totp";
import { hashPassword } from "./bycrypt";

const USER_API_URL = process.env.USER_API_URL!;
const RESET_API_URL = process.env.RESET_API_URL!;
const API_KEY = process.env.API_KEY!;

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

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch user details",
      };
    }

    return {
      success: true,
      data,
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

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to reset password",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Reset password action error:", error);
    return {
      success: false,
      error: "Unable to connect to authentication server",
    };
  }
};
