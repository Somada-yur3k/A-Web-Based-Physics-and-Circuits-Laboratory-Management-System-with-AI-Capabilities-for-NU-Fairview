import { demoRequestClass } from "./request-participants";

export type RequestLaboratory = "physics" | "circuits";
export type RequestScheduleType = "ON_SCHEDULE" | "OUT_OF_SCHEDULE";
export type ScheduleDraft = { classId: string; roomId: string; requestFor: "ONE_TIME"; date: string; startTime: string; endTime: string };
export type AssignedClass = { id: string; laboratory: RequestLaboratory; roomId: string; weekday: number; start: number; end: number; label: string; code: string; section: string; faculty: string };
export type AvailabilityBlock = { id: string; roomId: string; date: string; start: number; end: number; kind: "laboratory" | "lecture" | "pending" | "approved"; title: string; section: string; faculty?: string; reference?: string; assignedClassId?: string };

export const DEMO_SCHEDULE_DATE = "2026-03-10";
export const OFFICE_START = 7 * 60;
export const OFFICE_END = 17 * 60;
export const SLOT_MINUTES = 30;
export const laboratoryRooms = [
  { id: "circuits-301", laboratory: "circuits", label: "Circuits Lab Room 301" },
  { id: "circuits-302", laboratory: "circuits", label: "Circuits Lab Room 302" },
  { id: "physics-201", laboratory: "physics", label: "Physics Lab Room 201" },
  { id: "physics-202", laboratory: "physics", label: "Physics Lab Room 202" },
] as const;

export const demoAssignedClasses: AssignedClass[] = [
  { id: "circuits-electronics", laboratory: "circuits", roomId: "circuits-301", weekday: 2, start: 13 * 60, end: 16 * 60, label: "ECE 28 - Circuits and Electronics 2", code: "ECE 28", section: demoRequestClass.section, faculty: "G. Pulgar" },
  { id: "circuits-analysis", laboratory: "circuits", roomId: "circuits-302", weekday: 3, start: 8 * 60, end: 11 * 60, label: "ECE 21 - Circuit Analysis", code: "ECE 21", section: demoRequestClass.section, faculty: "M. Ordonez" },
  { id: "physics-general", laboratory: "physics", roomId: "physics-201", weekday: 1, start: 8 * 60, end: 11 * 60, label: "PHYS 101 - General Physics", code: "PHYS 101", section: demoRequestClass.section, faculty: "R. Bautista" },
  { id: "physics-electricity", laboratory: "physics", roomId: "physics-202", weekday: 4, start: 13 * 60, end: 16 * 60, label: "PHYS 102 - Electricity and Magnetism", code: "PHYS 102", section: demoRequestClass.section, faculty: "C. Macalisang" },
];

type RegularBlock = Omit<AvailabilityBlock, "date"> & { weekday: number };
// Weekly regular schedules and dated requests are separate sample records.
const regularBlocks: RegularBlock[] = [
  ...demoAssignedClasses.map((subject) => ({ id: `regular-${subject.id}`, assignedClassId: subject.id, roomId: subject.roomId, weekday: subject.weekday, start: subject.start, end: subject.end, kind: "laboratory" as const, title: subject.code, section: subject.section, faculty: subject.faculty })),
  { id: "c301-mon-lab", roomId: "circuits-301", weekday: 1, start: 480, end: 600, kind: "laboratory", title: "ENPHYS1L", section: "CE231", faculty: "R. Bautista" },
  { id: "c301-mon-lab2", roomId: "circuits-301", weekday: 1, start: 630, end: 720, kind: "laboratory", title: "ENSC121L", section: "ME211", faculty: "L. Ordonez" },
  { id: "c301-mon-lecture", roomId: "circuits-301", weekday: 1, start: 780, end: 900, kind: "lecture", title: "ENICAL30", section: "CE254", faculty: "C. Macalisang" },
  { id: "c301-tue-lecture", roomId: "circuits-301", weekday: 2, start: 480, end: 600, kind: "lecture", title: "ENTIT13D", section: "CE518", faculty: "G. Pulgar" },
  { id: "c301-wed-lab", roomId: "circuits-301", weekday: 3, start: 540, end: 660, kind: "laboratory", title: "ENPHYS1L", section: "CE251", faculty: "C. Macalisang" },
  { id: "c301-wed-lab2", roomId: "circuits-301", weekday: 3, start: 780, end: 870, kind: "laboratory", title: "ENSC121L", section: "ME212", faculty: "L. Ordonez" },
  { id: "c301-thu-lecture", roomId: "circuits-301", weekday: 4, start: 480, end: 600, kind: "lecture", title: "ENTIT13D", section: "CE518", faculty: "G. Pulgar" },
  { id: "c301-thu-lecture2", roomId: "circuits-301", weekday: 4, start: 630, end: 720, kind: "lecture", title: "ENICAL30", section: "CE254", faculty: "C. Macalisang" },
  { id: "c301-fri-lab", roomId: "circuits-301", weekday: 5, start: 480, end: 600, kind: "laboratory", title: "ENPHYS1L", section: "CE224", faculty: "R. Bautista" },
  { id: "c301-fri-lab2", roomId: "circuits-301", weekday: 5, start: 780, end: 960, kind: "laboratory", title: "ENPHYS1L", section: "CE252", faculty: "L. Ordonez" },
  { id: "c302-mon-lab", roomId: "circuits-302", weekday: 1, start: 780, end: 960, kind: "laboratory", title: "ECE201L", section: "ECE203", faculty: "M. Lopez" },
  { id: "c302-thu-lecture", roomId: "circuits-302", weekday: 4, start: 600, end: 720, kind: "lecture", title: "MATH222", section: "BSCS 2B", faculty: "A. Reyes" },
  { id: "c302-sat-lab", roomId: "circuits-302", weekday: 6, start: 480, end: 600, kind: "laboratory", title: "ECE201L", section: "BSIT 3A", faculty: "M. Lopez" },
  { id: "p201-tue-lab", roomId: "physics-201", weekday: 2, start: 540, end: 720, kind: "laboratory", title: "ENPHYS1L", section: "CE211", faculty: "R. Bautista" },
  { id: "p201-wed-lab", roomId: "physics-201", weekday: 3, start: 780, end: 960, kind: "laboratory", title: "PHYS101L", section: "BSCS 2B", faculty: "C. Macalisang" },
  { id: "p201-fri-lecture", roomId: "physics-201", weekday: 5, start: 480, end: 600, kind: "lecture", title: "PHYS101", section: "BSIT 3A", faculty: "R. Bautista" },
  { id: "p202-tue-lecture", roomId: "physics-202", weekday: 2, start: 480, end: 600, kind: "lecture", title: "ENPHYS", section: "BSIT 3B", faculty: "C. Macalisang" },
  { id: "p202-wed-lab", roomId: "physics-202", weekday: 3, start: 600, end: 720, kind: "laboratory", title: "ENPHYS1L", section: "CE211", faculty: "R. Bautista" },
];

export const demoOtherRequests: AvailabilityBlock[] = [
  { id: "cir-pending-019", roomId: "circuits-301", date: "2026-03-14", start: 540, end: 660, kind: "pending", title: "Pending request", section: "IT241", reference: "CIR-2026-019" },
  { id: "cir-approved-018", roomId: "circuits-301", date: "2026-03-13", start: 600, end: 690, kind: "approved", title: "Approved request", section: "BSCS 2B", reference: "CIR-2026-018" },
  { id: "cir-pending-020", roomId: "circuits-302", date: "2026-03-11", start: 840, end: 960, kind: "pending", title: "Pending request", section: "ECE204", reference: "CIR-2026-020" },
  { id: "cir-pending-021", roomId: "circuits-301", date: "2026-03-19", start: 840, end: 960, kind: "pending", title: "Pending request", section: "ECE202", reference: "CIR-2026-021" },
  { id: "cir-approved-022", roomId: "circuits-302", date: "2026-03-17", start: 480, end: 600, kind: "approved", title: "Approved request", section: "IT242", reference: "CIR-2026-022" },
  { id: "phy-pending-012", roomId: "physics-201", date: "2026-03-13", start: 600, end: 720, kind: "pending", title: "Pending request", section: "BSIT 3B", reference: "PHY-2026-012" },
  { id: "phy-approved-011", roomId: "physics-201", date: "2026-03-14", start: 780, end: 900, kind: "approved", title: "Approved request", section: "BSCS 2B", reference: "PHY-2026-011" },
  { id: "phy-pending-013", roomId: "physics-202", date: "2026-03-14", start: 540, end: 660, kind: "pending", title: "Pending request", section: "CE212", reference: "PHY-2026-013" },
  { id: "phy-pending-014", roomId: "physics-202", date: "2026-03-20", start: 780, end: 900, kind: "pending", title: "Pending request", section: "BSIT 3A", reference: "PHY-2026-014" },
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

export function roomBlocksForDate(roomId: string, date: string): AvailabilityBlock[] {
  const weekday = parseDate(date)?.getUTCDay();
  return [...regularBlocks.filter((block) => block.roomId === roomId && block.weekday === weekday).map((block) => ({ ...block, date })), ...demoOtherRequests.filter((block) => block.roomId === roomId && block.date === date)].sort((a, b) => a.start - b.start);
}

export function createScheduleDraft(laboratory: RequestLaboratory, scheduleType: RequestScheduleType, anchorDate = DEMO_SCHEDULE_DATE, classId?: string): ScheduleDraft {
  const subject = demoAssignedClasses.find((item) => item.laboratory === laboratory && item.id === classId) ?? demoAssignedClasses.find((item) => item.laboratory === laboratory)!;
  const onSchedule = scheduleType === "ON_SCHEDULE";
  return { classId: subject.id, roomId: subject.roomId, requestFor: "ONE_TIME", date: onSchedule ? addDateDays(weekStart(anchorDate), subject.weekday - 1) : parseDate(anchorDate) ? anchorDate : DEMO_SCHEDULE_DATE, startTime: onSchedule ? minutesToTime(subject.start) : "", endTime: onSchedule ? minutesToTime(subject.end) : "" };
}

export function scheduleDraftError(laboratory: RequestLaboratory, scheduleType: RequestScheduleType, draft: ScheduleDraft, blocks = roomBlocksForDate(draft.roomId, draft.date)): string | null {
  const subject = demoAssignedClasses.find((item) => item.id === draft.classId && item.laboratory === laboratory);
  if (!subject) return "Select an assigned class for your selected laboratory.";
  if (!laboratoryRooms.some((room) => room.id === draft.roomId && room.laboratory === laboratory)) return "Choose a room in your selected laboratory.";
  if (draft.requestFor !== "ONE_TIME") return "Choose a request frequency.";
  const date = parseDate(draft.date);
  if (!date) return "Choose a valid date.";
  if (date.getUTCDay() === 0) return "Choose a day from Monday to Saturday.";
  const start = timeToMinutes(draft.startTime), end = timeToMinutes(draft.endTime);
  if (start === null || end === null) return "Choose a start and end time, or select a vacant calendar block.";
  if (start >= end) return "End time must be later than start time.";
  if (start < OFFICE_START || end > OFFICE_END) return "Choose a time within 7:00 AM–5:00 PM.";
  if (start % SLOT_MINUTES !== 0 || end % SLOT_MINUTES !== 0) return "Choose times in 30-minute intervals.";
  if (scheduleType === "ON_SCHEDULE") {
    if (draft.roomId !== subject.roomId || date.getUTCDay() !== subject.weekday || start !== subject.start || end !== subject.end) return "On-Schedule requests must use the assigned class's room, day, and regular time block.";
  } else if (demoAssignedClasses.some((item) => item.section === subject.section && item.weekday === date.getUTCDay() && rangesOverlap(start, end, item.start, item.end))) return "Choose a time outside your assigned class schedule.";
  const conflict = blocks.find((block) => block.roomId === draft.roomId && block.date === draft.date && rangesOverlap(start, end, block.start, block.end) && !(scheduleType === "ON_SCHEDULE" && block.kind === "laboratory" && block.assignedClassId === subject.id));
  if (conflict) return conflict.kind === "pending" || conflict.kind === "approved" ? `This time overlaps an ${conflict.kind === "pending" ? "existing pending" : "approved"} request (${conflict.reference}).` : "This time overlaps a regular class schedule in this room.";
  return null;
}
