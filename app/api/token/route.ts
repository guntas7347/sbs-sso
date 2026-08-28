import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/jwt";
import { callUserApi } from "@/lib/login";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { code, code_verifier } = await request.json();
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code parameter is required" },
        { status: 400 },
      );
    }

    if (!code_verifier) {
      return NextResponse.json(
        { success: false, message: "Code verifier parameter is required" },
        { status: 400 },
      );
    }

    console.log(code, code_verifier);

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

    function generateCodeChallenge(codeVerifier: string): string {
      return crypto
        .createHash("sha256")
        .update(codeVerifier)
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
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 },
      );
    }

    const userPayload = {
      username: result.data.user.username,
      email: result.data.user.email,
      role: result.data.user.role,
      userId: result.data.user.id,
      fullName:
        result.data.user.otherdata.firstName +
        " " +
        result.data.user.otherdata.lastName,
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
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
