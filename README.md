# Laboratory Management System

Next.js App Router + React + TypeScript application scaffold. This is independent of the sibling `Documentation` repository.

## Run locally

From `PBL1/System`:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build` for a production build, `npm start` to serve it, and `npm run typecheck` for TypeScript checks.

Initial dependency download stalled and was stopped. Installation and build verification are not complete yet. The first successful `npm install` will generate `package-lock.json`; commit that lockfile and use `npm ci` for subsequent clean installs.

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

Only a starter page exists. No authentication, database, production role permissions or laboratory processes are implemented. Do not copy documentation-editor Supabase credentials into this application: the editor database stores diagram drafts, not laboratory transactions. Keep future secrets in untracked `.env.local` files.
