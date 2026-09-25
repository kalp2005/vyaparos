# VyaparOS — The Connected Operating System for Indian MSMEs

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![Firebase Auth](https://img.shields.io/badge/Auth-Firebase_Authentication-orange.svg)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-emerald.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-36%20Passing-brightgreen.svg)](https://vitest.dev/)

**VyaparOS** is an all-in-one multi-tenant business operating system architected for Indian retail merchants, Kirana shops, FMCG wholesalers, distributors, and service businesses.

---

## 🏛️ Core Architecture & Identity Model

```text
                    VYAPAROS
                       │
                       ↓
              Firebase Authentication (Identity & Auth Provider)
                       │
                       ↓ (Verified JWT ID Token)
                 Firebase UID
                       │
                       ↓ (Server-side Token Verification)
                 Application API
                       │
                       ↓ (Tenant Scoped & RLS Enforced)
                Supabase PostgreSQL (Relational Application Database)
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
       User / Roles          Business Data
```

### Identity vs Data Separation:
- **Firebase Authentication** is the **ONLY** authentication and identity provider. Handles phone numbers (+91 OTP), email/password login, password recovery, and secure JWT sessions.
- **Supabase PostgreSQL** is the application database. Handles relational storage, foreign keys, constraints, and Row-Level Security (RLS).
- **Firebase UID (`firebase_uid`)** serves as the canonical identity bridge to the Supabase `users` table.

---

## 👥 Dual-Layer Role & Authorization Architecture

### 1. Global Platform Roles
- **`ADMIN`**: Platform operators. Restricted to `/admin/*` platform health and tenant metrics.
- **`SHOPKEEPER`**: Merchants and business owners. Owns or belongs to business tenants.
- **`SHOPPER`**: Consumers. Restricted to `/shopper/*` to view personal khata statements across connected stores.

### 2. Operational Business Roles
Attached via `business_members`:
- **`OWNER`**: Full business ownership, settings, staff invitations, customer and ledger reversals.
- **`MANAGER`**: Operations management, transaction reversals, staff invites.
- **`CASHIER`**: Fast POS billing, customer creation, udhar/jama logging. Restricted from reversals.
- **`SALESPERSON`**: POS Counter billing & customer creation.
- **`ACCOUNTANT`**: Financial reporting, journal audits, expense logging.
- **`INVENTORY_MANAGER`**: Stock adjustments, purchase orders, supplier management.

---

## ⚡ Core Feature Modules

### Phase 1 — Double-Entry Khata & Customer Management
- Unified Customer Directory with search, filters (Due, Settled, Advance), and credit limits.
- Non-destructive transaction reversals with permanent audit entries.
- Automated WhatsApp payment reminders with dynamic balance amounts.

### Phase 2 — GST Billing, Invoicing & Thermal POS Counter
- **High-Speed Counter POS (`/dashboard/billing/pos`):** Barcode scanning, category pills, sub-second item lookup, keyboard shortcuts (F2, F4, F8, Esc, Enter).
- **Deterministic Indian GST Calculation Engine:** Accurate tax computation for tax-inclusive & tax-exclusive items, Intra-State (CGST + SGST) vs Inter-State (IGST), discounts, HSN/SAC grouping, and round-off.
- **Atomic Data Cascade:** Automatic product stock decrement, split payment logging (Cash/UPI/Card/Udhar), customer Khata ledger balance updates, and balanced double-entry journal posting.
- **Multi-Format Invoicing:** 58mm / 80mm ESC/POS Thermal Receipts + Standard A4 GST Tax Invoices with WhatsApp sharing.
- **Product Catalog (`/dashboard/products`):** SKU, Barcode, Selling/Purchase price, GST %, live stock tracking, and low-stock reorder warnings.

---

## 🌐 Multilingual Engine
VyaparOS provides single-language UI switching across:
- **English 🇬🇧**
- **हिन्दी 🇮🇳**
- **मराठी 🇮🇳**
- **Hinglish 🇮🇳**

---

## 🧪 Verification & Testing

```bash
# Run type check
npm run type-check

# Run test suite (36 automated tests)
npm test

# Production build
npm run build
```
