"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import LogoutButton from "@/components/demo-auth/logout-button";
import "./profile-menu.css";

export default function ProfileMenu({ profileHref, displayName }: { profileHref: string; displayName?: string }) {
  const id = useId();
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const requestedFocus = useRef<"first" | "last">("first");
  const [open, setOpen] = useState(false);

  function items() { return Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []); }
  function positionMenu() {
    if (!trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(208, window.innerWidth - 24);
    menu.current.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))}px`;
    menu.current.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - (menu.current.offsetHeight || 108) - 12))}px`;
  }
  function closeMenu(restoreFocus = false) {
    if (menu.current?.matches(":popover-open")) menu.current.hidePopover();
    if (restoreFocus) trigger.current?.focus();
  }
  function triggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      requestedFocus.current = event.key === "ArrowUp" ? "last" : "first";
      positionMenu();
      if (!menu.current?.matches(":popover-open")) menu.current?.showPopover();
      else { const options = items(); options[requestedFocus.current === "first" ? 0 : options.length - 1]?.focus(); }
    }
  }
  function menuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { event.preventDefault(); closeMenu(true); return; }
    if (event.key === "Tab") { closeMenu(); return; }
    const options = items();
    const current = options.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === "ArrowDown") next = (current + 1) % options.length;
    else if (event.key === "ArrowUp") next = (current - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    options[next]?.focus();
  }

  useEffect(() => { if (menu.current?.matches(":popover-open")) menu.current.hidePopover(); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const dismiss = () => { if (menu.current?.matches(":popover-open")) menu.current.hidePopover(); };
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => { window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, [open]);

  return <div className="dashboard-profile-menu">
    <button ref={trigger} type="button" className="dashboard-profile-trigger" popoverTarget={id} aria-haspopup="menu" aria-controls={id} aria-expanded={open} aria-label="Open account menu" title={displayName ?? "Account menu"} onClick={() => { requestedFocus.current = "first"; positionMenu(); }} onKeyDown={triggerKey}><span className="dashboard-profile-avatar"><AdminIcon name="user" /></span><AdminIcon name="chevron" className="dashboard-profile-chevron" /></button>
    <div ref={menu} id={id} popover="auto" role="menu" className="dashboard-profile-dropdown" aria-label="Account options" onKeyDown={menuKey} onToggle={(event) => {
      const visible = (event.nativeEvent as ToggleEvent).newState === "open";
      setOpen(visible);
      if (visible) { positionMenu(); const options = items(); options[requestedFocus.current === "first" ? 0 : options.length - 1]?.focus(); }
    }}>
      <Link href={profileHref} role="menuitem" tabIndex={-1} className="dashboard-account-item" onClick={() => closeMenu()}><AdminIcon name="user" /><span>Profile</span></Link>
      <div className="dashboard-account-divider" role="separator" />
      <LogoutButton className="dashboard-account-item dashboard-account-logout" label="Log-out" role="menuitem" icon={<AdminIcon name="logout" />} />
    </div>
  </div>;
}
