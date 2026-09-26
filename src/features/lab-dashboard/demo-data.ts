import type { LabIconName } from "@/components/dashboard/lab-icon";
import type { DashboardRole } from "./config";

export type DashboardRequest = {
  reference: string; date: string; section: string; laboratory: string;
  type: string; status: "Pending" | "Approved" | "For Review";
};
export type DashboardSnapshot = {
  title: string; description: string; asOf: string; notificationCount: number;
  stats: { label: string; value: number; icon: LabIconName; tone: "blue" | "amber" | "green" }[];
  schedule: { date: string; time: string; section: string; laboratory: string }[];
  requests: DashboardRequest[];
};

const shared = { asOf: "2026-03-07", notificationCount: 3 };
export const dashboardSnapshots: Record<Exclude<DashboardRole, "dean">, DashboardSnapshot> = {
  faculty: {
    ...shared,
    title: "Circuits Laboratory Faculty Dashboard",
    description: "Manage your Circuits laboratory schedule, service requests, and section activities.",
    stats: [
      { label: "Assigned Sections", value: 4, icon: "faculty", tone: "blue" },
      { label: "Pending Requests", value: 3, icon: "clock", tone: "amber" },
      { label: "Approved Sessions", value: 11, icon: "check-circle", tone: "green" },
    ],
    schedule: [
      { date: "2026-03-09", time: "8:00 AM – 11:00 AM", section: "BSIT 2A", laboratory: "Circuits Lab" },
      { date: "2026-03-11", time: "1:00 PM – 4:00 PM", section: "BSCS 2B", laboratory: "Circuits Lab" },
      { date: "2026-03-13", time: "8:00 AM – 11:00 AM", section: "BSIT 3A", laboratory: "Circuits Lab" },
    ],
    requests: [
      { reference: "LR-2026-015", date: "2026-03-06", section: "BSIT 2A", laboratory: "Circuits Lab", type: "On-schedule", status: "Pending" },
      { reference: "LR-2026-014", date: "2026-03-04", section: "BSCS 2B", laboratory: "Circuits Lab", type: "On-schedule", status: "Approved" },
      { reference: "LR-2026-013", date: "2026-03-02", section: "BSIT 3A", laboratory: "Circuits Lab", type: "Out-of-schedule", status: "For Review" },
      { reference: "LR-2026-012", date: "2026-03-01", section: "BSIT 2A", laboratory: "Circuits Lab", type: "Out-of-schedule", status: "Approved" },
    ],
  },
  classrep: {
    ...shared,
    title: "Circuits Laboratory Representative Dashboard",
    description: "Manage your Circuits laboratory reservations and monitor request progress.",
    stats: [
      { label: "Total Reservations", value: 12, icon: "calendar-plus", tone: "blue" },
      { label: "Pending Approval", value: 3, icon: "clock", tone: "amber" },
      { label: "Approved Reservations", value: 9, icon: "check-circle", tone: "green" },
    ],
    schedule: [
      { date: "2026-03-09", time: "8:00 AM – 11:00 AM", section: "BSIT 2A", laboratory: "Circuits Lab" },
      { date: "2026-03-12", time: "1:00 PM – 4:00 PM", section: "BSIT 2A", laboratory: "Circuits Lab" },
      { date: "2026-03-14", time: "8:00 AM – 11:00 AM", section: "BSIT 2A", laboratory: "Circuits Lab" },
    ],
    requests: [
      { reference: "CIR-2026-012", date: "2026-03-07", section: "BSIT 2A", laboratory: "Circuits Lab", type: "Group", status: "Pending" },
      { reference: "CIR-2026-011", date: "2026-03-05", section: "BSIT 2A", laboratory: "Circuits Lab", type: "Student Only", status: "Approved" },
      { reference: "CIR-2026-010", date: "2026-03-03", section: "BSIT 2A", laboratory: "Circuits Lab", type: "Group", status: "Approved" },
      { reference: "CIR-2026-009", date: "2026-03-01", section: "BSIT 2A", laboratory: "Circuits Lab", type: "Student Only", status: "Approved" },
    ],
  },
};

export function formatDashboardDate(date: string, long = false) {
  return new Intl.DateTimeFormat("en-US", { ...(long ? { weekday: "long" as const, month: "long" as const } : { month: "short" as const }), day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
