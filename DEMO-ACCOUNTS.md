# Laboratory Management System Demo Accounts

Open [the login screen](http://localhost:3000) while the development server is running.

| Role | Account ID | Password | Dashboard |
| --- | --- | --- | --- |
| Head Laboratory / Admin | `headlab@nu-fairview.edu.ph` | `HeadlabDemo!2026` | `/dashboard/head-laboratory/account-management` |
| Faculty | `faculty@nu-fairview.edu.ph` | `FacultyDemo!2026` | `/dashboard/faculty` |
| Class Representative | `2024-1031816` | `ClassrepDemo!2026` | `/dashboard/classrep` |

Account IDs ignore capitalization and surrounding spaces. Passwords are case-sensitive.
NU Student IDs use four digits, a hyphen, and seven digits (`YYYY-NNNNNNN`), as shown in the Class Representative login above.

## Demo walkthrough

1. Enter an Account ID and its password, then select **Sign In**.
2. The system opens that role's dashboard. Opening another role's dashboard returns you to your own.
3. On Head Laboratory, try the Faculty and Class Representative tabs and create/edit forms. These update preview records only.
4. Open the user / V button at the top right, then select **Log-out** from the floating account menu. The same menu works on desktop and mobile. The system revokes the session, clears its cookie, and returns to login.
5. Reopening a dashboard after logout requires another sign-in. An already-open dashboard checks its session when focused or restored with browser Back.

## Session and data behavior

- One active demo login per browser cookie profile. Signing in as another role replaces the previous session.
- Refreshing preserves a valid login. Sessions expire after eight hours or when the local server restarts.
- Sessions use an HTTP-only cookie and a temporary in-memory server store; passwords are not saved in browser storage.
- The dashboard tables and counters are sample data. Creating an account in Account Management does **not** create a new demo login; only the three credentials above work.
- Account Management changes reset after reload, leaving that page, or logging out.
- Other sidebar pages remain blank while their screens are being designed.

No Supabase connection is used. These are public demo credentials for the local prototype, not production accounts. Replace the demo session and credential code with Supabase authentication before introducing live users or data.

## Files

- `src/features/demo-auth/session.ts`: fixed demo credentials and temporary sessions.
- `src/app/api/demo/`: sign-in, sign-out, and session endpoints.
- `src/components/demo-auth/`: shared logout button and session checks.
- `src/components/dashboard/profile-menu.tsx`: shared floating Profile and Log-out menu for every dashboard.

## Verify the demo flow

With the server running, execute:

```sh
node scripts/check-demo-auth.mjs
```

The check reads the credentials from this document and verifies login, dashboard access, role checks, session rotation, and logout for all three roles. It also checks the shared account menu, its Profile destination, and its logout form across all dashboard workspaces.
