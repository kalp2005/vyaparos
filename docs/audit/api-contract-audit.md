# VyaparOS — API Contract Audit & Verification

This document audits all frontend API consumers against their canonical backend route handlers, HTTP methods, payloads, and status codes following Sprint 1.5 stabilization.

---

## 1. API Endpoint Audit Matrix

| Frontend Consumer | Target API Endpoint | Method | Auth Scheme | Request Payload / Params | Response Schema | Status Code | Verification Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| `src/context/AuthContext.tsx` | `/api/auth/login` | `POST` | Bearer Token / Cookie | `{ idToken, fullName, phone, email, globalRole }` | `{ success, user, memberships, activeBusiness, isNewUser }` | 200 / 401 | ✅ VERIFIED |
| `src/context/AuthContext.tsx` | `/api/auth/logout` | `POST` | Cookie Session | None | `{ success }` | 200 | ✅ VERIFIED |
| `src/context/AuthContext.tsx` | `/api/auth/me` | `GET` | Bearer Token / Cookie | None | `{ success, user, membership, activeBusiness, accessibleBusinesses }` | 200 / 401 | ✅ VERIFIED |
| `src/app/dashboard/page.tsx` | `/api/dashboard/stats` | `GET` | Bearer Token / Cookie | None | `{ success, summary, stats, topDefaulters, recentTransactions }` | 200 / 401 | ✅ VERIFIED (Fixed P0-2) |
| `src/app/dashboard/activity/page.tsx` | `/api/audit` | `GET` | Bearer Token / Cookie | `?limit=50` | `{ success, logs: [...], count }` | 200 / 401 | ✅ VERIFIED (Fixed P0-3) |
| `src/app/dashboard/customers/page.tsx` | `/api/customers` | `GET` | Bearer Token / Cookie | `?search=...&filter=due\|settled\|advance` | `{ success, customers: [...], count }` | 200 / 401 | ✅ VERIFIED |
| `src/components/customers/AddCustomerModal.tsx` | `/api/customers` | `POST` | Bearer Token / Cookie | `{ name, phoneNumber, openingBalance, notes, tags }` | `{ success, customer, message }` | 200 / 400 / 409 | ✅ VERIFIED (Fixed P0-1) |
| `src/app/dashboard/customers/[id]/page.tsx` | `/api/customers/[id]` | `GET` | Bearer Token / Cookie | None | `{ success, customer: { ...customer, summary, transactions } }` | 200 / 404 | ✅ VERIFIED |
| `src/app/dashboard/customers/[id]/page.tsx` | `/api/customers/[id]` | `PUT` | Bearer Token / Cookie | `{ name, phoneNumber, email, address, notes, tags }` | `{ success, customer, message }` | 200 / 404 | ✅ VERIFIED |
| `src/app/dashboard/khata/page.tsx` | `/api/transactions` | `GET` | Bearer Token / Cookie | `?customerId=...&type=...&limit=...` | `{ success, transactions: [...], count }` | 200 / 401 | ✅ VERIFIED |
| `src/components/khata/TransactionModal.tsx` | `/api/transactions` | `POST` | Bearer Token / Cookie | `{ customerId, transactionType, amount, paymentMode, paymentReference, description, idempotencyKey }` | `{ success, transaction, previousBalance, newBalance, isDuplicate, message }` | 201 / 200 (dup) / 400 | ✅ VERIFIED (Added P1-1) |
| `src/components/khata/ReversalModal.tsx` | `/api/transactions/[id]/reverse` | `POST` | Bearer Token / Cookie | `{ voidReason }` | `{ success, transaction, previousBalance, newBalance, message }` | 200 / 400 / 404 | ✅ VERIFIED |
| `src/components/ui/BusinessSwitcher.tsx` | `/api/businesses` | `GET` | Bearer Token / Cookie | None | `{ success, businesses: [...] }` | 200 / 401 | ✅ VERIFIED |
| `src/app/onboarding/page.tsx` | `/api/businesses` | `POST` | Bearer Token / Cookie | `{ name, legalName, businessType, gstin, phone, address, city, stateCode, pincode }` | `{ success, business, branch, message }` | 200 / 400 | ✅ VERIFIED |

---

## 2. Status
**Zero broken contracts.** All 14 API interactions across frontend components and backend handlers are aligned and verified with automated test suites.
