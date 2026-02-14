# Security Hardening — MojiTax Tools Platform

> **Status:** All 6 phases implemented and deployed. Platform is live and verified working.

---

## Phase 1: Remove Information Leaks — DONE

- Deleted debug route files: `app/api/debug/session/`, `app/api/debug/learnworlds/`, `app/api/debug/tool-allocations/`
- Deleted public test endpoint: `app/api/learnworlds/test/` (admin pages updated to use `/api/admin/courses/list` instead)
- Removed sensitive `console.log` statements from `lib/learnworlds/client.ts`, `app/api/auth/send-code/route.ts`, `lib/session.ts`, `lib/skill-verifications/index.ts`, `lib/skill-categories/index.ts`, `app/api/auth/refresh-session/route.ts`

---

## Phase 2: Encrypted Session Cookies — DONE

- Created `lib/secure-session.ts` using **Web Crypto API** (AES-256-GCM with PBKDF2 key derivation from `SSO_SECRET`)
  - Edge Runtime compatible (works in middleware)
  - Backward-compatible: `unsealSession()` falls back to legacy base64 decode for existing sessions
  - Cookie format: `salt.iv.ciphertext` (base64url encoded)
- Updated all session-writing endpoints to use `sealSession()` with `httpOnly: true`:
  - `app/api/auth/verify-code/route.ts`
  - `app/api/auth/verify-email/route.ts`
  - `app/api/auth/admin/login/route.ts`
  - `app/api/auth/refresh-session/route.ts`
  - `app/api/auth/learnworlds/callback/route.ts`
- Updated all session-reading code to use `unsealSession()`:
  - `middleware.ts` (async `parseSessionFromCookie`)
  - `lib/server-session.ts` (`getServerSession`)
- Created `GET /api/auth/me` endpoint for client-side session hydration
- Rewired `lib/auth/context.tsx` to fetch `/api/auth/me` instead of reading `document.cookie`

**Note:** Initially used `iron-session` but it failed in Edge Runtime (requires Node.js `crypto`). Replaced with pure Web Crypto API implementation.

---

## Phase 3: Fix XSS Vectors — DONE

- Replaced `dangerouslySetInnerHTML` with React elements in `app/(public)/tools/[slug]/page.tsx` (uses `.split()` + `<strong>` elements)
- Replaced `new Function()` eval with `expr-eval` safe parser in `lib/utils/index.ts`

---

## Phase 4: Security Headers — DONE

- Added `addSecurityHeaders()` function in `middleware.ts`, applied to all responses
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`, `Content-Security-Policy`

---

## Phase 5: Rate Limiting — DONE

- Created `lib/rate-limit.ts` with in-memory IP-based sliding window rate limiter
- Applied to:
  - `/api/auth/send-code`: 5 requests per IP per 15 minutes
  - `/api/auth/verify-code`: 10 requests per IP per 15 minutes
  - `/api/auth/admin/login`: 5 requests per IP per 15 minutes

---

## Phase 6: Error Boundaries & Health Check — DONE

- Created `app/global-error.tsx` — branded error page, no stack trace leaks
- Created `GET /api/health` — returns `{ status: 'ok', timestamp }` for uptime monitoring

---

## Deferred (Future Work)

- **Testing framework** — Add vitest + @testing-library/react
- **CI/CD pipeline** — GitHub Actions for lint + type-check + build on PR
- **Transaction safety** — Wrap multi-step DB operations in Supabase RPC functions
- **Request body size limits** — Validation middleware for POST payloads
- **CSP tightening** — Replace `unsafe-inline`/`unsafe-eval` with nonce-based CSP
- **Base64 fallback removal** — After 30 days, remove legacy base64 decode from `unsealSession()`
