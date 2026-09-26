import AdminIcon, { type AdminIconName } from "@/components/admin/admin-icon";

export type LabIconName = AdminIconName | "clock" | "check-circle" | "request" | "calendar-plus" | "bolt" | "chat" | "arrow";

const extraPaths: Partial<Record<LabIconName, React.ReactNode>> = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></>,
  request: <><path d="M13 3H4v18h8M13 3v6h6l-6-6Z" /><path d="M8 12h4M8 16h2" /><circle cx="17" cy="17" r="5" /><path d="M17 14v6M14 17h6" /></>,
  "calendar-plus": <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5" /></>,
  bolt: <path d="m13 2-10 12h8l-1 8 11-13h-8Z" />,
  chat: <><path d="M21 11a9 8 0 0 1-9 8 11 11 0 0 1-4-.7L3 21l1.3-5A8 8 0 0 1 3 11a9 8 0 0 1 18 0Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="3" /></>,
  arrow: <path d="M3 12h18m-7-7 7 7-7 7" />,
};

export default function LabIcon({ name, className }: { name: LabIconName; className?: string }) {
  const extra = extraPaths[name];
  if (!extra) return <AdminIcon name={name as AdminIconName} className={className} />;
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{extra}</svg>;
}
