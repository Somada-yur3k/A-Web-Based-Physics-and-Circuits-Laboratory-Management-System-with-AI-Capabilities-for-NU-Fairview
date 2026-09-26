# Laboratory Management System Demo Accounts

Open [the login screen](http://localhost:3000) while the development server is running.

| Role | Account ID | Password | Dashboard |
| --- | --- | --- | --- |
| Head Laboratory / Admin | `headlab@nu-fairview.edu.ph` | `HeadlabDemo!2026` | `/dashboard/head-laboratory/account-management` |
| Dean | `dean@nu-fairview.edu.ph` | `DeanDemo!2026` | `/dashboard/dean` |
| Faculty | `faculty@nu-fairview.edu.ph` | `FacultyDemo!2026` | `/dashboard/faculty` |
| Class Representative | `2024-1031816` | `ClassrepDemo!2026` | `/dashboard/classrep` |
| Physics Laboratory Staff | `physics@nu-fairview.edu.ph` | `PhysicsDemo!2026` | `/dashboard/physics-laboratory` |
| Circuits Laboratory Staff | `circuits@nu-fairview.edu.ph` | `CircuitsDemo!2026` | `/dashboard/circuits-laboratory` |

Account IDs ignore capitalization and surrounding spaces. Passwords are case-sensitive.
NU Student IDs use four digits, a hyphen, and seven digits (`YYYY-NNNNNNN`), as shown in the Class Representative login above.

Each Staff login opens its own Head Laboratory-style workspace with **Manage Inventory**, **Borrowing Slip Records**, and **Reservation Requests**. Physics Staff sees only Physics data; Circuits Staff sees only Circuits data. Each account can add/edit/delete its laboratory inventory, search borrowing records, and view submitted requests and approval status. Borrowing slips are samples; issuing items, recording returns, and room reservation processing are not connected yet. Inventory edits are temporary and do not change the request form's sample catalogue. Both Staff accounts use the shared Profile / Log-out menu. Other role routes return to the signed-in role's dashboard; the API also enforces laboratory access.

## Demo walkthrough

1. Enter an Account ID and its password, then select **Sign In**.
2. The system opens that role's dashboard. Opening another role's dashboard returns you to your own.
3. On Head Laboratory, try the Faculty and Class Representative tabs and create/edit forms. These update preview records only.
4. Open the user / V button at the top right, then select **Log-out** from the floating account menu. The same menu works on desktop and mobile. The system revokes the session, clears its cookie, and returns to login.
5. Reopening a dashboard after logout requires another sign-in. An already-open dashboard checks its session when focused or restored with browser Back.

On Faculty, open **Laboratory Service Request**, choose Physics or Circuits, then **Laboratory Activity** or **Non-Laboratory Activity**. Laboratory Activity goes directly to the assigned Schedule & Room, Equipment & Materials, and Review without academic approval. Non-Laboratory Activity adds On-Schedule / Out-of-Schedule: On-Schedule has no academic approval; Out-of-Schedule routes to the Dean. Confirm the review to submit a locked demo receipt. Submissions are stored temporarily on the server and can be viewed in Reservation Status. Requests routed to Dean appear in the Dean queue; leaving or reloading does not clear submitted records. This does not reserve a room or send notifications. The room calendar and class assignments are sample data.

Both Faculty and Class Representative can search/filter the **Equipment & Materials** sample catalogue, add items, change quantities, remove items, and describe additional needs. Repeated Add increases the existing quantity; catalogue quantities cannot exceed sample stock. Review keeps these details and allows editing. Class Representative On-Schedule shows the assigned Faculty; Out-of-Schedule offers Faculty or Dean. Faculty On-Schedule needs no academic approval; Out-of-Schedule shows Dean automatically. Equipment and room schedules are samples. Submitted requests and Dean decisions use a temporary demo server store.

## Dean review walkthrough

1. Submit a Class Representative Out-of-Schedule request with **Dean** selected in Review, or a Faculty Non-Laboratory Activity Out-of-Schedule request.
2. Sign in as Dean (use another browser profile to keep the requester signed in).
3. Open **Request Review** and select **Review**. Check the schedule, students, requested equipment, and notes.
4. Select **Approve Request** or enter remarks and select **Reject Request**, then **Confirm Decision**.
5. See the result in **Decision History**. The requester can refresh **My Reservation** / **Reservation Status** to see the decision and remarks.

Dean sees only Out-of-Schedule requests routed to Dean. Class Representative requests routed to Faculty do not enter the Dean queue. Two clearly marked sample records are included. Approval means academic approval for later laboratory processing; it does not reserve a room or hold equipment. Requests and decisions reset on server restart.

## Session and data behavior

- One active demo login per browser cookie profile. Signing in as another role replaces the previous session.
- Refreshing preserves a valid login. Sessions expire after eight hours or when the local server restarts.
- Sessions use an HTTP-only cookie and a temporary in-memory server store; passwords are not saved in browser storage.
- The dashboard tables and counters are sample data. Creating an account in Account Management does **not** create a new demo login; only the six credentials above work.
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

The check reads the credentials from this document and verifies login, dashboard access, role checks, session rotation, and logout for all six roles. It also checks the shared account menu, its Profile destination, and its logout form across all dashboard workspaces. The optional `scripts/check-staff-accounts-browser.cjs` runs the built app in headless Edge and checks Staff sign-in, cross-laboratory restrictions, Profile links, and real menu logout on desktop and mobile; set `PLAYWRIGHT_MODULE` to an installed Playwright module path.
