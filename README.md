# GUCAIR — Unified Next.js Application

GUCAIR is a university AI-readiness platform. This version consolidates the former `apps/web` and `apps/api` workspaces into one Next.js project and one Vercel deployment.

## Architecture

- **Next.js App Router**: pages, layouts and frontend components.
- **Next.js API Route Handlers**: `/api/health` plus a catch-all handler exposing the existing `/api/*` endpoints on the same origin.
- **Existing Express routers**: retained behind the Next.js API handler during this migration so existing endpoint behavior and business logic are not discarded.
- **MongoDB + Mongoose**: persistent application data.
- **Vercel**: one project, one deployment, one public domain.

The Express routers are an internal compatibility layer, not a separately deployed service. They can be migrated individually to native Next.js Route Handlers after the consolidated deployment has been verified.

## Setup

Requirements: Node.js 20.9+, npm, and a MongoDB database.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start a local MongoDB container if you do not already have a database:

   ```bash
   docker compose up -d mongodb
   ```

3. Copy `.env.example` to `.env.local` and configure `MONGODB_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. For Docker MongoDB, use `mongodb://127.0.0.1:27017/gucair`. Configure an AI provider key only if you want to use the AI Advisor.

4. (Optional) To create fictional local demo universities, sample scores, content and test accounts, set `GUCAIR_SEED_PASSWORD` in `.env.local` to a unique password of at least 12 characters, then run `npm run seed`. The seed script is disabled in production. It creates `admin@gucair.org`, `university.admin@demo.edu`, `faculty@demo.edu` and `student@demo.edu`, all using the password you set in `GUCAIR_SEED_PASSWORD`. These are local test accounts only.

5. Start the application:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

The website and API share the same origin. API requests use `/api`; do not configure `NEXT_PUBLIC_API_URL` or start a second API server.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm test
npm run seed
```

The seed script is for local development only and refuses to run in production. Demo accounts and demo university records are fictional. Change all demo credentials before any public use.

## Vercel deployment

1. Push this repository to GitHub and import it as **one Vercel project**.
2. Set the Root Directory to the repository root (`.`).
3. Use the Next.js framework preset.
4. Add `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in Vercel Project Settings. Generate two different random values with at least 32 bytes each. Add AI provider variables only if AI Advisor will be used.
5. Use a separate Atlas database for Preview deployments. Do not configure `GUCAIR_SEED_PASSWORD` or any `BOOTSTRAP_ADMIN_*` variable in Vercel.
6. Deploy and verify `/api/health` returns HTTP 200 with `database: "connected"` and `configuration: "valid"`.
7. Verify registration, login, role access, university directory, rankings, assessment submission, admin workflows, report downloads and AI Advisor.

### Create the initial super administrator

Public registration cannot create a super administrator. After Atlas is ready, create the first one from a trusted local terminal. Set `MONGODB_URI` to the Atlas URI and set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 16 characters in that terminal, then run:

```bash
npm run bootstrap:admin
```

The script accepts Atlas `mongodb+srv://` URIs only and refuses to run if any super administrator already exists. Do not run `npm run seed` against Atlas or a production database. Clear the temporary bootstrap variables from your shell after the command succeeds.

Do not set `NEXT_PUBLIC_API_URL`; the API is same-origin.

## Important production checks

- Use a production MongoDB Atlas database with network access restricted appropriately.
- Generate unique JWT secrets; never use the demo values in production.
- Browser sessions use HTTP-only, SameSite cookies. Unsafe cookie-authenticated requests are checked against the request origin. Never reintroduce browser storage for access or refresh tokens.
- API rate limits are stored in MongoDB so limits are shared by Vercel function instances. The app user needs permission to create indexes and write to the `rate_limit_counters` collection.
- Review assessment questions, weights, evidence requirements and ranking policies with domain experts before making official institutional claims.
- Password reset and email verification are not implemented. Add those flows and an email provider before requiring them for public use.
- Keep all AI provider keys server-side.

## Project structure

```text
src/
  app/
    api/[...path]/route.ts  # same-origin API entry point
    ...                     # existing Next.js pages
  components/               # shared UI
  lib/                      # frontend API client
  server/
    app.ts                  # Express app factory (internal API compatibility)
    config/                 # database connection
    middleware/             # authentication and error handling
    models/                 # Mongoose models
    routes/                 # existing API route modules
    services/               # scoring logic and tests
    utils/                  # token helpers
```
