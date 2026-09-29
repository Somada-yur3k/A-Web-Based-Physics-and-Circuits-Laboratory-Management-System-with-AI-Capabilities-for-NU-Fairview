# Dashboard organization

Each role has its own route folder and `page.tsx`:

| Folder | Role | Route |
| --- | --- | --- |
| `classrep` | Class Representative | `/dashboard/classrep` |
| `faculty` | Faculty | `/dashboard/faculty` |
| `dean` | Dean | `/dashboard/dean` |
| `physics-laboratory` | Physics Laboratory Staff | `/dashboard/physics-laboratory` |
| `circuits-laboratory` | Circuits Laboratory Staff | `/dashboard/circuits-laboratory` |
| `head-laboratory` | Head Laboratory | `/dashboard/head-laboratory` |

`page.tsx` in this directory provides a preview directory at `/dashboard`.
Shared dashboard components belong in `src/components/dashboard`.
Every dashboard uses the shared top-right user / V dropdown for Profile and Log-out. These actions are no longer sidebar entries. The menu also appears on Dean and laboratory Staff dashboards and the preview directory; their Profile pages remain blank.
The Head Laboratory folder contains Account Management, Inventory Overview, Reservation Requests, and Schedule Management. Schedule Management shows the three official timetables and dated reservation blocks and lets Head Laboratory add or edit weekly official time. `/dashboard/admin` redirects to Account Management. Other unfinished sidebar routes still have blank content areas. See `src/features/accounts/README.md` for demo behavior and the future Supabase integration boundary.

Faculty and Class Representative dashboards now follow their supplied Circuits Laboratory references. Class Representative Laboratory Service Request includes all six steps through Equipment & Materials and Review Information, with assigned Faculty for On-Schedule, an explicit Faculty/Dean choice for Out-of-Schedule, and a temporary server demo submission. Faculty Laboratory Service Request uses Laboratory → Activity Type: Laboratory Activity skips Schedule Type and needs no academic approval; Non-Laboratory Activity offers On-Schedule without academic approval and Out-of-Schedule with Dean approval. Both include Schedule & Room, Equipment & Materials, Review, and a temporary server demo receipt. Remaining sidebar pages have blank content areas. See `src/features/lab-dashboard/README.md` for preview behavior. Dean has a protected Out-of-Schedule review queue, Approve/Reject actions, decision history, and counts. Requester status pages reflect these decisions; other unfinished pages remain blank. Laboratory Staff workspaces reuse the Head Laboratory shell and include their own inventory management, sample borrowing records, and submitted reservation requests. See `src/features/staff/README.md`.

These routes contain sample data and require a demo sign-in. Dean, Head Laboratory, Faculty, Class Representative, Physics Laboratory Staff, and Circuits Laboratory Staff routes check the corresponding demo role. Each Staff role has its own login and is restricted to its own laboratory dashboard/Profile; their own records and inventory mutations are also scoped by the server, with the shared working logout menu. See the root `DEMO-ACCOUNTS.md` for the six fixed logins. The directory is for development previews and is not a role-selection sign-in flow. Replace the temporary demo sessions with production authentication and database permissions before adding live data or operations.
