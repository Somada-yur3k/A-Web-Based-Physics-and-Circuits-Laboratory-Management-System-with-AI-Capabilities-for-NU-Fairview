import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { readBorrowingSlips, readInventory, saveInventory, staffLaboratory } from "@/features/staff/store";
import { visibleRequests } from "@/features/demo-requests/store";

export async function GET() {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const laboratory = staffLaboratory(user);
  if (!laboratory) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  return NextResponse.json({ laboratory, inventory: readInventory(laboratory), slips: readBorrowingSlips(laboratory), requests: visibleRequests(user) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const laboratory = staffLaboratory(user);
  if (!laboratory) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  try { return NextResponse.json({ item: saveInventory(laboratory, await request.json()) }, { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the item details." }, { status: 400 }); }
}
