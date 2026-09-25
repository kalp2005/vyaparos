# VyaparOS — Master Audit Backlog & Remediation Actions

This document tracks all action items discovered during the comprehensive codebase audit, updated following Sprint 1.5 stabilization.

---

## P0 — Critical (Security, Financial Integrity, Broken Endpoints)

### Action P0-1: Fix Opening Balance Double-Application Bug
- **ID:** `FIN-P0-01`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Customer creation in [`src/app/api/customers/route.ts`](file:///c:/Users/HP/Desktop/vyaparos/src/app/api/customers/route.ts) now initializes `outstandingBalance: 0.0`. `createKhataTransaction` acts as the single source of truth, updating `outstandingBalance` atomically to the exact opening balance.
- **Evidence:** Covered by automated regression tests in `src/tests/ledger.test.ts` (`Opening Balance = ₹500` strictly yields ₹500 balance).

---

### Action P0-2: Fix Dashboard KPI Stats API Route Mismatch
- **ID:** `API-P0-02`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Unified endpoint to `/api/dashboard/stats` in both [`src/app/api/dashboard/stats/route.ts`](file:///c:/Users/HP/Desktop/vyaparos/src/app/api/dashboard/stats/route.ts) and [`src/app/dashboard/page.tsx`](file:///c:/Users/HP/Desktop/vyaparos/src/app/dashboard/page.tsx). Added `summary`, `topDefaulters`, and `recentTransactions` to the response schema. Zero 404s remaining.

---

### Action P0-3: Fix Activity Log API Route Mismatch
- **ID:** `API-P0-03`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Updated [`src/app/dashboard/activity/page.tsx`](file:///c:/Users/HP/Desktop/vyaparos/src/app/dashboard/activity/page.tsx) to call canonical `/api/audit` via `apiFetch`. Zero 404s remaining.

---

### Action P0-4: Isolate Supabase Service Role Key & Mark Server-Only
- **ID:** `SEC-P0-04`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Split into `src/lib/supabase/client.ts` (public browser client) and `src/lib/supabase/server.ts` (`getSupabaseAdmin()` protected with `import 'server-only'`). Hardcoded fallback credentials removed.

---

## P1 — High (Blocking Core Features & Robustness)

### Action P1-1: Add Idempotency Keys to Transactions
- **ID:** `FIN-P1-01`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Added `idempotencyKey` column with unique compound index `@@unique([businessId, idempotencyKey])` in `prisma/schema.prisma`. `createKhataTransaction` in `src/lib/ledger.ts` checks for existing keys and returns the existing transaction with `isDuplicate: true` without double-mutating balances.

---

### Action P1-2: Add Opening Balance & Invariant Regression Tests
- **ID:** `TST-P1-02`
- **Status:** ✅ **RESOLVED (Sprint 1.5)**
- **Resolution:** Added 5 new automated integration test cases in `src/tests/ledger.test.ts` covering zero opening balance, non-zero opening balance, subsequent payments/credit additions, debit=credit balance invariants, and idempotency deduplication. Total test count increased from 20 to 25 passing tests.

---

## P2 — Medium (Feature Expansion — Phase 2 & Beyond)

### Action P2-1: Implement Phase 2 — GST Billing, Invoicing & POS
- **ID:** `PRD-P2-01`
- **Status:** ⚪ PENDING APPROVAL FOR PHASE 2
- **Description:** Build GST Invoicing, HSN/SAC tracking, thermal receipt printing (58mm/80mm), and split payment checkout.

---

### Action P2-2: Implement Phase 3 — Inventory, Stock & Barcode Scanning
- **ID:** `PRD-P2-02`
- **Status:** ⚪ PENDING PHASE 3
- **Description:** Build Product catalog, barcode scanner, low stock warnings, and stock ledger movements.

---

## P3 — Low (Polish, Optimizations & Advanced Modules)

### Action P3-1: Background Offline Sync Queue Worker (Phase 8)
- **ID:** `OFF-P3-01`
- **Status:** ⚪ PENDING PHASE 8

### Action P3-2: AI Assistant & Natural Language Query Engine (Phase 7)
- **ID:** `AI-P3-02`
- **Status:** ⚪ PENDING PHASE 7
