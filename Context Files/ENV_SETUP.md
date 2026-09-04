# ENV_SETUP.md — Environment Variables Guide

## All Environment Variables

| Variable | Side | Required | Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Yes | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Yes | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes | Supabase Dashboard |
| `GROQ_API_KEY` | Server only | Yes | Groq Console |
| `RESEND_API_KEY` | Server only | No | Resend Dashboard |
| `RESEND_FROM_EMAIL` | Server only | No | Your verified sender |
| `NEXT_PUBLIC_APP_URL` | Client + Server | No | Your Vercel URL |

---

## Variable Details

### `NEXT_PUBLIC_SUPABASE_URL`

**What it is:** Your Supabase project URL

**Where it's used:** Supabase client (browser + server)

**How to get it:** Supabase Dashboard → Project Settings → API → Project URL

**Example:**

```text
https://abcdefghijklmno.supabase.co
```

**Safe to expose to client:** Yes (by Supabase design — it identifies the project but does not grant access)

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**What it is:** Supabase anonymous/public key

**Where it's used:** Client-side Supabase queries subject to Row Level Security

**How to get it:** Supabase Dashboard → Project Settings → API → anon public

**Example:**

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(long JWT)

**Safe to expose to client:** Yes — RLS policies control what this key can access

### `SUPABASE_SERVICE_ROLE_KEY`

**What it is:** Supabase service role key (bypasses RLS)

**Where it's used:** Server-side API routes ONLY — never sent to browser

**How to get it:** Supabase Dashboard → Project Settings → API → service_role secret

> ⚠️ **NEVER expose to client:** This key bypasses all RLS — treat like a database password.

### `GROQ_API_KEY`

**What it is:** API key for Groq LLM inference

**Where it's used:** Server-side agent calls ONLY

**How to get it:** https://console.groq.com → API Keys → Create API Key

> ⚠️ **NEVER expose to client:** Keep server-only.

### `RESEND_API_KEY`

**What it is:** API key for Resend transactional email

**Where it's used:** Server-side Agent 4 notification ONLY

**How to get it:** https://resend.com → Dashboard → API Keys

**Required:** No — if absent, email is skipped silently; in-app notification still works.

> ⚠️ **NEVER expose to client.**

### `RESEND_FROM_EMAIL`

**What it is:** Verified sender email address for Resend

**Where it's used:** `from` field in Resend email calls

**Example:**

```text
procurement@yourcompany.com
```

**Required:** Only if `RESEND_API_KEY` is set.

**Note:** Domain must be verified in Resend dashboard.

### `NEXT_PUBLIC_APP_URL`

**What it is:** Public URL of your deployed app

**Where it's used:** Link generation in notification emails

**Example:**

```text
https://procurement-ai.vercel.app
```

**Required:** No — defaults to localhost:3000 in development.

---

## Local Development Setup

### 1. Copy the example file

```bash
cp .env.example .env.local
```

### 2. Fill in your values in `.env.local`

```bash
# Open in your editor
nano .env.local

# or
code .env.local
```

### 3. Verify `.env.local` is in `.gitignore`

```bash
grep ".env.local" .gitignore
```

Should output:

```text
.env.local
```

### 4. Test the connection

```bash
npm run dev
```

Open `http://localhost:3000`.

Dashboard should load without errors.

---

## Vercel Deployment Setup

1. Connect your GitHub repository to Vercel.
2. In Vercel project settings → **Environment Variables**, add each variable.
3. Set the correct scope:
   - Production
   - Preview
   - Development
4. For `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, and `RESEND_API_KEY`: **Production only**.
5. For `NEXT_PUBLIC_*` variables: **All environments**.
6. After adding variables, trigger a new deployment (or redeploy).
7. Verify in Vercel Function Logs that secrets are not logged or exposed.

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` has no real values — only placeholder text
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never imported in any client-side file (`/app/page.tsx`, `/components/`, etc.)
- [ ] `GROQ_API_KEY` is never imported in client-side code
- [ ] `RESEND_API_KEY` is never imported in client-side code
- [ ] No `console.log` of environment variables in production code
- [ ] Vercel environment variables are set as sensitive where available

---

## Identifying Client vs Server Variables in Next.js

**Client-side (available in browser):**

Variables prefixed with `NEXT_PUBLIC_`.

**Server-only:**

All other variables — accessible only in:

- `/app/api/*` routes
- Server Components (`async function Page()`)
- `/lib/` modules imported only by server-side code

**How to verify:**

Search your codebase for `process.env.GROQ_API_KEY` — it must only appear in server-side files.

If it appears in a file that could run client-side, this is a security issue.
