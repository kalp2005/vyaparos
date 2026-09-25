# VyaparOS — Next Phase Strategic Execution Plan

---

## 1. Executive Direction

Based on the audit findings, we must **NOT** jump straight into adding large new subsystems (e.g. GST Billing or AI) before rectifying the 4 discovered P0 items in the Core Ledger foundation.

The recommended roadmap sequence is structured into:
1. **Stabilization & Foundation Hardening (Immediate Next Sprint)**
2. **Phase 2 — GST Billing, Invoicing & Thermal POS Counter**
3. **Phase 3 — Inventory, Stock Movements & Barcodes**
4. **Phase 4 — Suppliers, Purchase Ledgers & Expense Management**
5. **Phase 5 — Financial Reports, Analytics & GST Export (GSTR-1, GSTR-3B)**

---

## 2. Immediate Next Sequence (Sprint 1.5: Stabilization)

```text
Step 1: Fix Customer Opening Balance Bug (P0-1)
   └── Ensure db.customer.create sets outstandingBalance: 0 before createKhataTransaction runs.

Step 2: Align Dashboard & Activity API Route Endpoints (P0-2, P0-3)
   └── Unify /api/dashboard/summary -> /api/dashboard/stats and /api/audit/logs -> /api/audit.

Step 3: Encapsulate Supabase Server Client (P0-4)
   └── Split src/lib/supabase.ts into client.ts and server.ts with 'server-only'.

Step 4: Add Idempotency Key to Transactions (P1-1)
   └── Prevent duplicate billing submissions from network retries.

Step 5: Run Automated Tests & Verify 100% Green
   └── Add test cases for customer opening balances and API response shapes.
```

---

## 3. Phase 2 Plan — GST Billing, Invoicing & Thermal POS Counter

Once Sprint 1.5 stabilization is complete and approved:

### 3.1 Data Architecture
- Add `Invoice`, `InvoiceItem`, `TaxRate`, and `Payment` models to `prisma/schema.prisma` and Supabase SQL migrations.
- Support CGST, SGST, IGST calculations with HSN/SAC code tracking.
- State-of-the-art thermal invoice printing format (58mm / 80mm standard for counter receipt printers).

### 3.2 UI / Workflow
- **POS Quick Biller (`/dashboard/billing/new`):**
  - Instant barcode scan / item lookup.
  - Cash / UPI / Khata Split payment toggle (e.g., ₹200 paid in Cash + ₹300 added to customer's Udhar Khata).
  - One-click WhatsApp PDF bill share.
- **Invoices Feed (`/dashboard/billing`):**
  - Paid, Unpaid, Partially Paid, and Cancelled status filtering.

---

## 4. Phase 3 Plan — Inventory & Stock Management
- Product catalog with categories, SKU, barcode generator/reader, unit metrics (kg, pcs, liters, bags).
- Automated stock decrement on bill generation and stock increment on purchase.
- Low-stock alerts and reorder level notifications.

---

## 5. Phase 4 Plan — Suppliers, Purchases & Expenses
- Supplier accounts with purchase bills and payments (`Dena Hai` ledger).
- Daily business expense categorizer (Rent, Electricity, Wages, Tea/Snacks).
- Cash in Hand reconciliation matching drawer cash with daily sales and expense cashouts.
