import { initialOfficialBlocks, type OfficialBlock } from "./official-schedule-data";

export type RequestLaboratory = "physics" | "circuits";
export type RequestScheduleType = "ON_SCHEDULE" | "OUT_OF_SCHEDULE";
export type ScheduleDraft = { classId: string; roomId: string; requestFor: "ONE_TIME"; date: string; startTime: string; endTime: string };
export type AssignedClass = { id: string; laboratory: RequestLaboratory; roomId: string; weekday: number; start: number; end: number; label: string; code: string; section: string; faculty: string };
export type AvailabilityBlock = { id: string; roomId: string; date: string; start: number; end: number; kind: "laboratory" | "lecture" | "pending" | "approved"; title: string; section: string; faculty?: string; reference?: string; assignedClassId?: string };
export type CalendarBlock = AvailabilityBlock & { gridStart: number; gridEnd: number };

export const DEMO_SCHEDULE_DATE = "2026-03-10";
export const OFFICE_START = 7 * 60;
export const OFFICE_END = 21 * 60;
export const SLOT_MINUTES = 20;
export const laboratoryRooms = [
  { id: "circuits-301", laboratory: "circuits", label: "Circuits Laboratory" },
  { id: "physics-201", laboratory: "physics", label: "Physics 1 – Room 407" },
  { id: "physics-202", laboratory: "physics", label: "Physics 2 – Room 409" },
] as const;

// The demo's selectable assigned classes are tied to blocks in the official timetable.
export const demoAssignedClasses: AssignedClass[] = [
  { id: "circuits-electronics", laboratory: "circuits", roomId: "circuits-301", weekday: 3, start: 740, end: 1000, label: "CECLCX1L - Circuits Laboratory", code: "CECLCX1L", section: "CPE22A", faculty: "J. Apduhan" },
  { id: "circuits-analysis", laboratory: "circuits", roomId: "circuits-301", weekday: 2, start: 480, end: 720, label: "CPDSPG30 - Circuits", code: "CPDSPG30", section: "CPE33A", faculty: "J. San Luis" },
  { id: "physics-general", laboratory: "physics", roomId: "physics-201", weekday: 3, start: 1040, end: 1260, label: "ENPHYS1L - Physics 1", code: "ENPHYS1L", section: "CPE13A", faculty: "P. Teodoro" },
  { id: "physics-electricity", laboratory: "physics", roomId: "physics-202", weekday: 4, start: 860, end: 1000, label: "PSYCH01X - Physics 2", code: "PSYCH01X", section: "PSY264", faculty: "R. Mamon" },
];

export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function addDateDays(value: string, days: number): string {
  const date = parseDate(value) ?? parseDate(DEMO_SCHEDULE_DATE)!;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function weekStart(value: string): string {
  const date = parseDate(value) ?? parseDate(DEMO_SCHEDULE_DATE)!;
  return addDateDays(date.toISOString().slice(0, 10), -((date.getUTCDay() + 6) % 7));
}
export function timeToMinutes(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
export function minutesToTime(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
export function displayTime(value: number): string { return `${Math.floor(value / 60) % 12 || 12}:${String(value % 60).padStart(2, "0")} ${value < 720 ? "AM" : "PM"}`; }
export function displayDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date) : "Choose a date";
}
export function rangesOverlap(start: number, end: number, otherStart: number, otherEnd: number): boolean { return start < otherEnd && end > otherStart; }

export function classesForOfficialBlocks(official: readonly OfficialBlock[]): AssignedClass[] {
  return demoAssignedClasses.map((subject) => {
    const block = official.find((item) => item.assignedClassId === subject.id);
    return block ? { ...subject, roomId: block.roomId, weekday: block.weekday, start: block.start, end: block.end, code: block.title, label: `${block.title} - ${subject.laboratory === "circuits" ? "Circuits" : "Physics"}`, section: block.section, faculty: block.faculty ?? subject.faculty } : subject;
  });
}

export function roomBlocksForDate(roomId: string, date: string, official: readonly OfficialBlock[] = initialOfficialBlocks, reservations: readonly AvailabilityBlock[] = []): AvailabilityBlock[] {
  const weekday = parseDate(date)?.getUTCDay();
  return [...official.filter((block) => block.roomId === roomId && block.weekday === weekday).map((block) => ({ ...block, date })), ...reservations.filter((block) => block.roomId === roomId && block.date === date)].sort((a, b) => a.start - b.start);
}

// Split merged cells at reservation boundaries so an On-Schedule request remains
// visible over its official class. Exact times stay on the original block details.
export function calendarBlocks(blocks: readonly AvailabilityBlock[]): CalendarBlock[] {
  const priority = (block: AvailabilityBlock) => block.kind === "approved" ? 2 : block.kind === "pending" ? 1 : 0;
  const ordered = [...blocks].sort((a, b) => priority(b) - priority(a));
  const segments: CalendarBlock[] = [];
  for (let minutes = OFFICE_START; minutes < OFFICE_END; minutes += SLOT_MINUTES) {
    const block = ordered.find((item) => rangesOverlap(minutes, minutes + SLOT_MINUTES, item.start, item.end));
    if (!block) continue;
    const last = segments.at(-1);
    if (last?.id === block.id && last.gridEnd === minutes) last.gridEnd += SLOT_MINUTES;
    else segments.push({ ...block, gridStart: minutes, gridEnd: minutes + SLOT_MINUTES });
  }
  return segments;
}

export function createScheduleDraft(laboratory: RequestLaboratory, scheduleType: RequestScheduleType, anchorDate = DEMO_SCHEDULE_DATE, classId?: string, classes: readonly AssignedClass[] = demoAssignedClasses): ScheduleDraft {
  const subject = classes.find((item) => item.laboratory === laboratory && item.id === classId) ?? classes.find((item) => item.laboratory === laboratory)!;
  const onSchedule = scheduleType === "ON_SCHEDULE";
  return { classId: subject.id, roomId: subject.roomId, requestFor: "ONE_TIME", date: onSchedule ? addDateDays(weekStart(anchorDate), subject.weekday - 1) : parseDate(anchorDate) ? anchorDate : DEMO_SCHEDULE_DATE, startTime: onSchedule ? minutesToTime(subject.start) : "", endTime: onSchedule ? minutesToTime(subject.end) : "" };
}

export function scheduleDraftError(laboratory: RequestLaboratory, scheduleType: RequestScheduleType, draft: ScheduleDraft, blocks = roomBlocksForDate(draft.roomId, draft.date), classes: readonly AssignedClass[] = demoAssignedClasses): string | null {
  const subject = classes.find((item) => item.id === draft.classId && item.laboratory === laboratory);
  if (!subject) return "Select an assigned class for your selected laboratory.";
  if (!laboratoryRooms.some((room) => room.id === draft.roomId && room.laboratory === laboratory)) return "Choose a room in your selected laboratory.";
  if (draft.requestFor !== "ONE_TIME") return "Choose a request frequency.";
  const date = parseDate(draft.date);
  if (!date) return "Choose a valid date.";
  if (date.getUTCDay() === 0) return "Choose a day from Monday to Saturday.";
  const start = timeToMinutes(draft.startTime), end = timeToMinutes(draft.endTime);
  if (start === null || end === null) return "Choose a start and end time, or select a vacant calendar block.";
  if (start >= end) return "End time must be later than start time.";
  if (start < OFFICE_START || end > OFFICE_END) return "Choose a time within 7:00 AM–9:00 PM.";
  if (start % SLOT_MINUTES !== 0 || end % SLOT_MINUTES !== 0) return "Choose times in 20-minute intervals.";
  if (scheduleType === "ON_SCHEDULE") {
    if (draft.roomId !== subject.roomId || date.getUTCDay() !== subject.weekday || start !== subject.start || end !== subject.end) return "On-Schedule requests must use the assigned class's room, day, and regular time block.";
    if (!blocks.some((block) => block.assignedClassId === subject.id)) return "This assigned class has no official block. Contact Head Laboratory.";
  } else if (classes.some((item) => item.section === subject.section && item.weekday === date.getUTCDay() && rangesOverlap(start, end, item.start, item.end))) return "Choose a time outside your assigned class schedule.";
  const conflict = blocks.find((block) => block.roomId === draft.roomId && block.date === draft.date && rangesOverlap(start, end, block.start, block.end) && !(scheduleType === "ON_SCHEDULE" && block.kind === "laboratory" && block.assignedClassId === subject.id));
  if (conflict) return conflict.kind === "pending" || conflict.kind === "approved" ? `This time overlaps an ${conflict.kind === "pending" ? "existing pending" : "approved"} request (${conflict.reference}).` : "This time overlaps a regular class schedule in this room.";
  return null;
}
