export type DemoRole = "headlab" | "faculty" | "classrep";
export type DemoUser = { role: DemoRole; accountId: string; displayName: string; initials: string; dashboardPath: string };

export const demoDashboardPaths: Record<DemoRole, string> = {
  headlab: "/dashboard/head-laboratory/account-management",
  faculty: "/dashboard/faculty",
  classrep: "/dashboard/classrep",
};
