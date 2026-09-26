"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import LabIcon from "./lab-icon";
import { dashboardHref, roleNavigation, type DashboardRole } from "@/features/lab-dashboard/config";
import { dashboardSnapshots } from "@/features/lab-dashboard/demo-data";
import ProfileMenu from "./profile-menu";
import DemoSessionMonitor from "@/components/demo-auth/session-monitor";

function CampusOutline() {
  return <svg className="lab-campus-outline" viewBox="0 0 244 130" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M0 30 71 50v71H0V30Zm71 20 48-14v85H71M119 36l33-17 34 17v85h-67V36ZM186 53l58-20v88h-58V53ZM0 121h244M0 23l71 19 48-14M119 28l33-18 34 18M186 45l58-19M152 10v111M119 45l33-17 34 17M0 65l71 16M0 95l71 7" />
    {[8, 27, 46].map((x) => <g key={x}><path d={`M${x} 44v20l12 3V47ZM${x} 80v15l12 3V83Z`} /></g>)}
    {[82, 101, 132, 161, 198, 220].map((x) => <g key={x}><rect x={x} y="57" width="11" height="16" /><rect x={x} y="85" width="11" height="16" /></g>)}
  </svg>;
}

function Sidebar({ role, onNavigate }: { role: DashboardRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <>
    <Link href={dashboardHref(role, "")} className="lab-brand" onClick={onNavigate} aria-label="NU Fairview dashboard"><img src="/icon.svg" width="82" height="82" alt="NU Fairview crest" /><strong>NU Fairview</strong><span>Laboratory Services</span></Link>
    <nav className="lab-nav" aria-label={`${role === "dean" ? "Dean" : role === "faculty" ? "Faculty" : "Class Representative"} navigation`}>
      {roleNavigation[role].map(({ slug, label, icon }) => {
        const href = dashboardHref(role, slug);
        return <Link key={slug} href={href} onClick={onNavigate} className={`lab-nav-link ${pathname === href ? "is-active" : ""}`} aria-current={pathname === href ? "page" : undefined}><LabIcon name={icon} /><span>{label}</span></Link>;
      })}
    </nav>
    <div className="lab-sidebar-bottom"><div className="lab-sidebar-footer"><CampusOutline /><p>Education that<br />works.<span /></p></div></div>
  </>;
}

export default function LabDashboardShell({ role, children }: { role: DashboardRole; children: React.ReactNode }) {
  const mobileMenu = useRef<HTMLDialogElement>(null);
  return <DemoSessionMonitor role={role}><div className="lab-dashboard-shell">
    <aside className="lab-sidebar"><Sidebar role={role} /></aside>
    <dialog ref={mobileMenu} className="lab-mobile-nav" aria-label="Dashboard navigation" onClick={(event) => { if (event.target === event.currentTarget) mobileMenu.current?.close(); }}><button className="lab-mobile-close lab-icon-button" onClick={() => mobileMenu.current?.close()} aria-label="Close navigation"><LabIcon name="close" /></button><Sidebar role={role} onNavigate={() => mobileMenu.current?.close()} /></dialog>
    <div className="lab-workspace"><header className="lab-topbar"><button className="lab-menu-button lab-icon-button" aria-label="Open navigation" onClick={() => mobileMenu.current?.showModal()}><LabIcon name="menu" /></button><p><span>Physics and Circuits </span>Laboratory Management<span> System</span></p><div className="lab-topbar-actions">{role !== "dean" && <Link href={dashboardHref(role, "notifications")} className="lab-icon-button lab-topbar-notifications" aria-label={`${dashboardSnapshots[role].notificationCount} demo notifications`}><LabIcon name="bell" /><span /></Link>}<span className="lab-topbar-separator" /><ProfileMenu profileHref={dashboardHref(role, "profile")} /></div></header>{children}</div>
  </div></DemoSessionMonitor>;
}
