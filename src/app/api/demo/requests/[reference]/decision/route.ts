import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { decideRequest } from "@/features/demo-requests/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "dean") return NextResponse.json({ error: "Only the Dean can make this decision." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Submit from this website." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid decision." }, { status: 400 }); }
  if (!body || !["Approved", "Rejected"].includes(body.decision) || typeof body.remarks !== "string") return NextResponse.json({ error: "Choose Approve or Reject and enter valid remarks." }, { status: 400 });
  const result = decideRequest(user, (await params).reference, body.decision, body.remarks);
  return NextResponse.json(result, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
