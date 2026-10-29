// app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv } from "node:crypto";
import { createSessionToken } from "@/lib/jwt";

export const runtime = "nodejs";

const AAD = "sso.sbssu.ac.in";

interface EncryptedPackage {
  iv: string;
  tag: string;
  ciphertext: string;
}

function decryptSSOData(data: string): Record<string, unknown> {
  const keyConfig = process.env.SSO_DECRYPTION_KEY;

  if (!keyConfig?.startsWith("base64:")) {
    throw new Error("Invalid SSO_DECRYPTION_KEY configuration");
  }

  // Decode the shared key.
  const key = Buffer.from(keyConfig.slice(7), "base64");

  if (key.length !== 32) {
    throw new Error("SSO key must be exactly 32 bytes");
  }

  // Decode the URL-safe Base64 container.
  const decoded = Buffer.from(data, "base64url").toString("utf8");

  const payload = JSON.parse(decoded) as EncryptedPackage;

  if (
    typeof payload.iv !== "string" ||
    typeof payload.tag !== "string" ||
    typeof payload.ciphertext !== "string"
  ) {
    throw new Error("Malformed encrypted SSO payload");
  }

  // Decode the encryption components.
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error("Invalid AES-GCM IV or authentication tag");
  }

  // AES-256-GCM authenticated decryption.
  const decipher = createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAAD(Buffer.from(AAD, "utf8"));
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  // Return the decrypted JSON object.
  return JSON.parse(decrypted.toString("utf8"));
}

async function handleCallback(req: NextRequest, dataString: string | null) {
  if (!dataString) {
    const errorUrl = new URL("/", req.url);
    errorUrl.searchParams.set("error", "Missing SSO payload data parameter");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const rawData = decryptSSOData(dataString);
    console.log("Decrypted SSO payload:", rawData);

    const userObj: Record<string, unknown> =
      rawData &&
      typeof rawData === "object" &&
      rawData.user &&
      typeof rawData.user === "object"
        ? (rawData.user as Record<string, unknown>)
        : (rawData as Record<string, unknown>);

    const username = String(
      userObj.username ||
        userObj.rollNo ||
        userObj.roll_number ||
        userObj.id ||
        userObj.userId ||
        userObj.email ||
        "user",
    );

    const name = String(
      userObj.name ||
        userObj.fullName ||
        userObj.full_name ||
        userObj.username ||
        username,
    );

    // Create 24-hour local JWT session cookie
    const sessionToken = await createSessionToken({
      username,
      name,
      user: userObj,
    });

    // Check for saved handshake context from previous request
    let contextData: {
      callBack?: string;
      challenge?: string;
      redirectUri?: string;
      name?: string;
    } = {};

    const contextCookie = req.cookies.get("sso_auth_context");
    if (contextCookie?.value) {
      try {
        contextData = JSON.parse(contextCookie.value);
      } catch (err) {
        console.warn("Failed to parse sso_auth_context cookie:", err);
      }
    }

    const callBack =
      req.nextUrl.searchParams.get("callBack") ||
      req.nextUrl.searchParams.get("callback") ||
      contextData.callBack;

    const challenge =
      req.nextUrl.searchParams.get("challenge") ||
      req.nextUrl.searchParams.get("code_challenge") ||
      contextData.challenge;

    const redirectUri =
      req.nextUrl.searchParams.get("redirect_uri") ||
      req.nextUrl.searchParams.get("redirectUri") ||
      contextData.redirectUri;

    const nameParam =
      req.nextUrl.searchParams.get("name") || contextData.name;

    // Redirect to app/page.tsx with the context parameters preserved
    const targetUrl = new URL("/", req.url);
    if (callBack) targetUrl.searchParams.set("callBack", callBack);
    if (challenge) targetUrl.searchParams.set("challenge", challenge);
    if (redirectUri) targetUrl.searchParams.set("redirect_uri", redirectUri);
    if (nameParam) targetUrl.searchParams.set("name", nameParam);
    targetUrl.searchParams.set("from_callback", "true");

    const response = NextResponse.redirect(targetUrl);

    // Persist 1-month (30-day) SSO session cookie
    response.cookies.set("sso_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days (1 month)
    });

    // Clear the temporary context cookie
    response.cookies.delete("sso_auth_context");

    return response;
  } catch (error) {
    console.error(
      "SSO decryption or callback failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    const errorUrl = new URL("/", req.url);
    errorUrl.searchParams.set(
      "error",
      "Authentication failed: Unable to verify encrypted SSO handshake.",
    );
    return NextResponse.redirect(errorUrl);
  }
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  return handleCallback(req, data);
}

export async function POST(req: NextRequest) {
  let data: string | null = null;
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      data = json?.data || null;
    } catch {
      data = null;
    }
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      data = (formData.get("data") as string) || null;
    } catch {
      data = null;
    }
  }

  if (!data) {
    data = req.nextUrl.searchParams.get("data");
  }

  return handleCallback(req, data);
}
