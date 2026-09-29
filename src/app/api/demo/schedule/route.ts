import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/features/demo-auth/session";
import { readOfficialBlocks, saveOfficialBlock } from "@/features/lab-dashboard/official-schedule-store";
import { reservationBlocks } from "@/features/demo-requests/store";
import { staffLaboratory } from "@/features/staff/store";
import { laboratoryRooms } from "@/features/lab-dashboard/room-availability";

export async function GET() {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const laboratory = staffLaboratory(user);
  const allowed = (roomId: string) => !laboratory || laboratoryRooms.find((room) => room.id === roomId)?.laboratory === laboratory;
  return NextResponse.json({ blocks: readOfficialBlocks().filter((block) => allowed(block.roomId)), reservations: reservationBlocks().filter((block) => allowed(block.roomId)) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "headlab") return NextResponse.json({ error: "Head Laboratory access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Save from this website." }, { status: 403 });
  try { return NextResponse.json({ block: saveOfficialBlock(await request.json(), undefined, reservationBlocks()) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the schedule details." }, { status: 400 }); }
}
