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
Every dashboard uses the shared top-right user / V dropdown for Profile and Log-out. These actions are no longer sidebar entries. The menu also appears on Dean and laboratory staff placeholders and the preview directory; their Profile pages remain blank.
The Head Laboratory folder now contains the Admin shell and Account Management UI at `/dashboard/head-laboratory/account-management`. `/dashboard/admin` redirects there. Its other sidebar routes have a blank content area until their screens are designed. See `src/features/accounts/README.md` for demo behavior and the future Supabase integration boundary.

Faculty and Class Representative dashboards now follow their supplied Circuits Laboratory references. Class Representative Laboratory Service Request includes all six steps through Equipment & Materials and Review Information, with assigned Faculty for On-Schedule, an explicit Faculty/Dean choice for Out-of-Schedule, and a local demo submission preview. Remaining sidebar pages have blank content areas. See `src/features/lab-dashboard/README.md` for preview behavior. Dean and laboratory staff pages remain placeholders for their future designs.

These routes contain sample data and require a demo sign-in. Head Laboratory, Faculty, and Class Representative routes check the corresponding demo role. See the root `DEMO-ACCOUNTS.md` for the three fixed logins. The directory is for development previews and is not a role-selection sign-in flow. Replace the temporary demo sessions with production authentication and database permissions before adding live data or operations.
