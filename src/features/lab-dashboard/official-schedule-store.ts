import "server-only";
import { randomUUID } from "node:crypto";
import { initialOfficialBlocks, type OfficialBlock } from "./official-schedule-data";
import { demoAssignedClasses, laboratoryRooms, OFFICE_END, OFFICE_START, parseDate, rangesOverlap, SLOT_MINUTES, timeToMinutes, type AvailabilityBlock } from "./room-availability";

declare global { var officialDemoBlocks: Map<string, OfficialBlock> | undefined; }
const blocks = globalThis.officialDemoBlocks ??= new Map(initialOfficialBlocks.map((block) => [block.id, block]));

export function readOfficialBlocks(): OfficialBlock[] {
  return [...blocks.values()].sort((a, b) => a.roomId.localeCompare(b.roomId) || a.weekday - b.weekday || a.start - b.start).map((block) => ({ ...block }));
}

export function saveOfficialBlock(input: unknown, id?: string, reservations: readonly AvailabilityBlock[] = []): OfficialBlock {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Enter official schedule details.");
  const data = input as Record<string, unknown>;
  const existing = id ? blocks.get(id) : undefined;
  if (id && !existing) throw new Error("Official block not found.");
  if (typeof data.roomId !== "string" || !laboratoryRooms.some((room) => room.id === data.roomId)) throw new Error("Choose one of the three scheduled rooms.");
  if (existing?.assignedClassId && laboratoryRooms.find((room) => room.id === data.roomId)?.laboratory !== demoAssignedClasses.find((item) => item.id === existing.assignedClassId)?.laboratory) throw new Error("Keep this assigned class in its laboratory.");
  if (!Number.isInteger(data.weekday) || Number(data.weekday) < 1 || Number(data.weekday) > 6) throw new Error("Choose Monday through Saturday.");
  for (const field of ["title", "section", "faculty"] as const) {
    if (typeof data[field] !== "string" || !data[field].trim() || data[field].length > 100) throw new Error(`Enter a valid ${field}.`);
  }
  const start = typeof data.startTime === "string" ? timeToMinutes(data.startTime) : null;
  const end = typeof data.endTime === "string" ? timeToMinutes(data.endTime) : null;
  if (start === null || end === null || start < OFFICE_START || end > OFFICE_END || start >= end || start % SLOT_MINUTES || end % SLOT_MINUTES) throw new Error("Choose a 20-minute aligned time between 7:00 AM and 9:00 PM.");
  const weekday = Number(data.weekday), roomId = data.roomId;
  if ([...blocks.values()].some((block) => block.id !== id && block.roomId === roomId && block.weekday === weekday && rangesOverlap(start, end, block.start, block.end))) throw new Error("This block overlaps another official class in the room.");
  const sameTime = existing && existing.roomId === roomId && existing.weekday === weekday && existing.start === start && existing.end === end;
  if (!sameTime && reservations.some((block) => block.roomId === roomId && parseDate(block.date)?.getUTCDay() === weekday && rangesOverlap(start, end, block.start, block.end))) throw new Error("This official time overlaps an existing reservation block.");
  const block: OfficialBlock = { id: id ?? `official-${randomUUID()}`, roomId, weekday, start, end, kind: "laboratory", title: String(data.title).trim(), section: String(data.section).trim(), faculty: String(data.faculty).trim(), ...(existing?.assignedClassId ? { assignedClassId: existing.assignedClassId } : {}) };
  blocks.set(block.id, block);
  return { ...block };
}

export function removeOfficialBlock(id: string): boolean { return blocks.delete(id); }
