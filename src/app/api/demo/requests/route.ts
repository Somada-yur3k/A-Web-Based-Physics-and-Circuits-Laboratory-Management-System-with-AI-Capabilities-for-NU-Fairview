import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { submitRequest, visibleRequests } from "@/features/demo-requests/store";

export async function GET() {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json({ requests: visibleRequests(user) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "faculty" && user.role !== "classrep") return NextResponse.json({ error: "You cannot submit requests from this account." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Submit from this website." }, { status: 403 });
  try { return NextResponse.json({ request: submitRequest(user, await request.json()) }, { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check your request details." }, { status: 400 }); }
}
