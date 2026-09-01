"use server";

import { comparePassword } from "./bycrypt";
import {
  createAuthorizationCode,
  createSessionToken,
  verifyJwtToken,
} from "./jwt";
import { clients, ClientId } from "./clients";
import { verifyAuthenticatorToken } from "./totp";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sarthiGetUser } from "./sarthi";

const appendCodeToUri = (uri: string, code: string) => {
  try {
    const url = new URL(uri);
    url.searchParams.set("code", code);
    return url.toString();
  } catch {
    return uri.includes("?") ? `${uri}&code=${code}` : `${uri}?code=${code}`;
  }
};

export const handleLogin = async (
  username: string,
  password: string,
  totp: string,
  callbackId?: string,
  challenge?: string,
  redirectUri?: string,
  isUnregistered?: boolean,
) => {
  let redirectUrl: string | null = null;
  let userData: any = null;

  try {
    const result = await sarthiGetUser(username);
    if (!result.success || !result.data?.user) {
      return { success: false, error: result.error || "Invalid username or password" };
    }

    const user = result.data.user;

    const correctPassword = user.password;
    if (!correctPassword) {
      return { success: false, error: "Invalid username or password" };
    }

    const compareResult = await comparePassword(password, correctPassword);
    if (!compareResult) {
      return { success: false, error: "Invalid username or password" };
    }

    const totpKey = user.totpKey;
    if (!totpKey) {
      return { success: false, error: "MFA is not configured for this user" };
    }

    const isTokenValid = verifyAuthenticatorToken(totp, totpKey);
    if (!isTokenValid) {
      return { success: false, error: "Invalid TOTP" };
    }

    const fullName = user.name || user.username;

    // Create 24-hour local JWT session cookie
    const sessionToken = await createSessionToken({
      username: user.username,
      name: fullName,
    });

    const cookieStore = await cookies();
    cookieStore.set("sso_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    const authCode = await createAuthorizationCode({
      username: user.username,
      codeChallenge: challenge,
      isUnregistered: isUnregistered ? true : undefined,
    });

    if (isUnregistered && redirectUri) {
      redirectUrl = appendCodeToUri(redirectUri, authCode);
    } else if (callbackId && clients[callbackId as ClientId]) {
      const targetUri = clients[callbackId as ClientId].redirectUri;
      redirectUrl = appendCodeToUri(targetUri, authCode);
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

export const getActiveSession = async () => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sso_session");
    if (!sessionCookie?.value) {
      return { success: false };
    }

    const payload = await verifyJwtToken(sessionCookie.value);
    if (!payload || typeof payload === "string" || !payload.username) {
      return { success: false };
    }

    return {
      success: true,
      username: payload.username as string,
      name: (payload.name as string) || (payload.username as string),
    };
  } catch (error) {
    console.error("Get active session error:", error);
    return { success: false };
  }
};

export const handleSessionLogin = async (
  callbackId?: string,
  challenge?: string,
  redirectUri?: string,
  isUnregistered?: boolean,
) => {
  let redirectUrl: string | null = null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sso_session");
    if (!sessionCookie?.value) {
      return { success: false, error: "No active session found" };
    }

    const payload = await verifyJwtToken(sessionCookie.value);
    if (!payload || typeof payload === "string" || !payload.username) {
      return { success: false, error: "Session has expired or is invalid" };
    }

    const authCode = await createAuthorizationCode({
      username: payload.username as string,
      codeChallenge: challenge,
      isUnregistered: isUnregistered ? true : undefined,
    });

    if (isUnregistered && redirectUri) {
      redirectUrl = appendCodeToUri(redirectUri, authCode);
    } else if (callbackId && clients[callbackId as ClientId]) {
      const targetUri = clients[callbackId as ClientId].redirectUri;
      redirectUrl = appendCodeToUri(targetUri, authCode);
    }
  } catch (error) {
    console.error("Session login error:", error);
    return {
      success: false,
      error: "Session Authentication Failed",
    };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return {
    success: true,
  };
};

export const clearSessionAction = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sso_session");
    return { success: true };
  } catch (error) {
    console.error("Clear session error:", error);
    return { success: false };
  }
};
