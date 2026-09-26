import type { DemoRequestSnapshot } from "@/features/lab-dashboard/request-review";
import type { FacultyDemoSnapshot } from "@/features/lab-dashboard/faculty-request-model";

export type RequestStatus = "Pending Dean Approval" | "Pending Faculty Approval" | "Awaiting Reservation" | "Approved" | "Rejected";
export type DemoRequestRecord = {
  reference: string;
  requester: { accountId: string; displayName: string; role: "classrep" | "faculty" };
  snapshot: DemoRequestSnapshot | FacultyDemoSnapshot;
  recipient: "DEAN" | "FACULTY" | null;
  status: RequestStatus;
  createdAt: string;
  sample: boolean;
  decision: { by: string; at: string; remarks: string } | null;
};
