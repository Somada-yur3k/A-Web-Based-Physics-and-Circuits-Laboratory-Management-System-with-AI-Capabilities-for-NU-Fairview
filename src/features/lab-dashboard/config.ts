import type { LabIconName } from "@/components/dashboard/lab-icon";

export type DashboardRole = "faculty" | "classrep" | "dean";
export type LabNavigationItem = { slug: string; label: string; icon: LabIconName };

export const roleNavigation: Record<DashboardRole, LabNavigationItem[]> = {
  dean: [
    { slug: "", label: "Dashboard", icon: "home" },
    { slug: "request-review", label: "Request Review", icon: "tasks" },
    { slug: "decision-history", label: "Decision History", icon: "report" },
  ],
  faculty: [
    { slug: "", label: "Dashboard", icon: "home" },
    { slug: "service-request", label: "Laboratory Service Request", icon: "request" },
    { slug: "request-review", label: "Request Review", icon: "tasks" },
    { slug: "lab-assistant", label: "Lab Assistant", icon: "chat" },
    { slug: "reservation-status", label: "Reservation Status", icon: "shield" },
  ],
  classrep: [
    { slug: "", label: "Dashboard", icon: "home" },
    { slug: "service-request", label: "Laboratory Service Request", icon: "request" },
    { slug: "borrowing-slips", label: "Borrowing Slip", icon: "report" },
    { slug: "clearance-status", label: "Clearance", icon: "shield" },
    { slug: "my-reservations", label: "My Reservation", icon: "logs" },
    { slug: "lab-assistant", label: "Lab Assistant", icon: "chat" },
  ],
};

// Schedule cards and the topbar bell still need destinations, even though
// Schedule and Notifications are no longer sidebar entries.
export const roleSections: Record<DashboardRole, { slug: string; label: string }[]> = {
  dean: [...roleNavigation.dean.filter(({ slug }) => slug !== ""), { slug: "profile", label: "Profile" }],
  faculty: [...roleNavigation.faculty.filter(({ slug }) => slug !== ""), { slug: "schedule", label: "Schedule" }, { slug: "notifications", label: "Notifications" }, { slug: "profile", label: "Profile" }],
  classrep: [...roleNavigation.classrep.filter(({ slug }) => slug !== ""), { slug: "schedule", label: "Schedule" }, { slug: "notifications", label: "Notifications" }, { slug: "profile", label: "Profile" }],
};

export const roleRouteAliases: Record<DashboardRole, Record<string, string>> = {
  dean: {},
  faculty: {},
  classrep: { "make-reservation": "service-request" },
};

export const dashboardBasePath = (role: DashboardRole) => `/dashboard/${role}`;
export const dashboardHref = (role: DashboardRole, slug: string) => `${dashboardBasePath(role)}${slug ? `/${slug}` : ""}`;
