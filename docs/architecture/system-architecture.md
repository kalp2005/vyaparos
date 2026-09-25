# VyaparOS — System Architecture & Authentication Flow

## 1. High-Level Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                                                                         │
│  Firebase Client SDK ────────► Authenticated User (currentUser)         │
│                                        │                                │
│                                  getIdToken()                           │
│                                        │                                │
│  apiFetch() Wrapper ─────────► Authorization: Bearer <RAW_JWT_STRING>  │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │ HTTPS API Request
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER / BACKEND                         │
│                                                                         │
│  1. Extract & Sanitize Token ──► sanitizeToken() (strip "Bearer ", quotes)│
│  2. Token Diagnostics ────────► Safe shape validation (3 segments)     │
│  3. Firebase Admin SDK ───────► adminAuth.verifyIdToken(cleanJwt)       │
│  4. Canonical Identity ───────► decoded.uid                             │
│  5. Supabase User Profile ────► Query/Provision users WHERE uid = decoded.uid
│  6. Business Membership ──────► Validate user membership & roles       │
│  7. Authorization Engine ─────► checkPermission(roleKey, action)        │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │ Scoped / RLS Enforced Query
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE POSTGRESQL DB                            │
│                                                                         │
│  - users (firebase_uid indexed)                                         │
│  - businesses (multi-tenant isolated)                                   │
│  - business_members (role assignments: OWNER, MANAGER, CASHIER, etc.)  │
│  - customers (scoped per business)                                      │
│  - transactions & transaction_entries (double-entry ledger)             │
│  - audit_logs (immutable trail)                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Token Flow & Verification Standard

### The Golden Rule:
`adminAuth.verifyIdToken()` requires the **raw, clean dot-separated JWT string** (`eyJ...`). Passing `"Bearer eyJ..."`, stringified JSON objects, or raw UIDs causes Firebase Admin to reject the token with:
> `Decoding Firebase ID token failed. Make sure you passed the entire string JWT which represents an ID token.`

### Solution Architecture:
1. **Frontend (`src/lib/api-client.ts`):** `apiFetch` retrieves the current ID token via `firebaseAuth.currentUser.getIdToken(false)` and formats the standard header:
   ```http
   Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
   ```
   If a `401 Unauthorized` is encountered, `apiFetch` performs an automatic one-time force refresh `getIdToken(true)` and retries cleanly.
2. **Server Sanitization (`src/lib/firebase/verify-token.ts`):**
   `sanitizeToken(raw)` strips wrapping quotes, whitespace, and the `"Bearer "` prefix before passing only the raw JWT string to `adminAuth.verifyIdToken(token)`.
3. **Canonical Identity Mapping:** The user ID is strictly extracted from `decoded.uid` on the server and mapped to Supabase PostgreSQL `users.firebase_uid`.
