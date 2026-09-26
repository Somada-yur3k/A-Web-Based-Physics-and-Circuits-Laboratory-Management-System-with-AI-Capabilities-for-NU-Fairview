import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { readInventory, saveInventory } from "@/features/staff/store";

export async function GET() {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "headlab") return NextResponse.json({ error: "Head Laboratory access required." }, { status: 403 });
  return NextResponse.json({ inventory: readInventory() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "headlab") return NextResponse.json({ error: "Head Laboratory access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  try {
    const input = await request.json();
    if (!input || (input.laboratory !== "physics" && input.laboratory !== "circuits")) throw new Error("Choose Physics or Circuits Laboratory.");
    return NextResponse.json({ item: saveInventory(input.laboratory, input) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the item details." }, { status: 400 }); }
}
