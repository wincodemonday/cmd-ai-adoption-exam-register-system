# Event Registration System

Single-repo Next.js solution for CMD AI Adoption Exam 2026 Problem #4.

## Features

- Public registration form with name, email, phone, event-ready extra fields, password setup, and multiple document uploads
- Reference code generation after submission
- Submission lookup with reference code and password
- Edit flow for all fields, replace existing documents, and add new documents
- Admin login using credentials from `.env`
- Admin registration list and detail pages
- Name tag PDF download per registration
- Code-based tests for core registration, auth, and PDF flows

## Tech choices

- `Next.js` app router for pages and API in one project
- Postgres via `DATABASE_URL` when configured, with file-backed JSON fallback for local-only use
- S3-compatible object storage via `ACCESS_KEY`, `SECRET_KEY`, and `ENDPOINT_URL`, with local file fallback
- Signed cookie sessions for attendee and admin access

## Environment

Copy `.env.example` to `.env.local` and change the secrets:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now
SESSION_SECRET=replace-this-secret-before-deploy
EVENT_NAME=CMD AI Adoption Exam 2026
DATABASE_URL=postgresql://user:password@localhost:5432/event_registration
DATABASE_SSL=false
ACCESS_KEY=your-access-key
SECRET_KEY=your-secret-key
ENDPOINT_URL=https://your-storage-endpoint
STORAGE_BUCKET=event-registration-documents
STORAGE_REGION=us-east-1
STORAGE_FORCE_PATH_STYLE=true
DATA_DIR=./data
STORE_PATH=./data/registrations.json
UPLOAD_DIR=./data/uploads
```

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Deploy note

When `DATABASE_URL` is present the app auto-creates the required Postgres tables on first use. When the storage envs are present the app uploads supporting documents to the configured S3-compatible endpoint and auto-creates the bucket if it does not exist. Without those storage envs it falls back to local disk under `data/uploads`.
