# VyaparOS — Phase 2 UI/UX Plan
## POS Counter Screen, Invoices Feed, Product Catalog & Print Engine

---

## 1. High-Speed Counter POS Screen (`/dashboard/billing/pos`)

### 1.1 Layout Design (Split Two-Column Desktop / Responsive)
- **Left Column (Product Search & Catalog Grid):**
  - **Quick Scan / Search Bar:** Auto-focused input listening for Barcode Scanners (USB/Bluetooth HID) and keyboard search queries.
  - **Category Pills:** Horizontal scrollable category filters (`All`, `Groceries`, `Dairy`, `Beverages`, etc.).
  - **Fast Product Cards:** Grid of products with live stock pill, selling price, and tax badge. Single click or Enter adds to cart.
- **Right Column (Active Bill / Cart Panel):**
  - **Party Header:** Walk-in Customer (Default) / Select Customer (Dropdown with search) / `+ Quick Add Customer` modal.
  - **Line Items Table:** Quantity increment/decrement buttons (`+` / `-`), rate override, line discount, and delete action.
  - **GST Breakdown Summary:** Subtotal, Discount, Taxable Value, CGST/SGST/IGST badges, Round-off, and **Grand Total in prominent bold display**.
  - **Payment Mode Selectors:** One-click buttons for `CASH`, `UPI`, `CREDIT / UDHAR`, `CARD`, `SPLIT`.
  - **Action Footer:**
    - `[ F8 Complete Sale & Print ]` (Primary Emerald Button)
    - `[ Save & WhatsApp Share ]`
    - `[ Clear Bill ]`

### 1.2 Keyboard Shortcuts
- `F2`: Focus Search / Barcode Input
- `F4`: Select / Search Customer
- `F8`: Finalize Bill & Trigger Payment
- `Esc`: Close Modals / Clear Search
- `Enter`: Add selected product to cart

---

## 2. Invoices Management Feed (`/dashboard/billing`)
- **Summary Metrics Bar:** Today's Sales (₹), Total Invoices Count, Unpaid/Credit Invoices Amount, GST Collected.
- **Filter & Search Bar:** Search by Invoice #, customer name, date range, payment status (`PAID`, `PARTIALLY_PAID`, `UNPAID`), and lifecycle status (`ISSUED`, `CANCELLED`).
- **Invoices Table:** Invoice #, Date, Customer, Items Count, Total (₹), Paid (₹), Status Badge, and Actions (`View`, `Print`, `Cancel`).

---

## 3. Product Catalog Management (`/dashboard/products`)
- **Product List:** Name, SKU, Barcode, Category, Stock Level with Low-Stock warning indicators, Selling Price, GST Rate.
- **Add/Edit Product Modal:** Clean form with HSN/SAC helper, tax-inclusive toggle, purchase/selling price, opening stock, and reorder level.

---

## 4. Printable Invoice Formats

### 4.1 58mm / 80mm ESC/POS Thermal Receipt
- Compact monospace format with store header, GSTIN, invoice #, timestamp, items table (`Item | Qty | Rate | Amt`), tax summary, payment mode, and QR code / barcode.

### 4.2 Standard A4 GST Tax Invoice
- Full Indian statutory layout with Original/Duplicate for Transporter headers, Buyer GSTIN, State Code, HSN/SAC table, Tax rate split (CGST, SGST, IGST), Amount in words, and Terms & Conditions.
