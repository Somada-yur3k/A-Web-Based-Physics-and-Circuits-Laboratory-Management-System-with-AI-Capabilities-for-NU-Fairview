export type DemoRole = "headlab" | "faculty" | "classrep" | "dean" | "physics-staff" | "circuits-staff";
export type DemoUser = { role: DemoRole; accountId: string; displayName: string; initials: string; dashboardPath: string };

export const demoDashboardPaths: Record<DemoRole, string> = {
  headlab: "/dashboard/head-laboratory/account-management",
  faculty: "/dashboard/faculty",
  classrep: "/dashboard/classrep",
  dean: "/dashboard/dean",
  "physics-staff": "/dashboard/physics-laboratory",
  "circuits-staff": "/dashboard/circuits-laboratory",
};

export const demoProfilePaths: Record<DemoRole, string> = {
  headlab: "/dashboard/head-laboratory/profile",
  faculty: "/dashboard/faculty/profile",
  classrep: "/dashboard/classrep/profile",
  dean: "/dashboard/dean/profile",
  "physics-staff": "/dashboard/physics-laboratory/profile",
  "circuits-staff": "/dashboard/circuits-laboratory/profile",
};
