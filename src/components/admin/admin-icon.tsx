import type { CSSProperties } from "react";

export type AdminIconName = "home" | "users" | "faculty" | "calendar" | "tasks" | "inventory" | "shield" | "logs" | "report" | "bell" | "user" | "logout" | "search" | "plus" | "edit" | "trash" | "chevron" | "menu" | "close";

const paths: Record<AdminIconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></>,
  users: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 5 5v2" /></>,
  faculty: <><circle cx="12" cy="7" r="3" /><path d="M6 21v-3a6 6 0 0 1 12 0v3M5 5a3 3 0 0 0 0 6M19 5a3 3 0 0 1 0 6M2 18a5 5 0 0 1 3-5M22 18a5 5 0 0 0-3-5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 11h18" /></>,
  tasks: <><path d="M21 12v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11" /><path d="m8 11 4 4L22 4" /></>,
  inventory: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v18M16 3v18M3 11h18M12 15v2" /></>,
  shield: <><path d="m12 3 9 4v5c0 5-9 9-9 9s-9-4-9-9V7Z" /><path d="m8 12 3 3 5-6" /></>,
  logs: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  report: <><path d="M14 3H5v18h14V8Z" /><path d="M14 3v5h5M8 12h2M8 16h2M14 12h2M14 16h2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  user: <><circle cx="12" cy="6" r="3" /><path d="M4 21v-3a8 6 0 0 1 16 0v3Z" /></>,
  logout: <><path d="M10 3H3v18h7M8 12h14m-5-5 5 5-5 5" /></>,
  search: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  edit: <><path d="m16 3 5 5-12 12-6 1 1-6Z" /><path d="m13 6 5 5" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  chevron: <path d="m8 4 8 8-8 8" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};

export default function AdminIcon({ name, className, style }: { name: AdminIconName; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
