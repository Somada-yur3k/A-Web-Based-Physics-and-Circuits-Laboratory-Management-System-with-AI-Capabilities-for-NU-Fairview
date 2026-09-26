"use client";

import { useState, type ReactNode } from "react";

export default function LogoutButton({ className, icon, label = "Log out", role, onLogout }: { className: string; icon: ReactNode; label?: string; role?: "menuitem"; onLogout?: () => void }) {
  const [pending, setPending] = useState(false);
  return <form action="/api/demo/logout" method="post" className="demo-logout-form" onSubmit={() => { setPending(true); onLogout?.(); }}><button type="submit" role={role} tabIndex={role ? -1 : undefined} className={`${className} demo-logout-button`} disabled={pending}>{icon}<span>{pending ? "Logging out..." : label}</span></button></form>;
}
