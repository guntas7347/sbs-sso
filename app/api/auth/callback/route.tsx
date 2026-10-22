// app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  //   if (!code || !state) {
  //     return NextResponse.json(
  //       { error: "Missing callback parameters" },
  //       { status: 400 },
  //     );
  //   }

  // Validate state, exchange code for tokens,
  // establish session, then redirect.

  return NextResponse.redirect(new URL("/login-success", req.url));
}
