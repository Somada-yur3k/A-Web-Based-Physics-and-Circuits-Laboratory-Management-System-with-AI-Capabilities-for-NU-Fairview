import "server-only";
import { randomUUID } from "node:crypto";
import type { DemoUser } from "@/features/demo-auth/types";
import { createDemoRequestSnapshot, type ServiceRequestDraft } from "@/features/lab-dashboard/request-review";
import { createFacultyDemoSnapshot, type FacultyRequestDraft } from "@/features/lab-dashboard/faculty-request-model";
import type { DemoRequestRecord } from "./types";
import { staffLaboratory } from "@/features/staff/store";

declare global { var laboratoryDemoRequests: Map<string, DemoRequestRecord> | undefined; }
const requests = globalThis.laboratoryDemoRequests ??= new Map<string, DemoRequestRecord>();

// Check JSON shape before using the shared form validators. Only accepted fields
// enter a snapshot; identities, routing, status and references are server-derived.
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request details.");
  return value as Record<string, unknown>;
}
function string(value: unknown, limit = 1000): string {
  if (typeof value !== "string" || value.length > limit) throw new Error("Invalid request text.");
  return value;
}
export function submitRequest(user: DemoUser, input: unknown): DemoRequestRecord {
  if (user.role !== "faculty" && user.role !== "classrep") throw new Error("Only Faculty and Class Representatives can submit requests.");
  if (requests.size >= 1000) throw new Error("The demo request store is full. Restart the server to reset it.");
  const body = object(input), schedule = object(body.schedule);
  if (body.laboratory !== "physics" && body.laboratory !== "circuits") throw new Error("Choose a laboratory.");
  if (body.scheduleType !== "ON_SCHEDULE" && body.scheduleType !== "OUT_OF_SCHEDULE") throw new Error("Choose a schedule type.");
  if (schedule.requestFor !== "ONE_TIME" || !Array.isArray(body.items) || body.items.length > 100) throw new Error("Invalid schedule or equipment details.");
  const common = {
    laboratory: body.laboratory, scheduleType: body.scheduleType,
    schedule: { classId: string(schedule.classId, 100), roomId: string(schedule.roomId, 100), requestFor: "ONE_TIME" as const, date: string(schedule.date, 10), startTime: string(schedule.startTime, 5), endTime: string(schedule.endTime, 5) },
    notes: string(body.notes),
    items: body.items.map((value, index) => {
      const item = object(value);
      if ((item.kind !== "Equipment" && item.kind !== "Material") || typeof item.quantity !== "number") throw new Error("Invalid equipment details.");
      return { rowId: index + 1, kind: item.kind, name: string(item.name, 120), quantity: item.quantity, ...(item.catalogId === undefined ? {} : { catalogId: string(item.catalogId, 100) }) };
    }),
  };
  let snapshot: DemoRequestRecord["snapshot"], recipient: DemoRequestRecord["recipient"];
  if (user.role === "classrep") {
    if (!Array.isArray(body.students) || body.students.length > 100 || (body.requestType !== "GROUP" && body.requestType !== "STUDENT_ONLY") || ![null, "FACULTY", "DEAN"].includes(body.approver as null | string)) throw new Error("Invalid students or approval recipient.");
    snapshot = createDemoRequestSnapshot({ ...common, requestType: body.requestType, approver: body.approver, students: body.students.map((value) => { const student = object(value); return { name: string(student.name, 120), studentId: string(student.studentId, 12) }; }) } as ServiceRequestDraft);
    recipient = snapshot.recipient.role;
  } else {
    snapshot = createFacultyDemoSnapshot({ ...common, activityType: body.activityType } as FacultyRequestDraft);
    recipient = snapshot.recipient;
  }
  const record: DemoRequestRecord = {
    reference: `DEMO-${randomUUID().toUpperCase()}`,
    requester: { accountId: user.accountId, displayName: user.displayName, role: user.role }, snapshot, recipient,
    status: recipient === "DEAN" ? "Pending Dean Approval" : recipient === "FACULTY" ? "Pending Faculty Approval" : "Awaiting Reservation",
    createdAt: new Date().toISOString(), sample: false, decision: null,
  };
  requests.set(record.reference, record);
  return structuredClone(record);
}
export function visibleRequests(user: DemoUser) {
  const laboratory = staffLaboratory(user);
  return [...requests.values()].filter((record) => laboratory ? record.snapshot.laboratory === laboratory : user.role === "dean" ? record.recipient === "DEAN" && record.snapshot.scheduleType === "OUT_OF_SCHEDULE" : record.requester.accountId === user.accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((record) => structuredClone(record));
}
export function decideRequest(user: DemoUser, reference: string, decision: "Approved" | "Rejected", remarks: string) {
  const record = requests.get(reference);
  if (!record || user.role !== "dean" || record.recipient !== "DEAN" || record.snapshot.scheduleType !== "OUT_OF_SCHEDULE") return { error: "Request not found.", status: 404 };
  if (record.status !== "Pending Dean Approval") return { error: "This request already has a decision. Refresh the queue.", status: 409 };
  if (remarks.length > 1000 || (decision === "Rejected" && !remarks.trim())) return { error: "Enter a rejection reason (up to 1,000 characters).", status: 400 };
  record.status = decision;
  record.decision = { by: user.displayName, at: new Date().toISOString(), remarks: remarks.trim() };
  return { record: structuredClone(record), status: 200 };
}

// Clearly marked examples are separate from real submissions in the demo.
if (!requests.size) {
  const schedule = { classId: "circuits-electronics", roomId: "circuits-301", requestFor: "ONE_TIME", date: "2026-03-13", startTime: "11:30", endTime: "12:30" };
  const sample = submitRequest({ role: "classrep", accountId: "sample-classrep", displayName: "Patricia Lim", initials: "PL", dashboardPath: "" }, { laboratory: "circuits", requestType: "GROUP", students: [{ name: "Patricia Lim", studentId: "2024-1031816" }, { name: "Miguel Santos", studentId: "2024-1031817" }], scheduleType: "OUT_OF_SCHEDULE", schedule, items: [], notes: "Additional time for our circuit experiment. Assigned Faculty is unavailable.", approver: "DEAN" });
  requests.get(sample.reference)!.sample = true;
  const faculty = submitRequest({ role: "faculty", accountId: "sample-faculty", displayName: "Dr. Maria Santos", initials: "MS", dashboardPath: "" }, { laboratory: "physics", activityType: "NON_LABORATORY_ACTIVITY", scheduleType: "OUT_OF_SCHEDULE", schedule: { ...schedule, classId: "physics-general", roomId: "physics-201", date: "2026-03-12", startTime: "08:00", endTime: "09:00" }, items: [], notes: "Faculty demonstration for an outreach activity." });
  requests.get(faculty.reference)!.sample = true;
}
