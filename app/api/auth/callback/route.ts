// app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv } from "node:crypto";
import { createSessionToken } from "@/lib/jwt";

export const runtime = "nodejs";

const AAD = "sso.sbssu.ac.in";
const MAX_DATA_LENGTH = 100_000;
const MAX_CONTEXT_VALUE_LENGTH = 4_096;

interface EncryptedPackage {
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface SSOPayload {
  jti: string;
  exp: number;
  username: string;
  fullname: string;
  father_name: string;
  role: string;
  email: string;
  degree: string;
  specialization: string;
  mobile: string;
}

interface SSOContext {
  callBack?: string;
  challenge?: string;
  redirectUri?: string;
  name?: string;
}

function getPublicOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto");

  if (!host || !proto) {
    throw new Error("Missing forwarded host or protocol");
  }

  // Reject comma-separated values rather than guessing which proxy value
  // represents the public request.
  if (host.includes(",") || proto.includes(",") || /[\s/@\\?#]/.test(host)) {
    throw new Error("Invalid forwarded host or protocol");
  }

  if (proto !== "https" && proto !== "http") {
    throw new Error("Invalid forwarded protocol");
  }

  const url = new URL(`${proto}://${host}`);

  if (
    url.hostname.length === 0 ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid forwarded origin");
  }

  // Configure your reverse proxy to overwrite forwarded headers and
  // prevent untrusted clients from reaching the app directly.
  return url.origin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  maxLength = 1_000,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maxLength
  ) {
    throw new Error(`Invalid SSO field: ${field}`);
  }

  return value.trim();
}

function validateSSOPayload(value: unknown): SSOPayload {
  if (!isRecord(value)) {
    throw new Error("Invalid SSO payload structure");
  }

  // Support both the direct payload and a payload nested under "user".
  const user = isRecord(value.user) ? value.user : value;

  const jti = requireString(value.jti, "jti", 128);
  const exp = value.exp;

  if (typeof exp !== "number" || !Number.isSafeInteger(exp) || exp <= 0) {
    throw new Error("Invalid SSO expiration");
  }

  // exp is Unix time in seconds.
  if (exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("SSO payload has expired");
  }

  const username = requireString(
    user.username ?? user.rollNo ?? user.roll_number ?? user.id ?? user.userId,
    "username",
    256,
  );

  const fullname = requireString(
    user.fullname ?? user.fullName ?? user.full_name ?? user.name ?? username,
    "fullname",
    256,
  );

  const fatherName =
    typeof user.father_name === "string" ? user.father_name : "";

  const email = typeof user.email === "string" ? user.email : "";

  const role = requireString(user.role, "role", 128);

  return {
    jti,
    exp,
    username,
    fullname,
    father_name: fatherName,
    role,
    email,
    degree: typeof user.degree === "string" ? user.degree : "",
    specialization:
      typeof user.specialization === "string" ? user.specialization : "",
    mobile: typeof user.mobile === "string" ? user.mobile : "",
  };
}

function decryptSSOData(data: string): SSOPayload {
  if (!data || data.length > MAX_DATA_LENGTH) {
    throw new Error("Invalid SSO payload size");
  }

  const keyConfig = process.env.SSO_DECRYPTION_KEY;

  if (!keyConfig?.startsWith("base64:")) {
    throw new Error("Invalid SSO_DECRYPTION_KEY configuration");
  }

  const key = Buffer.from(keyConfig.slice("base64:".length), "base64");

  if (key.length !== 32) {
    throw new Error("SSO key must be exactly 32 bytes");
  }

  let encryptedPackage: unknown;

  try {
    const decoded = Buffer.from(data, "base64url").toString("utf8");
    encryptedPackage = JSON.parse(decoded);
  } catch {
    throw new Error("Malformed encrypted SSO package");
  }

  if (!isRecord(encryptedPackage)) {
    throw new Error("Invalid encrypted SSO package");
  }

  const payload = encryptedPackage as unknown as EncryptedPackage;

  if (
    typeof payload.iv !== "string" ||
    typeof payload.tag !== "string" ||
    typeof payload.ciphertext !== "string"
  ) {
    throw new Error("Missing encrypted SSO components");
  }

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Invalid AES-GCM encrypted components");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAAD(Buffer.from(AAD, "utf8"));
  decipher.setAuthTag(tag);

  // decipher.final() throws if authentication fails or the data was altered.
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(decrypted);
  } catch {
    throw new Error("Decrypted SSO payload is not valid JSON");
  }

  return validateSSOPayload(rawPayload);
}

function readContextCookie(req: NextRequest): SSOContext {
  const value = req.cookies.get("sso_auth_context")?.value;

  if (!value || value.length > MAX_CONTEXT_VALUE_LENGTH) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!isRecord(parsed)) {
      return {};
    }

    const readOptional = (value: unknown): string | undefined =>
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= MAX_CONTEXT_VALUE_LENGTH
        ? value
        : undefined;

    return {
      callBack: readOptional(parsed.callBack),
      challenge: readOptional(parsed.challenge),
      redirectUri: readOptional(parsed.redirectUri),
      name: readOptional(parsed.name),
    };
  } catch {
    return {};
  }
}

function getContextValue(
  req: NextRequest,
  queryNames: string[],
  cookieValue?: string,
): string | undefined {
  for (const name of queryNames) {
    const value = req.nextUrl.searchParams.get(name);

    if (value && value.length <= MAX_CONTEXT_VALUE_LENGTH) {
      return value;
    }
  }

  return cookieValue;
}

function errorResponse(
  req: NextRequest,
  message: string,
  status = 400,
): NextResponse {
  try {
    const url = new URL("/", getPublicOrigin(req));
    url.searchParams.set("error", message);

    return NextResponse.redirect(url, { status: 303 });
  } catch {
    // Do not fall back to req.url: it may contain an internal Docker hostname.
    return NextResponse.json({ error: message }, { status });
  }
}

async function handleCallback(
  req: NextRequest,
  data: string | null,
): Promise<NextResponse> {
  if (!data || typeof data !== "string") {
    return errorResponse(req, "Missing SSO payload data parameter");
  }

  let publicOrigin: string;

  try {
    publicOrigin = getPublicOrigin(req);
  } catch (error) {
    console.error(
      "SSO public-origin error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to determine the public request origin" },
      { status: 400 },
    );
  }

  try {
    const payload = decryptSSOData(data);

    /*
     * REPLAY PROTECTION:
     * Before creating a session, atomically check and consume payload.jti
     * in a shared Redis/database store, with a TTL until payload.exp.
     *
     * Do not use an in-memory Set in production when multiple processes or
     * containers can handle requests.
     */

    const username = payload.username;
    const name = payload.fullname;

    const sessionToken = await createSessionToken({
      username,
      name,
      user: payload,
    });

    const contextData = readContextCookie(req);

    const callBack = getContextValue(
      req,
      ["callBack", "callback"],
      contextData.callBack,
    );

    const challenge = getContextValue(
      req,
      ["challenge", "code_challenge"],
      contextData.challenge,
    );

    const redirectUri = getContextValue(
      req,
      ["redirect_uri", "redirectUri"],
      contextData.redirectUri,
    );

    const nameParam = getContextValue(req, ["name"], contextData.name);

    const targetUrl = new URL("/", publicOrigin);

    if (callBack) {
      targetUrl.searchParams.set("callBack", callBack);
    }

    if (challenge) {
      targetUrl.searchParams.set("challenge", challenge);
    }

    if (redirectUri) {
      targetUrl.searchParams.set("redirect_uri", redirectUri);
    }

    if (nameParam) {
      targetUrl.searchParams.set("name", nameParam);
    }

    targetUrl.searchParams.set("from_callback", "true");

    const response = NextResponse.redirect(targetUrl, { status: 303 });

    response.cookies.set("sso_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.delete("sso_auth_context");

    return response;
  } catch (error) {
    console.error(
      "SSO callback failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    const url = new URL("/", publicOrigin);
    url.searchParams.set(
      "error",
      "Authentication failed. The SSO payload could not be verified.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleCallback(req, req.nextUrl.searchParams.get("data"));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let data: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body: unknown = await req.json();

      if (isRecord(body) && typeof body.data === "string") {
        data = body.data;
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      const value = formData.get("data");

      if (typeof value === "string") {
        data = value;
      }
    }
  } catch {
    // Fall back to the query parameter if the request body is malformed.
  }

  if (!data) {
    data = req.nextUrl.searchParams.get("data");
  }

  return handleCallback(req, data);
}
