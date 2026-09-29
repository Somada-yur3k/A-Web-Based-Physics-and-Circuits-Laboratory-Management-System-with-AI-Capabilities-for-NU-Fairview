import type { AdminIconName } from "./admin-icon";

export const adminBasePath = "/dashboard/head-laboratory";
export const adminNavigation: { slug: string; label: string; icon: AdminIconName }[] = [
  { slug: "overview", label: "Dashboard", icon: "home" },
  { slug: "account-management", label: "Account Management", icon: "users" },
  { slug: "faculty-management", label: "Faculty Management", icon: "faculty" },
  { slug: "classrep-management", label: "Class Representative Management", icon: "users" },
  { slug: "schedule-management", label: "Schedule Management", icon: "calendar" },
  { slug: "daily-tasks", label: "Daily Tasks", icon: "tasks" },
  { slug: "inventory-overview", label: "Inventory Overview", icon: "inventory" },
  { slug: "reservation-requests", label: "Reservation Requests", icon: "calendar" },
  { slug: "clearance-management", label: "Clearance Management", icon: "shield" },
  { slug: "circuits-logs", label: "Circuit Laboratory Logs", icon: "logs" },
  { slug: "physics-logs", label: "Physics Laboratory Logs", icon: "report" },
  { slug: "end-term-report", label: "Lab End-Term Report", icon: "calendar" },
  { slug: "notifications", label: "Notifications", icon: "bell" },
];

export const adminSections = [...adminNavigation, { slug: "profile", label: "Profile", icon: "user" as const }];
