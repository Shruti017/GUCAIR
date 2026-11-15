# GUCAIR — Global University Consortium of AI Readiness

GUCAIR is a full-stack platform concept for assessing, comparing and improving institutional AI readiness across higher education. This repository contains the web application, API, MongoDB models, assessment workflow, scoring and ranking logic, administration tools, content modules, notifications, report exports and an optional evidence-grounded AI Advisor.

> **Deployment status:** Source code is provided. The app has not been dependency-installed or run end-to-end in this environment because package installation could not complete. Configure external services and run the verification steps below before using it publicly. The assessment framework is a demonstration baseline, not an independently validated accreditation standard.

## Technology

- Web: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Recharts, Lucide
- API: Node.js 20+, Express 4, TypeScript, Mongoose
- Database: MongoDB Atlas or local MongoDB 7+
- Security: bcrypt password hashing, short-lived JWT access tokens, rotating refresh tokens, role-based authorization, Helmet, CORS and rate limiting
- AI Advisor: optional OpenAI-compatible Chat Completions API; key stays on the API server

## Features in this codebase

### Public platform
- GUCAIR landing page and eight-dimension framework
- Verified university directory
- Published-result global rankings
- AI courses, research hub, industry partnerships and events/news libraries
- Account registration and sign-in

### University workspace
- University administrator registration with pending verification
- University-specific dashboard and assessment history
- Start, resume, save and submit an assessment
- 8 dimensions / 100% weighted score framework
- Readiness bands: Emerging (0–20), Developing (21–40), Established (41–60), Advanced (61–80), AI Leader (81–100)
- Latest assessment export to PDF and CSV
- Evidence-grounded AI Advisor (requires provider configuration and a published result)

### Super-admin workspace
- Platform overview metrics
- User activation/deactivation and account creation
- University verification, editing and deletion
- Assessment version creation and activation/archiving
- Submitted assessment review and publication
- Content moderation and deletion
- Platform announcements and notification delivery
- Administrative audit log

### Content workflow
- Faculty, university administrators and super administrators can submit courses, research, partnerships, events and news.
- Non-super-admin submissions are saved as drafts for review.
- Super administrators can publish, unpublish or delete content.

## Requirements

- Node.js 20 or later (Node 22 recommended)
- npm 10 or later
- MongoDB Atlas account or local MongoDB

## Local setup

1. Extract the repository.
2. Copy `apps/api/.env.example` to `apps/api/.env`.
3. Set `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `CLIENT_URL` in `apps/api/.env`.
4. Copy `apps/web/.env.local.example` to `apps/web/.env.local`.
5. Ensure `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in the web environment file.
6. From the repository root run:

```bash
npm run install:all
npm run seed
npm run dev
```

Web: http://localhost:3000

API health: http://localhost:5000/api/health

### Local MongoDB option

If Docker is installed, start a local MongoDB instance with:

```bash
docker compose up -d mongodb
```

Then use `MONGODB_URI=mongodb://127.0.0.1:27017/gucair`.

## Demo accounts

The seed script creates 10 fictional universities, published demonstration scores, sample courses/research/partnerships/events/news and the following demo accounts. Seeded institutions are explicitly marked as demo data in the directory and rankings. All share the development-only password `GucairDemo!2026`:

- `admin@gucair.org` — super administrator
- `university.admin@demo.edu` — university administrator for Northstar Institute of Technology
- `faculty@demo.edu` — faculty
- `student@demo.edu` — student

The seed script refuses to run when `NODE_ENV=production`. Change demo credentials before any public deployment. Demo universities and results are fictional and must never be represented as real institutions or official rankings.

## AI Advisor configuration (optional)

Add both provider keys to `apps/api/.env`; the selected provider is tried first, then the other provider is used automatically if the request fails or times out:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.8-flash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Set `AI_PROVIDER` to `gemini` or `openai` to choose the preferred provider. The other provider is used as a fallback when configured. The Advisor only uses the authenticated user's university's latest published assessment and returns an error if both providers fail; it does not generate fake fallback answers.

## Useful API routes

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/register-university`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `GET /api/auth/me`

### Universities and assessment
- `GET /api/universities`
- `GET /api/universities/mine`
- `POST /api/universities`
- `GET /api/assessments/active`
- `POST /api/assessments/:id/start`
- `PUT /api/assessments/:id/answers`
- `POST /api/assessments/:id/submit`
- `GET /api/results/me`
- `GET /api/results/:universityId/latest`
- `PATCH /api/results/:id/publish` (super admin)
- `GET /api/rankings`

### Content, notifications and reports
- `GET /api/content/:type` (`course`, `research`, `partnership`, `event`, `news`)
- `POST /api/content/:type` (authenticated contributors; saved as draft except super admin)
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `GET /api/reports/my-assessment.pdf`
- `GET /api/reports/my-assessment.csv`
- `POST /api/advisor/recommendations`

### Super admin
- `GET /api/admin/overview`
- `GET/POST /api/admin/users`
- `PATCH /api/admin/users/:id/active`
- `GET /api/admin/universities`
- `PATCH /api/admin/universities/:id` and `DELETE /api/admin/universities/:id`
- `GET/POST /api/admin/assessments`
- `PATCH /api/admin/assessments/:id/status`
- `GET /api/admin/submissions`
- `GET /api/admin/content`
- `PATCH /api/admin/content/:id` and `DELETE /api/admin/content/:id`
- `POST /api/admin/announcements`
- `GET /api/admin/audit-logs`

Protected routes require `Authorization: Bearer <access-token>`. The frontend stores access and rotating refresh tokens in session storage and retries once after a 401. For a public production deployment, move refresh handling to secure, same-site, HTTP-only cookies and add CSRF protections appropriate to the deployment topology.

## Validation and tests

```bash
npm test
npm run typecheck
npm run build
```

The API test suite includes readiness-band boundary tests and weighted-score completeness tests. Also test the actual login, assessment, publishing, content moderation and report-download workflows against a configured MongoDB database before deployment.

## Deployment notes

- `apps/api/Dockerfile` builds the API container.
- `apps/web/Dockerfile` builds the Next.js web container. Set `NEXT_PUBLIC_API_URL` as a Docker build argument to the public API URL.
- `docker-compose.yml` starts a local MongoDB service only; the app containers should be deployed with their own production secrets and environment configuration.
- On Vercel, create two projects from this repository: set the web project's Root Directory to `apps/web`, and the API project's Root Directory to `apps/api`. Vercel supports Next.js and Express projects in the same monorepo.
- In the web Vercel project, set `NEXT_PUBLIC_API_URL` to the deployed API URL ending in `/api`. In the API project, set `NODE_ENV=production`, `CLIENT_URL` to the web site's origin, a production Atlas `MONGODB_URI`, strong unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values, and the chosen AI provider keys. Enter secrets in Vercel's environment settings, not in Git.
- After both projects deploy, verify the API at `/api/health` and check the web app's login, directory, rankings, and authenticated workflows against the production database.
- Set strong unique JWT secrets in production; never use demo accounts or development fallback secrets.
- Configure HTTPS, domain allowlists, backups, database access restrictions, logging and monitoring.
- Configure an email provider if account verification or password reset emails are required; email delivery is not included.
- External identity verification, object/file storage and institution-domain verification require provider integrations.
- Review the assessment questions, scoring weights, validation evidence and ranking policy with domain experts before any certification or public institutional claims.

## Project structure

```text
apps/
  api/
    src/models/       Mongoose models
    src/routes/       REST API routes
    src/services/     Scoring and business logic
    src/middleware/   Authentication and error handling
  web/
    src/app/          Next.js pages and workspaces
    src/components/   Shared UI components
    src/lib/          API client with token refresh
```
