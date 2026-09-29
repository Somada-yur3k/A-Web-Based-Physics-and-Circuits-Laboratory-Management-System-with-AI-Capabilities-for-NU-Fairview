import { scheduleDraftError, type AssignedClass, type AvailabilityBlock, type RequestLaboratory, type RequestScheduleType, type ScheduleDraft } from "./room-availability";
import { requestedItemsError, type RequestedItem } from "./request-review";

export type FacultyActivityType = "LABORATORY_ACTIVITY" | "NON_LABORATORY_ACTIVITY";
export type FacultyRequestStep = "laboratory" | "activity" | "schedule-type" | "schedule" | "equipment" | "review";
export type FacultyRequestDraft = {
  laboratory: RequestLaboratory;
  activityType: FacultyActivityType | null;
  scheduleType: RequestScheduleType;
  schedule: ScheduleDraft;
  items: readonly RequestedItem[];
  notes: string;
};

export function facultyRequestSteps(activityType: FacultyActivityType | null): FacultyRequestStep[] {
  return ["laboratory", "activity", ...(activityType === "NON_LABORATORY_ACTIVITY" ? ["schedule-type" as const] : []), "schedule", "equipment", "review"];
}

export function facultyApprovalRecipient(draft: FacultyRequestDraft): "DEAN" | null {
  return draft.activityType === "NON_LABORATORY_ACTIVITY" && draft.scheduleType === "OUT_OF_SCHEDULE" ? "DEAN" : null;
}

export function facultyRequestError(draft: FacultyRequestDraft, blocks?: AvailabilityBlock[], classes?: readonly AssignedClass[]): string | null {
  if (draft.activityType !== "LABORATORY_ACTIVITY" && draft.activityType !== "NON_LABORATORY_ACTIVITY") return "Choose an activity type before submitting.";
  if (draft.scheduleType !== "ON_SCHEDULE" && draft.scheduleType !== "OUT_OF_SCHEDULE") return "Choose a valid schedule type.";
  if (draft.activityType === "LABORATORY_ACTIVITY" && draft.scheduleType !== "ON_SCHEDULE") return "Laboratory Activity must use your assigned class schedule.";
  return scheduleDraftError(draft.laboratory, draft.scheduleType, draft.schedule, blocks, classes) ?? requestedItemsError(draft.items, draft.notes, draft.laboratory);
}

export function createFacultyDemoSnapshot(draft: FacultyRequestDraft, blocks?: AvailabilityBlock[], classes?: readonly AssignedClass[]) {
  const error = facultyRequestError(draft, blocks, classes);
  if (error) throw new Error(error);
  const recipient = facultyApprovalRecipient(draft);
  return {
    ...draft,
    schedule: { ...draft.schedule },
    items: draft.items.map((item) => ({ ...item, name: item.name.trim() })),
    notes: draft.notes.trim(),
    recipient,
    status: recipient === "DEAN" ? "Pending Dean Approval" : "Awaiting Reservation",
  };
}

export type FacultyDemoSnapshot = ReturnType<typeof createFacultyDemoSnapshot>;
