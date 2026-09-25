# VyaparOS — Phase 2 Architecture Specification
## GST Billing, Invoicing & Thermal POS Counter Engine

---

## 1. Executive Summary & Goals

Phase 2 transitions VyaparOS from a standalone double-entry Khata ledger into a full-scale **Commercial Invoicing and High-Speed Point of Sale (POS) Operating System** designed for Indian MSMEs, Kirana stores, FMCG wholesalers, and retail chains.

Phase 2 achieves three critical objectives:
1. **High-Speed Counter Billing:** Sub-second barcode/search lookup, keyboard navigation (F2, F4, F8, Esc, Enter), and instant dual-mode printing (58mm/80mm Thermal Receipts + GST Compliant A4 Tax Invoices).
2. **Deterministic Indian GST Calculation Engine:** Accurate tax computation for tax-inclusive and tax-exclusive pricing, intra-state (CGST + SGST) vs inter-state (IGST) supply, and HSN/SAC code tracking without JavaScript floating-point rounding errors.
3. **Atomic Multi-System Data Cascade:** When a sale is finalized, the engine atomically generates the invoice, records line-item snapshots, reduces stock on hand, logs multi-mode payments (Cash, UPI, Card, Bank, or Udhar/Credit), updates customer receivable balances in the Khata ledger, and writes balanced double-entry journal entries.

---

## 2. End-to-End System Architecture

```text
                               ┌───────────────────────────┐
                               │  Firebase Authentication  │
                               └─────────────┬─────────────┘
                                             │ Verified Token & UID
                                             ▼
                               ┌───────────────────────────┐
                               │ Business Tenant Isolation │
                               │   & Role RBAC (Cashier,   │
                               │   Owner, Salesperson)     │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌────────────────────────┐                  ┌────────────────────────┐
          │  Product Catalog &     │                  │  Customer Khata &      │
          │  Stock Level Tracking  │                  │  Party Directory       │
          └────────────┬───────────┘                  └────────────┬───────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │ Selected Items & Party
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │       GST Tax Calculation Engine          │
                       │ (Intra vs Inter-State, Inclusive/Exclusive│
                       │    Exact Integer/Decimal Arithmetic)      │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │        Atomic Transaction Pipeline        │
                       │  (db.$transaction / Supabase PostgreSQL)  │
                       ├───────────────────────────────────────────┤
                       │ 1. Sequential Unique Invoice Numbering    │
                       │ 2. Invoice Master & Snapshot Line Items   │
                       │ 3. Atomic Stock Decrement & Low-Stock Tag │
                       │ 4. Multi-Payment Split (Cash/UPI/Udhar)   │
                       │ 5. Khata Double-Entry Ledger Journal Legs │
                       │ 6. Customer Outstanding Balance Recalc    │
                       │ 7. DPDP-Compliant Immutable Audit Log     │
                       └─────────────────────┬─────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌────────────────────────┐                  ┌────────────────────────┐
          │ Thermal POS Receipt    │                  │  GST A4 Tax Invoice    │
          │ (58mm / 80mm ESC/POS)  │                  │  (PDF / WhatsApp Link) │
          └────────────────────────┘                  └────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1 Product Catalog & Stock Foundation
- **Product Entity:** SKU, Barcode, Name, Category, Unit (Pcs, Kg, Ltr, Box, Gram, Dozen), Purchase Price, Selling Price, Tax Inclusive flag, GST Rate (0%, 5%, 12%, 18%, 28%), HSN/SAC Code, Minimum Stock reorder alert level.
- **Stock Foundation:** Live `currentStock` decremented on each completed sale and incremented on cancellations or Phase 3 purchase bills.

### 3.2 Indian GST Calculation Engine (`src/lib/gst.ts`)
- **Deterministic Math:** All financial values calculated in Paise (integers) or Decimal with exact half-up rounding.
- **Place of Supply Rule:**
  - `Intra-State` (Business State Code == Customer State Code or Walk-in): Tax split equally into `CGST` (50%) and `SGST` (50%).
  - `Inter-State` (Business State Code != Customer State Code): 100% Tax mapped to `IGST`.
- **Tax Mode Math:**
  - *Exclusive:* `TaxableAmount = Quantity * UnitPrice * (1 - Discount/100)`, `Tax = TaxableAmount * (GSTRate/100)`, `Total = TaxableAmount + Tax`.
  - *Inclusive:* `TaxableAmount = (Quantity * UnitPrice * (1 - Discount/100)) / (1 + GSTRate/100)`, `Tax = Gross - TaxableAmount`.

### 3.3 Atomic Invoicing & Khata Ledger Integration
- When an invoice has payment mode `CREDIT` (or a split partial credit):
  - A transaction of type `CREDIT_GIVEN` is posted to `transactions` table with `invoiceId`.
  - Customer's `outstandingBalance` is increased by the unpaid balance.
  - Double-entry legs: **Debit Accounts Receivable**, **Credit Sales Revenue**, **Credit GST Output Liability**.
- When payment is immediate (`CASH` or `UPI`):
  - Double-entry legs: **Debit Cash in Hand / Bank Account**, **Credit Sales Revenue**, **Credit GST Output Liability**.

### 3.4 Concurrency-Safe Invoice Numbering (`src/lib/invoice-number.ts`)
- Format: `INV-{YYYY}-{000001}` or customizable business prefix.
- Generated on the server using database serial sequences / atomic increments inside the database transaction to prevent collisions during concurrent counter billing.

---

## 4. Security & Role Permissions

| Operation | OWNER | MANAGER | CASHIER | SALESPERSON | ACCOUNTANT | SHOPPER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Product Catalog Read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Product Catalog Write | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create POS Invoice | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancel/Void Invoice | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Record Payment | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Financial Reports | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View Own Invoices | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
