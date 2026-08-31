import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/jwt";
import { callUserApi } from "@/lib/login";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload in request body" },
        { status: 400 },
      );
    }

    const { code, code_verifier } = body || {};
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Code parameter is required" },
        { status: 400 },
      );
    }

    if (!code_verifier || typeof code_verifier !== "string") {
      return NextResponse.json(
        { success: false, message: "Code verifier parameter is required" },
        { status: 400 },
      );
    }

    console.log("Processing SSO token exchange with code and code_verifier");

    // Verify JWT authorization code
    const payload = await verifyJwtToken(code);
    if (!payload || typeof payload === "string") {
      return NextResponse.json(
        { success: false, message: "Invalid or expired authorization code" },
        { status: 400 },
      );
    }

    const { username, codeChallenge } = payload as any;
    if (!username) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload: username missing" },
        { status: 400 },
      );
    }

    function generateCodeChallenge(verifier: string): string {
      return crypto
        .createHash("sha256")
        .update(verifier)
        .digest("base64url");
    }

    const codeVerify = generateCodeChallenge(code_verifier);

    if (codeVerify !== codeChallenge) {
      console.log("INVALID CODE VERIFIER");
      return NextResponse.json(
        { success: false, message: "Invalid code verifier" },
        { status: 400 },
      );
    }

    // Fetch user details using username
    const result = await callUserApi(username);
    if (!result.success || !result.data?.user) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to fetch user details",
        },
        { status: 400 },
      );
    }

    const userData = result.data.user;
    const userPayload = {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      userId: userData.id,
      fullName:
        ((userData.otherdata?.firstName || "") +
          " " +
          (userData.otherdata?.lastName || "")).trim() || userData.username,
    };

    console.log("SSO LOGIN TOKEN GRANTED FOR", userPayload.username);

    // Return the actual user data
    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Token verification route error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed. Use POST to exchange authorization code." },
    { status: 405 },
  );
}

