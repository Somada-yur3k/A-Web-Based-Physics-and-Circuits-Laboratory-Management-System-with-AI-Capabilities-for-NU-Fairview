import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { readInventory, removeInventory, saveInventory, staffLaboratory } from "@/features/staff/store";

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const laboratory = staffLaboratory(user);
  if (!laboratory) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  const { id } = await params;
  if (!readInventory(laboratory).some((item) => item.id === id)) return NextResponse.json({ error: "Item not found in your laboratory." }, { status: 404 });
  if (remove) { removeInventory(laboratory, id); return NextResponse.json({ removed: true }); }
  try { return NextResponse.json({ item: saveInventory(laboratory, await request.json(), id) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the item details." }, { status: 400 }); }
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
