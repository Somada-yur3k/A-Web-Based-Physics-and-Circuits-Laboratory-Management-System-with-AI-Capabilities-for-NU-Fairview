import PlaceholderDashboardShell from "@/components/dashboard/placeholder-dashboard-shell";

export default function DeanLayout({ children }: { children: React.ReactNode }) {
  return <PlaceholderDashboardShell profileHref="/dashboard/dean/profile">{children}</PlaceholderDashboardShell>;
}
