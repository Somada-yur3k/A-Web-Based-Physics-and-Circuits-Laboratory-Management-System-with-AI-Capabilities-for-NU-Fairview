import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoDashboardPaths, type DemoRole, type DemoUser } from "./types";

export const DEMO_SESSION_COOKIE = "somada_demo_session";
export const DEMO_SESSION_SECONDS = 8 * 60 * 60;

// Deliberately public, fixed demo credentials. Replace this module with
// Supabase authentication before connecting any real accounts or data.
const demoCredentials = [
  { role: "headlab", accountId: "headlab@nu-fairview.edu.ph", password: "HeadlabDemo!2026", displayName: "Head Laboratory Demo", initials: "HL" },
  { role: "faculty", accountId: "faculty@nu-fairview.edu.ph", password: "FacultyDemo!2026", displayName: "Faculty Demo", initials: "FD" },
  { role: "classrep", accountId: "2024-1031816", password: "ClassrepDemo!2026", displayName: "Class Representative Demo", initials: "CR" },
] satisfies (Omit<DemoUser, "dashboardPath"> & { password: string })[];

type StoredSession = { accountId: string; expiresAt: number };
declare global { var somadaDemoSessions: Map<string, StoredSession> | undefined; }
const sessions = globalThis.somadaDemoSessions ??= new Map<string, StoredSession>();

function publicUser(account: typeof demoCredentials[number]): DemoUser {
  return { role: account.role, accountId: account.accountId, displayName: account.displayName, initials: account.initials, dashboardPath: demoDashboardPaths[account.role] };
}

export function authenticateDemo(accountId: string, password: string): DemoUser | null {
  const account = demoCredentials.find((item) => item.accountId === accountId.trim().toLowerCase() && item.password === password);
  return account ? publicUser(account) : null;
}

export function createDemoSession(user: DemoUser): string {
  for (const [token, session] of sessions) if (session.expiresAt <= Date.now()) sessions.delete(token);
  const token = randomBytes(32).toString("base64url");
  sessions.set(token, { accountId: user.accountId, expiresAt: Date.now() + DEMO_SESSION_SECONDS * 1000 });
  return token;
}

export function deleteDemoSession(token: string | undefined) {
  if (token) sessions.delete(token);
}

export function readDemoSession(token: string | undefined): DemoUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { sessions.delete(token); return null; }
  const account = demoCredentials.find((item) => item.accountId === session.accountId);
  return account ? publicUser(account) : null;
}

export async function getDemoSession(): Promise<DemoUser | null> {
  return readDemoSession((await cookies()).get(DEMO_SESSION_COOKIE)?.value);
}

export async function requireDemoSession(): Promise<DemoUser> {
  const user = await getDemoSession();
  if (!user) redirect("/");
  return user;
}

export async function requireDemoRole(role: DemoRole): Promise<DemoUser> {
  const user = await requireDemoSession();
  if (user.role !== role) redirect(user.dashboardPath);
  return user;
}
