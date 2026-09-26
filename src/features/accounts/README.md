# Account Management UI

Open `/dashboard/head-laboratory/account-management` or `/dashboard/admin`.
The Head Laboratory workspace is the Admin UI for this phase.
Sign in with the Head Laboratory demo account from the root `DEMO-ACCOUNTS.md` first. Logout revokes that demo session and returns to the login screen.

## Current behavior

- Separate Faculty and Class Representative tabs, 25 demo accounts each.
- Search, status filters, ten-row pagination, empty results, create/edit forms, and delete confirmation.
- Floating create/edit forms follow the supplied references: first/middle/last names, contact, status, notes, laboratory assignments, faculty department and multiple assigned sections, and representative student ID / existing subject-class assignment.
- Class Representative faculty choices match the selected section and laboratory. Existing subject/class choices match the selected faculty, section, and laboratory. Changes to these selections clear dependent fields.
- Email and student ID uniqueness checks, one active representative per section, and a safeguard against deleting faculty assigned to representatives.
- NU Student IDs use `YYYY-NNNNNNN` (four digits, a hyphen, seven digits), e.g. `2024-1031816`, in demo records and create/edit forms. The native input pattern and form-data validation both enforce this format.
- Mobile navigation and forms; wide tables scroll within the panel.
- Other sidebar destinations render a blank content area inside the shared shell.

The preview uses React state seeded from `demo-data.ts`. The class and section options are also demo records, not live institutional assignments. Reloading or leaving Account Management resets changes. These records are examples; creating or editing one does not change the fixed demo sign-in accounts. No passwords or real account provisioning are implemented in these forms. `account-form-data.ts` builds and validates the UI record; all form fields are retained when editing.

## Supabase integration boundary

`types.ts` defines the UI records. Map these to the final account/profile schema rather than assuming the demo identifiers are database IDs. `account-management.tsx` currently owns loading and mutations; replace the demo initialization and save/delete callbacks with the account data service after the Supabase schema is confirmed.

Class Representatives use their NU Student ID as `accountId`, consistent with the system documentation. Faculty use their NU email to sign in. The laboratory and designated-faculty columns follow the supplied screen; confirm their mapping against the final class/section relationships.

Before using live accounts, enforce admin access and permissions on the server and database, provision credentials through a trusted server endpoint, and handle errors/loading states. Do not send a Supabase service-role key to the client or generate passwords in this UI. Demo validation is only for the preview; live uniqueness and relationships need database enforcement.
