# VyaparOS — Sprint 1.5 Stabilization & Remediation Report

**Date:** August 31, 2026  
**Sprint Objective:** Hardening the Core Ledger MVP foundation before Phase 2 feature expansion.

---

## 1. Issues Fixed & Root Causes

### 1.1 Customer Opening Balance Double-Application (`FIN-P0-01`)
- **Root Cause:** In [`src/app/api/customers/route.ts`](file:///c:/Users/HP/Desktop/vyaparos/src/app/api/customers/route.ts), `db.customer.create` set `outstandingBalance: initialBalance`, and then immediately called `createKhataTransaction(amount: initialBalance)`, which added `initialBalance` to the customer balance a second time (e.g. ₹500 became ₹1,000).
- **Remediation:** Changed `db.customer.create` to set `outstandingBalance: 0.0`. `createKhataTransaction` now exclusively calculates and updates the derived balance atomically to ₹500.

### 1.2 Dashboard API Endpoint Mismatch (`API-P0-02`)
- **Root Cause:** [`src/app/dashboard/page.tsx`](file:///c:/Users/HP/Desktop/vyaparos/src/app/dashboard/page.tsx) called `/api/dashboard/summary` (which did not exist), while the backend handler was at [`src/app/api/dashboard/stats/route.ts`](file:///c:/Users/HP/Desktop/vyaparos/src/app/api/dashboard/stats/route.ts).
- **Remediation:** Standardized the endpoint to `/api/dashboard/stats`, enriched the backend handler with `summary`, `topDefaulters`, and `recentTransactions`, and updated `DashboardPage` to fetch `/api/dashboard/stats` via `apiFetch`.

### 1.3 Activity Log Endpoint Mismatch (`API-P0-03`)
- **Root Cause:** [`src/app/dashboard/activity/page.tsx`](file:///c:/Users/HP/Desktop/vyaparos/src/app/dashboard/activity/page.tsx) called `/api/audit/logs` (which returned 404), while the API route was at [`src/app/api/audit/route.ts`](file:///c:/Users/HP/Desktop/vyaparos/src/app/api/audit/route.ts).
- **Remediation:** Updated `ActivityPage` to call `/api/audit` via `apiFetch`.

### 1.4 Supabase Service Role Key Isolation (`SEC-P0-04`)
- **Root Cause:** `src/lib/supabase.ts` exported both browser and admin clients in a shared module with fallback credentials.
- **Remediation:** Split into `src/lib/supabase/client.ts` (public client) and `src/lib/supabase/server.ts` (admin client importing `server-only`). Hardcoded credentials removed.

### 1.5 Missing Financial Idempotency (`FIN-P1-01`)
- **Root Cause:** Rapid duplicate clicks or network retries could create duplicate transactions and double-mutate customer balances.
- **Remediation:** Added `idempotencyKey` to `Transaction` schema with unique compound index `@@unique([businessId, idempotencyKey])`. In `createKhataTransaction`, if an idempotency key is matched, the existing transaction is returned without modifying balances.

---

## 2. Database Changes
- **Prisma Schema (`prisma/schema.prisma`):**
  - Added `idempotencyKey String? @map("idempotency_key")` to `Transaction`.
  - Added `@@unique([businessId, idempotencyKey])` to `Transaction`.
- Database schema pushed and validated via `prisma db push`.

---

## 3. Automated Test Coverage
- **Total Passing Tests:** **25 / 25 passed across 7 test suites (100%)**
  1. `src/tests/ledger.test.ts` (9 tests) — verifies Udhar, Jama, Reversal, Opening Balance ₹0, Opening Balance ₹500, Opening Balance + Jama, Opening Balance + Udhar, Total Debits == Total Credits invariant, and Idempotency deduplication.
  2. `src/tests/auth.test.ts` (5 tests) — verifies Firebase token extraction, Bearer sanitization, dev tokens, profile provisioning, and unique constraints.
  3. `src/tests/tenancy.test.ts` (2 tests) — verifies multi-tenant boundary isolation.
  4. `src/tests/roles.test.ts` (2 tests) — verifies role assignments.
  5. `src/tests/admin.test.ts` (2 tests) — verifies platform governance & audit logging.
  6. `src/tests/shopper.test.ts` (2 tests) — verifies consumer account linkage.
  7. `src/tests/permissions.test.ts` (3 tests) — verifies granular business role permissions.

---

## 4. Build & Static Validation
- `npm run type-check`: **0 errors**
- `npm test`: **25 / 25 passing**
- `npm run build`: **Next.js 15 production build compiled and prerendered all 26 routes with 0 errors**

---

## 5. Remaining Risks & Phase 2 Readiness
- **Production SMS Gateway Quota:** Phone OTP authentication logic is ready; production verification requires active Firebase Blaze plan with SMS quota.
- **Ready for Phase 2:** **YES**. Core Ledger MVP is stabilized, verified, and hardened.
