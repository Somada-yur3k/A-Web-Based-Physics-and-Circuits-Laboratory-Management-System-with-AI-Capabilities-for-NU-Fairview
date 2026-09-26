import ProfileMenu from "./profile-menu";
import DemoSessionMonitor from "@/components/demo-auth/session-monitor";
import { requireDemoRole, requireDemoSession } from "@/features/demo-auth/session";
import type { DemoRole } from "@/features/demo-auth/types";

export default async function PlaceholderDashboardShell({ profileHref, role, children }: { profileHref: string; role?: DemoRole; children: React.ReactNode }) {
  const user = role ? await requireDemoRole(role) : await requireDemoSession();
  return <DemoSessionMonitor role={user.role}><div className="placeholder-dashboard-shell"><header className="placeholder-dashboard-topbar"><p><span>Physics and Circuits </span>Laboratory Management<span> System</span></p><ProfileMenu profileHref={profileHref} displayName={user.displayName} /></header>{children}</div></DemoSessionMonitor>;
}
