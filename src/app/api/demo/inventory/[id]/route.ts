import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { readInventory, removeInventory, saveInventory } from "@/features/staff/store";

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "headlab") return NextResponse.json({ error: "Head Laboratory access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  const { id } = await params;
  const item = readInventory().find((item) => item.id === id);
  if (!item) return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
  if (remove) { removeInventory(item.laboratory, id); return NextResponse.json({ removed: true }); }
  try { return NextResponse.json({ item: saveInventory(item.laboratory, await request.json(), id) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the item details." }, { status: 400 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
