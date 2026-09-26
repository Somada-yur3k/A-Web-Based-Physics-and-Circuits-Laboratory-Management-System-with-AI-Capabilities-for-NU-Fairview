# Laboratory Staff workspaces

Physics (`/dashboard/physics-laboratory`) and Circuits (`/dashboard/circuits-laboratory`) reuse the Head Laboratory shell with laboratory-specific navigation: Dashboard, Manage Inventory, Borrowing Slip Records, and Reservation Requests. Profile and Log-out stay in the top-right account menu. Content is capped at 1,440px; records become stacked cards within narrow content areas, and mobile navigation uses the same native dialog as Head Laboratory.

## Demo behavior

- Inventory starts from the sample equipment catalogue, with separate stock records per laboratory, including shared item types. Add, edit, condition/stock filters, pagination, and confirmed deletion work through authenticated demo endpoints. Changes persist across navigation and reload until server restart. Stock quantities must be whole numbers from 0 to 9,999; names must be unique within the laboratory.
- Head Laboratory's Inventory Overview (`/dashboard/head-laboratory/inventory-overview`) manages the same inventory records across both laboratories through Headlab-only `/api/demo/inventory` endpoints. Staff endpoints remain restricted to their assigned laboratory.
- Headlab and both staff accounts use the Create Account dialog layout for inventory add/edit forms. Item images can be uploaded, replaced, previewed, or removed before saving. PNG, JPEG, and WebP files up to 2 MB are accepted; the server validates data URL format, size, and image signatures. Seed items keep their catalogue illustration when no uploaded image is stored. Images persist with item details in temporary server memory until restart; cancelling leaves the saved item unchanged.
- Borrowing slips are two sample records per laboratory. Search, Borrowed/Returned filters, and details show student name, NU ID, section, faculty, room, issued/due/return dates, and recorded items. Issuing items and recording returns are unfinished.
- Reservation Requests shows submitted Class Representative and Faculty requests for the staff account's laboratory, including pending approval and completed Dean decisions. Staff can view the full request; academic Approve/Reject stays with the Dean/Faculty flow. Room reservation processing remains unfinished.
- Staff inventory edits do not alter the static equipment catalogue used in request forms or hold equipment. Supabase integration must unify inventory availability, borrowing transactions, and reservation processing.
- The server derives the laboratory from the authenticated staff role. Client laboratory parameters cannot change it. Foreign inventory IDs return 404; non-staff roles cannot use staff endpoints. Other staff route folders redirect to the signed-in role's dashboard.

## Files and verification

`config.ts` defines shared staff navigation. `store.ts` owns temporary inventory and sample borrowing records. `staff-page.tsx` renders staff operations, `headlab-inventory-page.tsx` renders the combined inventory view, `inventory-dialog.tsx` handles add/edit/delete, `inventory-thumbnail.tsx` displays uploaded photos or catalogue illustrations, and `staff.css` provides responsive layouts. APIs are in `src/app/api/demo/staff` and `src/app/api/demo/inventory`; request visibility is filtered in `src/features/demo-requests/store.ts`.

Build the app, then run `node scripts/check-staff-workspace-browser.cjs` with `PLAYWRIGHT_MODULE` pointing to an installed Playwright module. The check covers laboratory isolation, inventory validation/CRUD/persistence, borrowing filters/details, submitted request visibility, mobile navigation, 320–3440px layouts, and logout. `scripts/check-dean-browser.cjs` covers shared authentication and Dean workflow regressions.

`node scripts/check-inventory-images-browser.cjs` checks Headlab and both staff editors, image preview/replacement/removal/cancellation, persistence after reload, shared inventory updates, accepted image formats and invalid uploads, role authorization, and desktop/mobile dialog bounds.
