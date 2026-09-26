import { NextRequest, NextResponse } from "next/server";
import { authenticateDemo, createDemoSession, deleteDemoSession, DEMO_SESSION_COOKIE, DEMO_SESSION_SECONDS } from "@/features/demo-auth/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Please sign in from this website." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Please enter your Account ID and password." }, { status: 400 }); }
  const values = body as { accountId?: unknown; password?: unknown } | null;
  if (!values || typeof values.accountId !== "string" || typeof values.password !== "string" || values.accountId.length > 254 || values.password.length > 128) return NextResponse.json({ error: "Please enter your Account ID and password." }, { status: 400 });
  const user = authenticateDemo(values.accountId, values.password);
  if (!user) return NextResponse.json({ error: "Incorrect Account ID or password." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  deleteDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  const response = NextResponse.json({ redirectTo: user.dashboardPath }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(DEMO_SESSION_COOKIE, createDemoSession(user), { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: DEMO_SESSION_SECONDS });
  return response;
}
