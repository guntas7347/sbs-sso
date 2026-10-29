import { NextResponse } from "next/server";

function forward(req: Request) {
  const url = new URL("/api/auth/callback", req.url);
  url.search = new URL(req.url).search;

  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  return forward(req);
}

export async function POST(req: Request) {
  return forward(req);
}
