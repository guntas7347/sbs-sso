import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/jwt";
import crypto from "crypto";
import { sarthiGetUser } from "@/lib/sarthi";

export async function processTokenExchange(
  request: Request,
  requirePKCE: boolean,
) {
  try {
    let body: Record<string, unknown> | null = null;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload in request body" },
        { status: 400 },
      );
    }

    const { code, code_verifier } = (body || {}) as {
      code?: string;
      code_verifier?: string;
    };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Code parameter is required" },
        { status: 400 },
      );
    }

    if (requirePKCE) {
      if (!code_verifier || typeof code_verifier !== "string") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Code verifier parameter is required for S2 (PKCE) token exchange",
          },
          { status: 400 },
        );
      }
    }

    // Verify JWT authorization code
    const payload = await verifyJwtToken(code);
    if (!payload || typeof payload === "string") {
      return NextResponse.json(
        { success: false, message: "Invalid or expired authorization code" },
        { status: 400 },
      );
    }

    const { username, codeChallenge, isUnregistered, user } = payload as {
      username?: string;
      codeChallenge?: string;
      isUnregistered?: boolean;
      user?: Record<string, unknown>;
    };

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload: username missing" },
        { status: 400 },
      );
    }

    if (requirePKCE) {
      if (!codeChallenge) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This authorization code was not generated with a PKCE code challenge. Use S1 endpoint to exchange.",
          },
          { status: 400 },
        );
      }

      function generateCodeChallenge(verifier: string): string {
        return crypto
          .createHash("sha256")
          .update(verifier)
          .digest("base64url");
      }

      const codeVerify = generateCodeChallenge(code_verifier as string);

      if (codeVerify !== codeChallenge) {
        console.log("INVALID CODE VERIFIER (S2 PKCE)");
        return NextResponse.json(
          { success: false, message: "Invalid code verifier" },
          { status: 400 },
        );
      }
    }

    // Use embedded user data if available from source SSO, or fallback to sarthiGetUser
    let userData: Record<string, unknown> | null = user || null;
    if (!userData) {
      const result = await sarthiGetUser(username);
      if (result.success && result.data?.user) {
        userData = result.data.user as unknown as Record<string, unknown>;
      }
    }

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch user details",
        },
        { status: 400 },
      );
    }

    const userId =
      userData.id || userData.userId || userData.user_id || username;
    const userRole = userData.role || "user";
    const userEmail = userData.email || "";
    const fullName =
      userData.name ||
      userData.fullName ||
      userData.full_name ||
      userData.username ||
      username;

    // For unregistered child apps, return only username and userId
    if (isUnregistered) {
      return NextResponse.json({
        success: true,
        user: {
          username: userData.username || username,
          userId: String(userId),
        },
      });
    }

    const userPayload = {
      username: userData.username || username,
      email: String(userEmail),
      role: String(userRole),
      userId: String(userId),
      fullName: String(fullName),
      ...userData,
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
