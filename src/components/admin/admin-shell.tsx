"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import AdminIcon from "./admin-icon";
import { adminBasePath, adminNavigation } from "./navigation";
import ProfileMenu from "@/components/dashboard/profile-menu";
import DemoSessionMonitor from "@/components/demo-auth/session-monitor";
import type { DemoUser } from "@/features/demo-auth/types";

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <>
    <Link href={`${adminBasePath}/account-management`} className="admin-brand" onClick={onNavigate} aria-label="NU Fairview account management">
      <img src="/icon.svg" width="84" height="84" alt="NU Fairview crest" />
      <strong>NU Fairview</strong><span>Laboratory Services</span>
    </Link>
    <nav aria-label="Admin navigation" className="admin-nav">
      {adminNavigation.map(({ slug, label, icon }) => <Link key={slug} href={`${adminBasePath}/${slug}`} onClick={onNavigate} className={`admin-nav-link ${pathname === `${adminBasePath}/${slug}` ? "is-active" : ""}`} aria-current={pathname === `${adminBasePath}/${slug}` ? "page" : undefined}><AdminIcon name={icon} /><span>{label}</span></Link>)}
    </nav>
    <div className="admin-sidebar-bottom"><div className="admin-motto">Education that<br />works.<span /></div></div>
  </>;
}

export default function AdminShell({ user, children }: { user: DemoUser; children: React.ReactNode }) {
  const mobileMenu = useRef<HTMLDialogElement>(null);
  return <DemoSessionMonitor role="headlab"><div className="admin-shell">
    <aside className="admin-sidebar"><Sidebar /></aside>
    <dialog className="admin-mobile-nav" ref={mobileMenu} aria-label="Admin navigation" onClick={(event) => { if (event.target === event.currentTarget) mobileMenu.current?.close(); }}>
      <button className="admin-mobile-close admin-icon-button" aria-label="Close navigation" onClick={() => mobileMenu.current?.close()}><AdminIcon name="close" /></button>
      <Sidebar onNavigate={() => mobileMenu.current?.close()} />
    </dialog>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <button className="admin-menu-button admin-icon-button" aria-label="Open navigation" onClick={() => mobileMenu.current?.showModal()}><AdminIcon name="menu" /></button>
        <p><span>Physics and Circuits </span>Laboratory Management<span> System</span></p>
        <div className="admin-topbar-actions"><Link href={`${adminBasePath}/notifications`} className="admin-icon-button" aria-label="Notifications"><AdminIcon name="bell" /></Link><span className="admin-topbar-separator" /><ProfileMenu profileHref={`${adminBasePath}/profile`} displayName={user.displayName} /></div>
      </header>
      {children}
    </div>
  </div></DemoSessionMonitor>;
}
