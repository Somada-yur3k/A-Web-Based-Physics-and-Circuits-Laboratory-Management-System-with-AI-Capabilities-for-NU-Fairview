import { notFound } from "next/navigation";
import { adminSections } from "@/components/admin/navigation";
import { requireDemoRole } from "@/features/demo-auth/session";

export function generateStaticParams() {
  return adminSections.filter(({ slug }) => slug !== "account-management").map(({ slug }) => ({ section: slug }));
}

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("headlab");
  const { section } = await params;
  const item = adminSections.find(({ slug }) => slug === section && slug !== "account-management");
  if (!item) notFound();
  return <main className="admin-blank-page" aria-label={item.label} />;
}
