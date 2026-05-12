# Worker Split For Problem #4

This repo is currently empty except for the problem statement, so the safest fast path is:

- Use **Next.js** in one repo for pages + API.
- Agent 1 owns the product and deployment path.
- Agent 2 owns the acceptance test path and smoke-checks the exact flow the senior will click.

## Shared Contract

- Do not revert each other's changes. You are not alone in the codebase.
- Default stack: **Next.js App Router + one local database**. If the repo already shows a different chosen stack, adapt to that stack instead of replacing it.
- Optimize for the live check, not for over-engineering.
- Keep routes and selectors stable so tests can target them.
- Prefer these routes unless there is a strong reason not to:
  - `/` or `/register` for registration
  - `/submission` for reference-code + password lookup
  - `/admin/login` for admin auth
  - `/admin/registrations` for admin list
  - `/admin/registrations/[id]` for admin detail
- Prefer these test selectors:
  - `data-testid="registration-form"`
  - `data-testid="reference-code"`
  - `data-testid="lookup-form"`
  - `data-testid="edit-submission-form"`
  - `data-testid="admin-login-form"`
  - `data-testid="registration-list"`
  - `data-testid="download-tag-button"`
- Admin credentials must come from `.env`.
- Think about deployment before coding storage:
  - If using local file storage, deploy somewhere with persistent disk/volume.
  - If deploying to Vercel, use blob/object storage instead of local disk.

## Agent 1 Prompt

Use this as the prompt for the main builder agent:

```text
Build the core product for CMD AI Adoption Exam 2026 Problem #4 in this repo.

You are not alone in the codebase. Another worker will handle end-to-end tests and smoke verification. Do not revert others' work. Adjust to incoming changes if they appear.

Primary ownership:
- app/**
- components/**
- lib/**
- prisma/** or equivalent database folder
- middleware if needed
- styling/layout files
- API routes
- auth/session logic
- upload/document handling
- PDF tag generation
- deployment config and README instructions

Goal:
- One repo
- User pages, admin pages, and API in the same project
- Deployed-app-ready, fast path over over-design

Required product flow:
1. User submits registration with name, email, phone, password, and a few realistic event fields.
2. User uploads multiple supporting documents.
3. System returns a generated reference code after successful submission.
4. User returns using reference code + password to view the submission.
5. User can edit fields, replace documents, and add new documents.
6. Admin logs in with username/password from .env.
7. Admin sees list of registrations.
8. Admin opens a registration detail page.
9. Admin downloads a name-tag PDF for that registration.

Implementation guidance:
- Default to Next.js App Router.
- Use a simple durable database choice that works locally and in deployment.
- Passwords must be hashed, not stored in plain text.
- Reference code should be human-readable and unique.
- Make file uploads work for multiple documents.
- For document replacement, keep UX simple and reliable.
- Generate a real downloadable PDF tag with attendee name and reference code.
- Add stable data-testid attributes for the shared contract in WORKERS.md.
- Keep the UI clean and minimal but trustworthy.

Deliverables:
- Working app code
- .env.example
- README with local run steps and deployment notes
- Any minimal seed/setup needed for admin login

Definition of done:
- The full manual flow can be clicked end-to-end by a senior reviewer.
```

## Agent 2 Prompt

Use this as the prompt for the second worker:

```text
Own the acceptance-test lane for CMD AI Adoption Exam 2026 Problem #4 in this repo.

You are not alone in the codebase. Another worker is building the product. Do not revert others' work. Adapt your work to their changes. Focus on files that minimize merge conflicts.

Primary ownership:
- tests/**
- e2e/**
- playwright.config.* or equivalent test runner config
- test fixtures and sample upload files
- docs/acceptance-checklist.md

Avoid editing product files unless absolutely necessary for stable selectors or testability. If you must touch app code, keep the change tiny and surgical.

Mission:
- Write the tests that best simulate the senior's URL check.
- Build a smoke-check harness that proves the real user/admin flow works.

Target flow to automate:
1. Open the public registration page.
2. Submit a new registration with realistic data.
3. Upload multiple supporting documents.
4. Capture and assert the returned reference code.
5. Return via reference code + password.
6. Edit at least one field and save.
7. Log in to admin using env credentials.
8. Open registrations list.
9. Open one registration detail page.
10. Trigger name-tag PDF download and assert a PDF file is produced.

What to produce:
- One strong end-to-end smoke test covering the core happy path
- Optional small supporting tests if they add confidence without slowing delivery
- Test fixtures for sample file uploads
- A short acceptance checklist in docs/acceptance-checklist.md for manual fallback

Quality bar:
- Tests should prefer resilient selectors, not brittle text matching
- Save screenshots/traces on failure if the chosen framework supports it
- Keep test setup simple enough to run during the exam build process

Important coordination:
- Read WORKERS.md and align with its shared route/selector contract
- If the app is not fully ready yet, scaffold the test structure first and finish assertions once the routes/components land
- Do not block the main builder by taking ownership of the app structure

Definition of done:
- There is at least one executable end-to-end test that exercises the exact flow the senior is likely to perform.
```

## Merge Order

1. Agent 1 gets the app running locally as early as possible.
2. Agent 2 scaffolds test runner + fixtures immediately, then finishes assertions once routes land.
3. Agent 1 exposes stable selectors.
4. Agent 2 locks the happy-path test.
5. Final pass: run smoke test, then deploy.

## Senior Check Checklist

- User can register successfully.
- Multi-file upload works.
- Reference code is shown clearly and can be copied.
- Lookup with reference code + password works.
- Edit flow persists changes.
- Admin login works from `.env`.
- Admin list and detail both work.
- Tag PDF downloads successfully.

