import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { removeOfficialBlock, saveOfficialBlock } from "@/features/lab-dashboard/official-schedule-store";
import { reservationBlocks } from "@/features/demo-requests/store";

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "headlab") return NextResponse.json({ error: "Head Laboratory access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  const { id } = await params;
  if (remove) return removeOfficialBlock(id) ? NextResponse.json({ removed: true }) : NextResponse.json({ error: "Official block not found." }, { status: 404 });
  try { return NextResponse.json({ block: saveOfficialBlock(await request.json(), id, reservationBlocks()) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the schedule details." }, { status: 400 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
