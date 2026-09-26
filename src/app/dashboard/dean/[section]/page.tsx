import { notFound } from "next/navigation";
import RequestQueue from "@/features/demo-requests/request-queue";
import { requireDemoRole } from "@/features/demo-auth/session";
export default async function DeanSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("dean");
  const { section } = await params;
  if (section === "request-review") return <RequestQueue mode="review" />;
  if (section === "decision-history") return <RequestQueue mode="history" />;
  notFound();
}
