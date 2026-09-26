# Faculty and Class Representative dashboard previews

- Faculty: `/dashboard/faculty`
- Class Representative: `/dashboard/classrep`

Both pages follow the supplied Circuits Laboratory references. Each role has its own summary metrics, schedule, recent records, sidebar, and quick actions. View buttons open a read-only details dialog for the selected sample record.

The Class Representative sidebar is ordered: Dashboard, Laboratory Service Request, Borrowing Slip, Clearance, My Reservation, Lab Assistant.

The Faculty sidebar is ordered: Dashboard, Laboratory Service Request, Request Review, Lab Assistant, Reservation Status. Request Review is the entry for deciding assigned Class Representative requests; its approval/rejection screen is pending. The current Class Representative demo allows an explicit Faculty or Dean choice for Out-of-Schedule, per the latest UI requirement.

Profile and Log-out are in the top-right user / V dropdown on desktop and mobile, shared with every dashboard workspace. Profile destinations remain blank until their screens are designed.

Clearance is available to Class Representatives only. The Faculty sidebar, quick actions, and routes do not include clearance.

The Class Representative Laboratory Service Request page shows all six steps: Choose Laboratory, Select Request Type, Select Schedule Type, Schedule & Room Availability, Equipment & Materials, and Review Information. They share the same left-aligned, text-only heading position. Physics and Circuits cards have native radio selection, with Circuits selected initially to match the reference. Next opens Group / Student Only, with no request type preselected; valid participating students are required before continuing to Schedule Type. The third screen offers On-Schedule / Out-of-Schedule, with On-Schedule selected initially. Its Approval Route notice changes with the selection: assigned Faculty for On-Schedule; choose Faculty or Dean in Review Information for Out-of-Schedule. This explicit choice follows the latest user requirement and replaces the earlier automatic Faculty-unavailable routing in this demo. There is no Faculty-to-Dean escalation. Completed steps display checkmarks. Back retains selections within the open request page, and Cancel returns to the Class Representative dashboard.

The left-aligned Create a Laboratory Service Request heading and its subtitle appear directly below the six-step progress bar on every step.

Selecting a request type in Step 2 reveals editable Student Name and NU Student ID inputs. Section stays fixed and read-only as BSIT 2A for the demo account. Group supports adding/removing participant rows; Student Only shows exactly one row without Add/Remove controls. Each mode retains its own draft while switching modes or navigating Back, but only the active mode's students are checked. Next stays disabled until every visible row has a nonblank name and a NU Student ID in `YYYY-NNNNNNN` format, e.g. `2024-1031816`, with no duplicate IDs (ignoring surrounding spaces). Names are limited to 120 characters and IDs to 12, matching the inputs. These are temporary local entries and do not create student records, accounts, or reservations; matching names/IDs to real assigned-class records is deferred to backend integration.

Step 4 includes Assigned Class / Subject, Request For (One-time use), Date Needed, Room Number, Start Time, and End Time. Its room calendar shows Monday through Saturday, 7:00 AM to 5:00 PM, in half-hour slots. Regular laboratory sessions and lectures repeat weekly; sample pending and approved Out-of-Schedule requests appear only on their specific dates and rooms. Previous/next week arrows navigate the calendar, and occupied blocks open their date, time, section, instructor or request reference details. The demo starts in March 2026 to match the reference and existing dashboard snapshots.

On-Schedule follows the selected assigned class's room, weekday, and exact time block. Out-of-Schedule allows a room and vacant time range: click a vacant slot, then a later slot on the same day to extend the range, or enter start/end times. Validation rejects conflicts with room schedules, pending/approved requests, and the representative's regular classes even when choosing another room. Eligible selections appear green; invalid selections cannot cover occupied blocks. Back retains the schedule draft, while changing laboratory or schedule type resets incompatible values. This calendar uses sample data for two Circuits and two Physics rooms; the green selection is a local draft and does not reserve a room.

Step 5 allows optional equipment/material rows with names and whole-number quantities from 1 to 999, plus Notes / Special Setup. Empty equipment lists are valid; added rows must be complete or removed. These are manual demo entries, without a live stock catalogue or inventory availability check.

Step 6 reviews active participants, the fixed section, laboratory, request and schedule types, selected subject, room, date/time, one-time use, equipment/materials, and notes. Edit buttons return to the relevant step without losing the draft. On-Schedule displays the selected subject's assigned Faculty and cannot choose Dean. Out-of-Schedule requires an explicit Faculty or Dean selection; choosing Faculty shows the same subject's instructor. Changing schedule type resets the recipient choice. Editing details or changing the approver clears the confirmation checkbox, which is required before submission.

Submit Demo Request validates students, room/time conflicts, item details, and the approval recipient again, then creates a detached snapshot and a demo reference on this page. The submitted preview is locked against edits and repeat submission; Create Another Request starts an empty draft. No request, approval notification, stock hold, or room reservation is sent or saved; leaving/reloading the page clears the preview. Live submission and reviewer queues remain pending Supabase integration.

Run `node scripts/check-room-availability.mjs` to check recurring schedules, dated requests, room isolation, time boundaries, overlap rules, and server-rendered calendar markup. Run `node scripts/check-request-review.mjs` for recipient selection, submission validation, detached snapshots, and review rendering. These checks do not replace browser interaction testing.

The optional `scripts/check-request-flow-browser.cjs` tests the built app in headless Edge on port 3107, using an installed Playwright module (`PLAYWRIGHT_MODULE` may specify its path). Build first, then run the script. It checks all six steps, Group/Student Only, subject edits, On-Schedule Faculty, both Out-of-Schedule recipients, required confirmation, locked receipts, new drafts, reload reset, and mobile overflow. It writes desktop/mobile review screenshots to `artifacts/`.

Other sidebar and quick-action destinations are blank pages within the role's shell, ready for their future screen designs. Unknown sections return 404. Mobile uses a native dialog for navigation and internal horizontal scrolling for tables, the room calendar, and the request progress bar; laboratory choices, student fields, and schedule fields stack vertically.

Schedule remains accessible from dashboard cards and Notifications from the topbar bell, without sidebar entries. The old Class Representative `/make-reservation` route redirects to `/service-request`.

`config.ts` defines role routes and navigation. `demo-data.ts` holds typed sample dashboard snapshots. The displayed date is the snapshot date, March 7, 2026; its weekday is computed correctly rather than copied from the reference. Faculty Schedule Type uses On-schedule / Out-of-schedule from the system documentation. Class Representatives use Group / Student Only as shown in their reference.

The totals are sample summary snapshots, while the tables show only recent records. No live accounts, notifications, approvals, or request creation are connected. Sign in with the corresponding fixed demo account in the root `DEMO-ACCOUNTS.md`. Log out revokes the temporary demo session, clears its cookie, and returns to login. Server role checks and client session checks protect the demo workspace. Before Supabase integration, replace the demo session and snapshots with live authentication and enforce access on the server and database.
