import { notFound, redirect } from "next/navigation";
import { dashboardHref, roleRouteAliases, roleSections, type DashboardRole } from "./config";

export default function BlankDashboardSection({ role, section }: { role: DashboardRole; section: string }) {
  const alias = Object.hasOwn(roleRouteAliases[role], section) ? roleRouteAliases[role][section] : undefined;
  if (alias) redirect(dashboardHref(role, alias));
  const item = roleSections[role].find(({ slug }) => slug === section);
  if (!item) notFound();
  return <main className="lab-blank-page" aria-label={item.label} />;
}
