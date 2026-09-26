"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { demoDashboardPaths, type DemoRole, type DemoUser } from "@/features/demo-auth/types";

export default function DemoSessionMonitor({ role, children }: { role: DemoRole; children: ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function verify() {
      try {
        const response = await fetch("/api/demo/session", { cache: "no-store", signal: controller.signal });
        const { user } = await response.json() as { user: DemoUser | null };
        if (!response.ok || !user || user.role !== role) {
          setAllowed(false);
          window.location.replace(user ? demoDashboardPaths[user.role] : "/");
        } else setAllowed(true);
      } catch { /* Keep the rendered demo visible during a temporary network outage. */ }
    }
    const onFocus = () => { void verify(); };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) { setAllowed(false); void verify(); } };
    void verify();
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); window.removeEventListener("pageshow", onPageShow); };
  }, [pathname, role]);
  return allowed ? children : <main className="demo-session-check" role="status">Checking your session...</main>;
}
