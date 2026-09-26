import ProfileMenu from "./profile-menu";
import DemoSessionMonitor from "@/components/demo-auth/session-monitor";
import { requireDemoSession } from "@/features/demo-auth/session";

export default async function PlaceholderDashboardShell({ profileHref, children }: { profileHref: string; children: React.ReactNode }) {
  const user = await requireDemoSession();
  return <DemoSessionMonitor role={user.role}><div className="placeholder-dashboard-shell"><header className="placeholder-dashboard-topbar"><p><span>Physics and Circuits </span>Laboratory Management<span> System</span></p><ProfileMenu profileHref={profileHref} displayName={user.displayName} /></header>{children}</div></DemoSessionMonitor>;
}
