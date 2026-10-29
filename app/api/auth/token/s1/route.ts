import { NextResponse } from "next/server";
import { processTokenExchange } from "@/lib/tokenExchange";

export async function POST(request: Request) {
  // S1: Simple exchange method without code_verifier / PKCE
  return processTokenExchange(request, false);
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Method not allowed. Use POST with { code } to exchange authorization code via S1.",
    },
    { status: 405 },
  );
}
