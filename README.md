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
- File-backed JSON persistence for fast delivery
- Local upload storage for supporting documents
- Signed cookie sessions for attendee and admin access

## Environment

Copy `.env.example` to `.env.local` and change the secrets:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now
SESSION_SECRET=replace-this-secret-before-deploy
EVENT_NAME=CMD AI Adoption Exam 2026
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

This app is easiest to deploy on a Node host with persistent disk such as Render, Railway with volume, Fly, or a VPS, because registrations and uploaded documents are stored on disk by default.
# cmd-ai-adoption-exam-register-system
# cmd-ai-adoption-exam-register-system
