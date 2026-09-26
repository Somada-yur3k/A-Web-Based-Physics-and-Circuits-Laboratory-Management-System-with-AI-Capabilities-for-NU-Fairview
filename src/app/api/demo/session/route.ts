import { NextRequest, NextResponse } from "next/server";
import { readDemoSession, DEMO_SESSION_COOKIE } from "@/features/demo-auth/session";

export async function GET(request: NextRequest) {
  const user = readDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  return NextResponse.json({ user }, { status: user ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}
