import { areParticipantDetailsValid, type RequestType, type StudentDetails } from "./request-participants";
import { demoAssignedClasses, scheduleDraftError, type AssignedClass, type AvailabilityBlock, type RequestLaboratory, type RequestScheduleType, type ScheduleDraft } from "./room-availability";
import { findCatalogItem } from "./equipment-catalog";

export type ApprovalRecipient = "FACULTY" | "DEAN";
export type RequestedItem = { rowId: number; catalogId?: string; kind: "Equipment" | "Material"; name: string; quantity: number };
export type ServiceRequestDraft = {
  laboratory: RequestLaboratory;
  requestType: RequestType | null;
  students: readonly StudentDetails[];
  scheduleType: RequestScheduleType;
  schedule: ScheduleDraft;
  items: readonly RequestedItem[];
  notes: string;
  approver: ApprovalRecipient | null;
};

export function requestedItemsError(items: readonly RequestedItem[], notes: string, laboratory?: RequestLaboratory): string | null {
  if (notes.length > 1000) return "Keep notes within 1,000 characters.";
  if (items.some((item) => !["Equipment", "Material"].includes(item.kind) || !item.name.trim() || item.name.length > 120 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) return "Enter an item name and a whole-number quantity from 1 to 999 for every item, or remove unused rows.";
  const selected = new Set<string>();
  for (const item of items) {
    if (item.catalogId === undefined) continue;
    const source = findCatalogItem(item.catalogId);
    if (!source || (laboratory && !source.laboratories.includes(laboratory)) || source.kind !== item.kind || source.name !== item.name) return "Select catalogue items from your chosen laboratory.";
    if (selected.has(source.id)) return "Use one quantity entry for each catalogue item.";
    selected.add(source.id);
    if (source.stock < 1 || item.quantity > source.stock) return `${source.name}: request up to ${source.stock} ${source.unit} from the sample stock, or remove this item.`;
  }
  return null;
}

export function approvalRecipient(draft: ServiceRequestDraft, classes: readonly AssignedClass[] = demoAssignedClasses): { role: ApprovalRecipient; name: string } | null {
  const subject = classes.find((item) => item.id === draft.schedule.classId && item.laboratory === draft.laboratory);
  if (!subject) return null;
  // On-Schedule always uses the selected subject's Faculty, regardless of an old Out-of-Schedule choice.
  if (draft.scheduleType === "ON_SCHEDULE" || draft.approver === "FACULTY") return { role: "FACULTY", name: subject.faculty };
  if (draft.scheduleType === "OUT_OF_SCHEDULE" && draft.approver === "DEAN") return { role: "DEAN", name: "Dean" };
  return null;
}

export function serviceRequestError(draft: ServiceRequestDraft, blocks?: AvailabilityBlock[], classes: readonly AssignedClass[] = demoAssignedClasses): string | null {
  if (!areParticipantDetailsValid(draft.requestType, draft.students)) return "Check the student names and unique NU Student IDs in Step 2.";
  if (draft.scheduleType !== "ON_SCHEDULE" && draft.scheduleType !== "OUT_OF_SCHEDULE") return "Select a schedule type in Step 3.";
  const scheduleError = scheduleDraftError(draft.laboratory, draft.scheduleType, draft.schedule, blocks, classes);
  if (scheduleError) return scheduleError;
  const itemsError = requestedItemsError(draft.items, draft.notes, draft.laboratory);
  if (itemsError) return itemsError;
  if (!approvalRecipient(draft, classes)) return "Choose Faculty or Dean for approval.";
  return null;
}

export function createDemoRequestSnapshot(draft: ServiceRequestDraft, blocks?: AvailabilityBlock[], classes: readonly AssignedClass[] = demoAssignedClasses) {
  const error = serviceRequestError(draft, blocks, classes);
  if (error) throw new Error(error);
  const recipient = approvalRecipient(draft, classes)!;
  return {
    ...draft,
    requestType: draft.requestType!,
    students: draft.students.map((student) => ({ name: student.name.trim(), studentId: student.studentId.trim() })),
    schedule: { ...draft.schedule },
    items: draft.items.map((item) => ({ ...item, name: item.name.trim() })),
    notes: draft.notes.trim(),
    approver: recipient.role,
    recipient,
  };
}

export type DemoRequestSnapshot = ReturnType<typeof createDemoRequestSnapshot>;
