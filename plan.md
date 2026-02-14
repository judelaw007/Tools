# Safe Security Fix Plan — MojiTax Tools Platform

> **Constraint:** Platform is live and public. Every change must be backward-compatible. No user-facing breakage allowed. Each phase is independently deployable and rollback-safe.

---

## Phase 1: Remove Information Leaks (Zero Risk)

**Goal:** Close publicly accessible debug endpoints that expose internal data. No functionality depends on these.

### Step 1.1 — Delete debug/test route files
Delete these 3 files entirely:
- `app/api/debug/session/route.ts`
- `app/api/debug/learnworlds/route.ts`
- `app/api/debug/tool-allocations/route.ts`

**Why safe:** These are developer-only debug tools. No UI, webhook, or integration calls them. `/api/debug/session` requires auth but still exposes too much detail. The other two are fully public due to middleware prefix matching.

### Step 1.2 — Delete the LearnWorlds test endpoint
Delete: `app/api/learnworlds/test/route.ts`

**Why safe:** This is a test endpoint that lists all LearnWorlds products. Nothing in the app calls it. It's publicly accessible because `/api/learnworlds` is a public prefix in middleware.

### Step 1.3 — Remove sensitive console.log statements
In `lib/learnworlds/client.ts`, remove or conditionalize `console.log` calls that log user emails and LearnWorlds IDs (lines ~81, 94, 99, 117, 134). Also in `app/api/auth/send-code/route.ts` (line ~50, 76). Keep `console.error` calls — those are useful for debugging failures.

**Approach:** Wrap in `if (process.env.NODE_ENV === 'development')` or remove entirely.

**Why safe:** Removing log statements has no functional impact.

**Commit & deploy Phase 1 before proceeding.**

---

## Phase 2: Secure the Session Cookie (Critical, Careful Migration)

**Goal:** Sign session cookies with HMAC-SHA256 so they can't be forged. Maintain backward compatibility during rollout.

### Step 2.1 — Install iron-session
```bash
npm install iron-session
```

`iron-session` encrypts + signs cookies using a 32-char password. It's the standard approach for Next.js App Router and handles `httpOnly`, `secure`, and `sameSite` automatically.

### Step 2.2 — Create a new session utility: `lib/secure-session.ts`
Implement a centralized module that:
- Encrypts session data using `iron-session` with the existing `SSO_SECRET` env var (already 32+ chars)
- Provides `sealSession(data)` → encrypted string and `unsealSession(cookie)` → data or null
- `unsealSession` includes a **fallback**: if decryption fails, attempt the old base64 decode. This ensures existing logged-in users aren't kicked out during the transition.
- Logs a warning when fallback is used (so we know when migration is complete)

### Step 2.3 — Update all session-writing endpoints to use sealed cookies
Update these files to call `sealSession()` instead of `Buffer.from(...).toString('base64')`:
- `app/api/auth/verify-code/route.ts` (line 96)
- `app/api/auth/verify-email/route.ts` (line 78)
- `app/api/auth/admin/login/route.ts` (line ~45)
- `app/api/auth/refresh-session/route.ts` (line ~80)

Also set `httpOnly: true` on all session cookies. This is the key security change.

### Step 2.4 — Update all session-reading code to use `unsealSession` with fallback
- `middleware.ts` — `parseSession()` function (line 53-67): replace base64 decode with `unsealSession()` (which falls back to base64)
- `lib/server-session.ts` — `getServerSession()`: same change
- `lib/session.ts` — client-side `parseSession()`: this will no longer work once `httpOnly: true` is set (client can't read the cookie). See Step 2.5.

### Step 2.5 — Replace client-side cookie reading with a server endpoint
Since `httpOnly: true` means `document.cookie` can't read the session:

1. Create `app/api/auth/me/route.ts` — a lightweight GET endpoint that reads the server session and returns `{ email, role, displayName }` (non-sensitive fields only).
2. Update `lib/auth/context.tsx` to call `/api/auth/me` on mount instead of parsing the cookie directly. Replace the `getCookie()` + `parseSessionCookie()` logic with a `fetch('/api/auth/me')` call.

**Why safe:** The fallback in `unsealSession` means old base64 cookies still work. Users with existing sessions stay logged in. New sessions get encrypted cookies. Over 30 days (max cookie lifetime), all sessions naturally migrate. The `/api/auth/me` endpoint replaces client cookie reading without changing any user-visible behavior.

**Commit & deploy Phase 2. Monitor logs for fallback usage. After 30 days, remove the base64 fallback.**

---

## Phase 3: Fix XSS Vectors

### Step 3.1 — Replace `dangerouslySetInnerHTML` with safe rendering
In `app/(public)/tools/[slug]/page.tsx` (lines 318-320), replace:
```tsx
<span dangerouslySetInnerHTML={{
  __html: item.replace(/^-\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}} />
```
With a safe React approach:
```tsx
// Helper that splits text on **bold** markers and returns React elements
function renderBoldText(text: string) {
  const cleaned = text.replace(/^-\s*/, '');
  const parts = cleaned.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}
```
This renders bold text without ever setting innerHTML. Any HTML in the content is automatically escaped by React.

**Why safe:** Same visual output. React's default escaping prevents injection.

### Step 3.2 — Replace `new Function()` with safe math evaluation
In `lib/utils/index.ts` (line 193), replace:
```ts
return new Function(`return ${expression}`)() as number;
```

Install `expr-eval` (`npm install expr-eval`) and use:
```ts
import { Parser } from 'expr-eval';
const parser = new Parser();
return parser.evaluate(expression);
```

This evaluates mathematical expressions without executing arbitrary JavaScript.

**Why safe:** `expr-eval` only supports math operations. Same results for valid formulas. Invalid input throws instead of executing.

**Commit & deploy Phase 3.**

---

## Phase 4: Add Security Headers

### Step 4.1 — Add security headers in `middleware.ts`
Add response headers to every request passing through middleware:
```ts
const response = NextResponse.next();
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.supabase.co data:; connect-src 'self' https://*.supabase.co;");
return response;
```

**Note:** The CSP starts permissive (`unsafe-inline`, `unsafe-eval` for Next.js compatibility) and can be tightened later. The key wins are clickjacking protection (`X-Frame-Options`) and HSTS.

**Why safe:** These are response headers only — they don't change any logic. If a CSP rule is too strict, it blocks a resource visually but doesn't crash the app. Test on staging/preview first.

**Commit & deploy Phase 4.**

---

## Phase 5: Rate Limiting on Auth Endpoints

### Step 5.1 — Add in-memory rate limiter
Create `lib/rate-limit.ts` with a simple in-memory IP-based rate limiter (Map of IP → { count, resetTime }). No external dependency needed for the initial implementation.

Configuration:
- `/api/auth/send-code`: 5 requests per IP per 15 minutes
- `/api/auth/verify-code`: 10 requests per IP per 15 minutes
- `/api/auth/admin/login`: 5 requests per IP per 15 minutes

### Step 5.2 — Apply rate limiter to auth endpoints
Add rate limit check at the top of each POST handler in:
- `app/api/auth/send-code/route.ts`
- `app/api/auth/verify-code/route.ts`
- `app/api/auth/admin/login/route.ts`

Return `429 Too Many Requests` with `Retry-After` header when limit exceeded.

**Why safe:** Only blocks excessive requests. Normal users won't hit these limits. Existing functionality unchanged.

**Commit & deploy Phase 5.**

---

## Phase 6: Error Boundaries & Health Check

### Step 6.1 — Add root error boundary
Create `app/error.tsx` — a client component that catches React errors and shows a branded error page with a "Try again" button instead of a blank screen.

Also create `app/global-error.tsx` for root layout errors.

### Step 6.2 — Add health check endpoint
Create `app/api/health/route.ts`:
```ts
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```
Add `/api/health` to the `publicRoutes` array in `middleware.ts`.

**Why safe:** New files only. No existing code modified.

**Commit & deploy Phase 6.**

---

## Phases NOT included (deferred)

These are real issues but lower risk and higher effort. Tackle after the above:
- **Testing framework** — Add vitest + @testing-library/react. Write tests for calculators and access control.
- **CI/CD pipeline** — Add GitHub Actions for lint + type-check + build on PR.
- **Transaction safety** — Wrap multi-step DB operations in Supabase RPC functions.
- **Request body size limits** — Add validation middleware for POST payloads.
- **Accessibility** — ARIA labels, focus management, semantic HTML audit.
- **LearnWorlds user lookup optimization** — Cache user lookups or use direct email query if API supports it.

---

## Execution Order Summary

| Phase | Risk | Impact | Effort |
|-------|------|--------|--------|
| 1. Remove debug endpoints & logs | None | Closes info leaks | ~30 min |
| 2. Signed session cookies | Low (has fallback) | Closes privilege escalation | ~2 hrs |
| 3. Fix XSS vectors | None | Closes injection paths | ~30 min |
| 4. Security headers | None | Adds defense layers | ~20 min |
| 5. Rate limiting | None | Blocks brute force | ~1 hr |
| 6. Error boundaries & health | None | Improves resilience | ~30 min |
