# VyaparOS — Phased Engineering Roadmap

**Document Version:** 1.0.0  
**Execution Strategy:** Research-Driven, Incremental, Production-Grade Architecture

---

```mermaid
gantt
    title VyaparOS Engineering & Release Roadmap
    dateFormat  YYYY-MM-DD
    section Foundation
    Phase 0: Research, Architecture & Design System :active, p0, 2026-09-01, 2026-09-14
    Phase 1: Auth, Multi-Tenant Core, Customers & Khata :p1, 2026-09-15, 2026-10-05
    section Commerce & Inventory
    Phase 2: GST Billing, POS Counter & Cashbook :p2, 2026-10-06, 2026-10-26
    Phase 3: Inventory, Batch Tracking & Suppliers :p3, 2026-10-27, 2026-11-16
    section Intelligence & Operations
    Phase 4: Financial Reports, GSTR & Analytics :p4, 2026-11-17, 2026-12-07
    Phase 5: Staff RBAC & Multi-Branch Godowns :p5, 2026-12-08, 2026-12-28
    section Advanced Capabilities
    Phase 6: Offline-First IndexedDB Sync Engine :p6, 2026-12-29, 2027-01-18
    Phase 7: Safe AI Copilot & Indian Voice Entry :p7, 2027-01-19, 2027-02-08
    Phase 8: Customer Portal, Ack & Risk Score :p8, 2027-02-09, 2027-03-01
    Phase 9: SaaS Plans, Admin & Hardening :p9, 2027-03-02, 2027-03-22
```

---

## Detailed Phase Breakdown

### Phase 0: Research, Architecture, Design System & Database Schema
*   **Deliverables:**
    - Comprehensive competitor analysis and market benchmarking (/docs/research/competitor-analysis.md).
    - Indian MSME field research, tax regulations, and terminology (/docs/research/product-research.md).
    - Complete System Architecture specification (/docs/architecture/system-architecture.md).
    - Production relational database schema & ERD (/docs/architecture/database.md).
    - Offline-first protocol specification (/docs/architecture/offline-sync.md).
    - Security and data protection compliance blueprint (/docs/architecture/security.md).
    - Master repository README and developer setup documentation.

### Phase 1: Authentication, Multi-Tenant Setup, Customers & Digital Khata
*   **Deliverables:**
    - Indian mobile OTP authentication + secure email session management.
    - Multi-tenant business initialization and branch setup wizard.
    - Customer directory master with GSTIN verification regex, credit limits, and tags.
    - Digital Khata ledger engine: *Udhar* (Credit given) and *Jama* (Payment received) entries.
    - Running balance calculation, customer 360° statement view, and PDF statement generation.
    - Multilingual i18n core (English, Hindi, Marathi).

### Phase 2: GST Billing, Fast POS Counter, Cashbook & Expenses
*   **Deliverables:**
    - Dual billing modes: Sub-5-second POS counter mode + detailed GST Tax Invoicing.
    - GST calculation engine (Intra-state CGST/SGST vs Inter-state IGST, HSN tax slabs).
    - Invoice status lifecycle (Draft, Issued, Partially Paid, Paid, Overdue, Void).
    - Multi-format printing: ESC/POS 2" and 3" thermal receipts, A4 and A5 PDF layouts.
    - One-click WhatsApp sharing with pre-formatted bilingual message and invoice link.
    - Daily Cashbook (*Rokad*) and categorized business expense tracker with receipt attachments.

### Phase 3: Inventory Management, Batch/Expiry, Suppliers & Purchases
*   **Deliverables:**
    - Product catalog master: SKU, Barcode, Units with conversion (Box to Pcs), MRP, Buy/Sell price.
    - Optional Batch & Expiry tracking engine for pharma and FMCG with near-expiry alerts.
    - Automatic inventory depletion cascade upon invoice generation.
    - Supplier directory, Purchase Orders (PO), and Purchase Bill recording.
    - Manual stock adjustment workflows (Stock in, Damaged goods, Physical audit reconciliation).

### Phase 4: Financial Reporting, GST Filing Exports & Real-Time Analytics
*   **Deliverables:**
    - Interactive business dashboard with real-time financial health cards.
    - Statutory GST Reports: GSTR-1, GSTR-3B summary tables, and JSON/CSV export formats.
    - Financial Reports: Profit & Loss statement, Daybook, Balance Sheet, Item-wise Profit Margin.
    - Aging analysis reports for receivables (0–30, 31–60, 61–90, 90+ days overdue).
    - Multi-format data exports (PDF, Excel, CSV).

### Phase 5: Staff Management, Granular RBAC & Multi-Branch Operations
*   **Deliverables:**
    - Staff user management with mobile invitations.
    - Role-Based Access Control (Owner, Branch Manager, Cashier, Salesman, Accountant/CA).
    - Granular permission matrix enforcing least privilege.
    - Multi-Branch and godown management with inter-branch stock transfers (*Challans*).
    - Immutable audit logs tracking all user mutations and sensitive actions.

### Phase 6: Offline-First Synchronization Engine
*   **Deliverables:**
    - Client-side IndexedDB database integration using Dexie.js.
    - Optimistic UI updates allowing seamless offline transaction, customer, and bill creation.
    - Transaction outbox sync queue with automatic retry logic and backoff.
    - Server-side idempotent sync handler with vector clock conflict resolution.
    - Visual connection indicator (Online 🟢, Syncing 🟡, Offline 🔴, Sync Error ⚠️).

### Phase 7: Safe AI Business Copilot & Indian Voice Transaction Entry
*   **Deliverables:**
    - AI Copilot interface embedded directly into the merchant dashboard.
    - Zero-hallucination semantic query engine: Translating natural language to validated SQL.
    - Pre-built business query library ("*Who owes me the most?*", "*What products need reordering?*").
    - Multilingual voice-to-transaction assistant parsing spoken Hindi/Marathi/English commands.
    - Mandatory transaction confirmation modal preventing accidental financial commits.

### Phase 8: Customer Self-Service Portal & Merchant Credit Intelligence
*   **Deliverables:**
    - Tokenized, secure customer web portal for statement and invoice viewing.
    - Digital transaction acknowledgement system (Customer "Confirm ✓" or "Dispute ⚠" flow).
    - Merchant-side Payment Reliability Index (100–900 score) based on repayment behavior.
    - Dynamic UPI payment deep-linking with automated reconciliation.

### Phase 9: SaaS Subscription Billing, Admin Panel & Production Hardening
*   **Deliverables:**
    - Subscription and feature entitlement engine (Free, Pro, Business, Enterprise tiers).
    - Super-Admin control center for system health, business monitoring, and support tickets.
    - In-app Help Center, knowledge base, and guided interactive onboarding tours.
    - Security audits: OWASP Top 10 compliance, rate limiting, penetration testing, and DPDP validation.
    - Production deployment configurations on modern cloud infrastructure (Vercel / Node.js + managed PostgreSQL).
