"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import AdminIcon from "./admin-icon";
import { adminBasePath, adminNavigation } from "./navigation";
import ProfileMenu from "@/components/dashboard/profile-menu";
import DemoSessionMonitor from "@/components/demo-auth/session-monitor";
import type { DemoUser } from "@/features/demo-auth/types";

export type AdminWorkspace = { basePath: string; label: string; navigation: typeof adminNavigation; homeSlug: string; laboratoryLabel?: string };
const headlabWorkspace: AdminWorkspace = { basePath: adminBasePath, label: "Admin navigation", navigation: adminNavigation, homeSlug: "account-management" };
const workspaceHref = (workspace: AdminWorkspace, slug: string) => `${workspace.basePath}${slug ? `/${slug}` : ""}`;

function Sidebar({ workspace, onNavigate }: { workspace: AdminWorkspace; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <>
    <Link href={workspaceHref(workspace, workspace.homeSlug)} className="admin-brand" onClick={onNavigate} aria-label="NU Fairview dashboard">
      <img src="/icon.svg" width="84" height="84" alt="NU Fairview crest" />
      <strong>NU Fairview</strong><span>Laboratory Services</span>
    </Link>
    {workspace.laboratoryLabel && <p className="staff-scope-label">{workspace.laboratoryLabel}</p>}
    <nav aria-label={workspace.label} className="admin-nav">
      {workspace.navigation.map(({ slug, label, icon }) => { const href = workspaceHref(workspace, slug); return <Link key={slug} href={href} onClick={onNavigate} className={`admin-nav-link ${pathname === href ? "is-active" : ""}`} aria-current={pathname === href ? "page" : undefined}><AdminIcon name={icon} /><span>{label}</span></Link>; })}
    </nav>
    <div className="admin-sidebar-bottom"><div className="admin-motto">Education that<br />works.<span /></div></div>
  </>;
}

export default function AdminShell({ user, children, workspace = headlabWorkspace }: { user: DemoUser; children: React.ReactNode; workspace?: AdminWorkspace }) {
  const mobileMenu = useRef<HTMLDialogElement>(null);
  return <DemoSessionMonitor role={user.role}><div className="admin-shell">
    <aside className="admin-sidebar"><Sidebar workspace={workspace} /></aside>
    <dialog className="admin-mobile-nav" ref={mobileMenu} aria-label={workspace.label} onClick={(event) => { if (event.target === event.currentTarget) mobileMenu.current?.close(); }}>
      <button className="admin-mobile-close admin-icon-button" aria-label="Close navigation" onClick={() => mobileMenu.current?.close()}><AdminIcon name="close" /></button>
      <Sidebar workspace={workspace} onNavigate={() => mobileMenu.current?.close()} />
    </dialog>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <button className="admin-menu-button admin-icon-button" aria-label="Open navigation" onClick={() => mobileMenu.current?.showModal()}><AdminIcon name="menu" /></button>
        <p><span>Physics and Circuits </span>Laboratory Management<span> System</span></p>
        <div className="admin-topbar-actions">{user.role === "headlab" && <Link href={`${adminBasePath}/notifications`} className="admin-icon-button" aria-label="Notifications"><AdminIcon name="bell" /></Link>}<span className="admin-topbar-separator" /><ProfileMenu profileHref={`${workspace.basePath}/profile`} displayName={user.displayName} /></div>
      </header>
      {children}
    </div>
  </div></DemoSessionMonitor>;
}
