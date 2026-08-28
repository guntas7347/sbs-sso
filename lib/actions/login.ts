"use server";

import { comparePassword, hashPassword } from "../bycrypt";
import { createAuthorizationCode } from "../jwt";
import { clients, ClientId } from "../redirects/redirects";
import { verifyAuthenticatorToken, generateAuthenticatorSecret } from "../totp";
import { redirect } from "next/navigation";

const API_KEY = process.env.API_KEY!;
const USER_API_URL = process.env.USER_API_URL!;
const RESET_API_URL = process.env.RESET_API_URL!;

export const handleLogin = async (
  username: string,
  password: string,
  totp: string,
  callbackId?: string,
  challenge?: string,
) => {
  let redirectUrl: string | null = null;
  let userData: any = null;

  try {
    const result = await callUserApi(username);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const user = result.data.user;
    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const correctPassword = user.password;
    if (!correctPassword) {
      return { success: false, error: "Invalid username or password" };
    }

    const compareResult = await comparePassword(password, correctPassword);
    if (!compareResult) {
      return { success: false, error: "Invalid username or password" };
    }

    // Verify TOTP token
    const totpKey = user.totpKey || user.totp;
    if (!totpKey) {
      return { success: false, error: "MFA is not configured for this user" };
    }

    const isTokenValid = verifyAuthenticatorToken(totp, totpKey);
    if (!isTokenValid) {
      return { success: false, error: "Invalid TOTP" };
    }

    const authCode = await createAuthorizationCode({
      username: user.username,
      codeChallenge: challenge,
    });

    console.log("Auth code:", authCode);
    console.log("Challenge:", challenge);
    console.log("Callback ID:", callbackId);
    console.log("Callback:", clients[callbackId as ClientId]);

    if (callbackId && clients[callbackId as ClientId]) {
      const redirectUri = clients[callbackId as ClientId].redirectUri;
      redirectUrl = `${redirectUri}?code=${authCode}`;
    }
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error: "Authentication Failed",
    };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return {
    success: true,
    data: userData,
  };
};

export const callUserApi = async (username: string) => {
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

export const resetPasswordAction = async (
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

export const getNewTotpSecret = async () => {
  return generateAuthenticatorSecret();
};
