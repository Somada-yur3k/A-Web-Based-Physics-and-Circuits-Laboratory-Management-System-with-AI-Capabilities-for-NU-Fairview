import Link from "next/link";

export default function DashboardPlaceholder({ role }: { role: string }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm text-lab-muted">NU Fairview · Laboratory Services</p>
      <h1 className="mt-3 text-3xl font-bold">{role} Dashboard</h1>
      <p className="mt-4 text-lab-muted">Your dashboard workspace is ready. The dashboard design and features will be added here.</p>
      <Link href="/dashboard" className="mt-8 inline-block rounded-lg border border-lab-border px-4 py-2 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4">All dashboards</Link>
    </main>
  );
}
