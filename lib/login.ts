"use server";

import {
  createAuthorizationCode,
  createSessionToken,
  verifyJwtToken,
} from "./jwt";
import { clients, ClientId } from "./clients";
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
  password?: string,
  totp?: string,
  callbackId?: string,
  challenge?: string,
  redirectUri?: string,
  isUnregistered?: boolean,
) => {
  let redirectUrl: string | null = null;
  let userData: Record<string, unknown> | null = null;

  try {
    const result = await sarthiGetUser(username);
    if (!result.success || !result.data?.user) {
      return {
        success: false,
        error: result.error || "Invalid username or user not found",
      };
    }

    const user = result.data.user;
    const fullName = user.name || user.username;
    userData = user as unknown as Record<string, unknown>;

    // Create 1-month (30-day) local JWT session cookie
    const sessionToken = await createSessionToken({
      username: user.username,
      name: fullName,
      user: userData,
    });

    const cookieStore = await cookies();
    cookieStore.set("sso_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days (1 month)
    });

    const authCode = await createAuthorizationCode({
      username: user.username,
      codeChallenge: challenge,
      isUnregistered: isUnregistered ? true : undefined,
      user: userData,
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

    const userPayload =
      (payload.user as Record<string, unknown>) ||
      Object.fromEntries(
        Object.entries(payload).filter(
          ([k]) => !["iat", "exp", "nbf", "jti"].includes(k),
        ),
      );

    return {
      success: true,
      username: payload.username as string,
      name: (payload.name as string) || (payload.username as string),
      user: userPayload,
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

    const userPayload =
      (payload.user as Record<string, unknown>) ||
      Object.fromEntries(
        Object.entries(payload).filter(
          ([k]) => !["iat", "exp", "nbf", "jti"].includes(k),
        ),
      );

    const authCode = await createAuthorizationCode({
      username: payload.username as string,
      codeChallenge: challenge,
      isUnregistered: isUnregistered ? true : undefined,
      user: userPayload,
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

export const saveAuthContext = async (
  callBack?: string,
  challenge?: string,
  redirectUri?: string,
  name?: string,
) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "sso_auth_context",
      JSON.stringify({ callBack, challenge, redirectUri, name }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60, // 30 minutes
      },
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to save auth context:", error);
    return { success: false };
  }
};

export const redirectToSourceSSO = async (
  callBack?: string,
  challenge?: string,
  redirectUri?: string,
  name?: string,
) => {
  const cookieStore = await cookies();
  cookieStore.set(
    "sso_auth_context",
    JSON.stringify({ callBack, challenge, redirectUri, name }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // 30 minutes
    },
  );

  const sourceUrl =
    process.env.SOURCE_SSO_LOGIN_URL || "https://sbsexam.edu.in/user-login";
  redirect(sourceUrl);
};

export const clearSessionAction = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sso_session");
    cookieStore.delete("sso_auth_context");
    return { success: true };
  } catch (error) {
    console.error("Clear session error:", error);
    return { success: false };
  }
};
