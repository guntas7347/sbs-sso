import { NextResponse } from "next/server";
import { processTokenExchange } from "@/lib/tokenExchange";

export async function POST(request: Request) {
  // S2: Secure exchange method with PKCE code_verifier
  return processTokenExchange(request, true);
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Method not allowed. Use POST with { code, code_verifier } to exchange authorization code via S2.",
    },
    { status: 405 },
  );
}
