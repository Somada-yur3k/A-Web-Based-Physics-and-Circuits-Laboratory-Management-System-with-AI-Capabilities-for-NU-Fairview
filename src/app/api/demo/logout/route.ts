import { NextRequest, NextResponse } from "next/server";
import { deleteDemoSession, DEMO_SESSION_COOKIE } from "@/features/demo-auth/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Please log out from this website." }, { status: 403 });
  deleteDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(DEMO_SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 0 });
  return response;
}
