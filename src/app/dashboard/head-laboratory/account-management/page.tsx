import AccountManagement from "@/features/accounts/account-management";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function AccountManagementPage() {
  await requireDemoRole("headlab");
  return <AccountManagement />;
}
