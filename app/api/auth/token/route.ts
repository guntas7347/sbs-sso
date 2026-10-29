import { NextResponse } from "next/server";
import { processTokenExchange } from "@/lib/tokenExchange";

export async function POST(request: Request) {
  // Clone request to check if code_verifier is provided
  try {
    const clone = request.clone();
    const body = (await clone.json().catch(() => ({}))) as {
      code_verifier?: string;
    };
    const hasVerifier = Boolean(
      body?.code_verifier && typeof body.code_verifier === "string",
    );
    return processTokenExchange(request, hasVerifier);
  } catch {
    return processTokenExchange(request, false);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Method not allowed. Use POST to exchange authorization code. S1: /api/auth/token/s1, S2 (PKCE): /api/auth/token/s2",
    },
    { status: 405 },
  );
}
