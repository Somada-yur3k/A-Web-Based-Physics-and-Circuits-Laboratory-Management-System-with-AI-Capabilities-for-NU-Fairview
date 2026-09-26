import type { AdminWorkspace } from "@/components/admin/admin-shell";
import type { DemoRole } from "@/features/demo-auth/types";
export type StaffLaboratory = "physics" | "circuits";
export const staffRole = (laboratory: StaffLaboratory): DemoRole => laboratory === "physics" ? "physics-staff" : "circuits-staff";
export const laboratoryLabel = (laboratory: StaffLaboratory) => laboratory === "physics" ? "Physics Laboratory" : "Circuits Laboratory";
export const staffBasePath = (laboratory: StaffLaboratory) => `/dashboard/${laboratory}-laboratory`;
export const staffNavigation: AdminWorkspace["navigation"] = [
  { slug: "", label: "Dashboard", icon: "home" },
  { slug: "manage-inventory", label: "Manage Inventory", icon: "inventory" },
  { slug: "borrowing-slip-records", label: "Borrowing Slip Records", icon: "report" },
  { slug: "reservation-requests", label: "Reservation Requests", icon: "calendar" },
];
export function staffWorkspace(laboratory: StaffLaboratory): AdminWorkspace {
  return { basePath: staffBasePath(laboratory), label: `${laboratoryLabel(laboratory)} Staff navigation`, navigation: staffNavigation, homeSlug: "", laboratoryLabel: laboratoryLabel(laboratory) };
}
