import Link from "next/link";
import PlaceholderDashboardShell from "@/components/dashboard/placeholder-dashboard-shell";
import { requireDemoSession } from "@/features/demo-auth/session";
import { demoProfilePaths } from "@/features/demo-auth/types";

const dashboards = [
  { name: "Class Representative", path: "classrep" },
  { name: "Faculty", path: "faculty" },
  { name: "Dean", path: "dean" },
  { name: "Physics Laboratory", path: "physics-laboratory" },
  { name: "Circuits Laboratory", path: "circuits-laboratory" },
  { name: "Head Laboratory", path: "head-laboratory" },
];

export default async function DashboardDirectory() {
  const user = await requireDemoSession();
  const profileHref = demoProfilePaths[user.role];
  return (
    <PlaceholderDashboardShell profileHref={profileHref}><main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm text-lab-muted">NU Fairview · Laboratory Services</p>
      <h1 className="mt-3 text-3xl font-bold">Dashboards</h1>
      <p className="mt-4 text-lab-muted">Choose a role to view its dashboard.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboards.map(({ name, path }) => (
          <Link key={path} href={`/dashboard/${path}`} className="rounded-xl border border-lab-border bg-white p-6 font-semibold transition-colors hover:border-lab-ink focus-visible:outline-2 focus-visible:outline-offset-4">{name}<span aria-hidden="true" className="ml-2">→</span></Link>
        ))}
      </div>
      <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">Back to login</Link>
    </main></PlaceholderDashboardShell>
  );
}
