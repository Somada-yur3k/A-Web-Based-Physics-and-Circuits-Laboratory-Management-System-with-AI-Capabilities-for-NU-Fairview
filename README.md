# Laboratory Management System

Next.js App Router + React + TypeScript + Tailwind CSS v4 application scaffold. This is independent of the sibling `Documentation` repository.

Tailwind is integrated through `@tailwindcss/postcss` in `postcss.config.mjs`. Shared design tokens are defined with `@theme` in `src/app/globals.css`; page styling uses Tailwind utility classes. No Tailwind CDN is used.

## Run locally

From `PBL1/System`:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run build` for a production build, `npm start` to serve it, and `npm run typecheck` for TypeScript checks.

Dependencies are installed and the production build and TypeScript checks pass. `package-lock.json` records the resolved dependency versions; use `npm ci` for reproducible clean installs.

## New repository

Create an empty GitHub repository (without an initial README), then run these commands inside `System`, not `PBL1` or `Documentation`:

```sh
git init -b main
git add .
git commit -m "Initialize Next.js application"
git remote add origin <YOUR_NEW_REPOSITORY_URL>
git push -u origin main
```

For a separate Vercel project, import that new repository using the Next.js preset and repository root (`.`). Do not reuse the documentation deployment project.

## Scope

The home page contains the responsive NU Fairview login UI, with required fields, a password visibility toggle, and keyboard focus states. Three fixed demo logins open the Head Laboratory, Faculty, and Class Representative dashboards. See [DEMO-ACCOUNTS.md](DEMO-ACCOUNTS.md) for credentials and a walkthrough. Temporary server sessions support logout and role checks; Supabase, production authentication, and live laboratory processes are not connected. Do not copy documentation-editor Supabase credentials into this application: the editor database stores diagram drafts, not laboratory transactions. Keep future secrets in untracked `.env.local` files.

The crest is displayed from `public/nu-fairview-brand.png`, an existing branding asset from the user's `126th-Official-PPT-Template-NU-Fairview.pptx`. CSS shows only the crest region of that asset.

The Admin / Head Laboratory Account Management preview is available at `/dashboard/admin`. It includes Faculty and Class Representative accounts, search, status filtering, pagination, and create/edit/delete dialogs using demo data. The other Admin sidebar pages have blank content areas. Changes reset on reload; Supabase account provisioning and access control are pending. See `src/features/accounts/README.md` for integration notes.

Faculty (`/dashboard/faculty`) and Class Representative (`/dashboard/classrep`) dashboard previews include summary cards, upcoming schedules, recent records, request details, and quick actions. Their other sidebar pages are blank. See `src/features/lab-dashboard/README.md` for data and routing notes.
