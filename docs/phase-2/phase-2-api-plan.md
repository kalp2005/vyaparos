# VyaparOS — Phase 2 API Plan
## RESTful Endpoints, Request/Response Schemas & Contracts

---

## 1. Product & Category APIs

### 1.1 `GET /api/products`
- **Query Params:** `query` (name/SKU/barcode search), `categoryId`, `isActive`, `lowStock` (boolean), `limit`, `offset`.
- **Response:**
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "uuid",
        "name": "Tata Salt 1kg",
        "sku": "TS-1KG",
        "barcode": "8901030000000",
        "unit": "PCS",
        "purchasePrice": 22.00,
        "sellingPrice": 28.00,
        "isTaxInclusive": true,
        "gstRate": 5.0,
        "hsnCode": "2501",
        "currentStock": 45,
        "minimumStock": 10,
        "category": { "id": "uuid", "name": "Groceries" }
      }
    ],
    "total": 1
  }
  ```

### 1.2 `POST /api/products`
- **Payload:** `{ name, categoryId?, sku?, barcode?, brand?, unit?, purchasePrice?, sellingPrice, isTaxInclusive?, gstRate?, cessRate?, hsnCode?, currentStock?, minimumStock? }`
- **Security:** Requires `inventory.create` permission.

### 1.3 `PUT /api/products/[id]` & `DELETE /api/products/[id]`
- Edit product metadata, pricing, or soft-archive (`isActive: false`).

---

## 2. Invoicing & POS Counter APIs

### 2.1 `POST /api/invoices` (The Atomic POS & General Billing Engine)
- **Header:** `Idempotency-Key: <unique-uuid>`
- **Payload:**
  ```json
  {
    "customerId": "uuid | null",
    "invoiceDate": "2026-08-31T12:00:00Z",
    "billingType": "POS",
    "supplyType": "INTRA_STATE",
    "items": [
      {
        "productId": "uuid | null",
        "itemName": "Tata Salt 1kg",
        "hsnCode": "2501",
        "quantity": 2,
        "unitPrice": 28.00,
        "discountPercent": 0,
        "gstRate": 5.0,
        "isTaxInclusive": true
      }
    ],
    "payments": [
      {
        "paymentMode": "CASH",
        "amount": 56.00,
        "paymentReference": null
      }
    ],
    "notes": "Thank you for shopping!"
  }
  ```
- **Execution Lifecycle:**
  1. Validate Firebase Auth & Tenant Membership.
  2. Compute exact tax breakdown (CGST, SGST, IGST, RoundOff, GrandTotal) via `calculateGstInvoice`.
  3. Acquire next atomic invoice number (e.g. `INV-2026-000042`).
  4. Begin `db.$transaction`:
     - Create `Invoice` record.
     - Create `InvoiceItem` snapshot records.
     - Decrement stock for tracked products (`currentStock = currentStock - item.quantity`).
     - Create `InvoicePayment` records.
     - If payment includes `CREDIT`, create Khata `Transaction` (`CREDIT_GIVEN`), update customer `outstandingBalance`, and post balanced journal entries.
     - If payment includes `CASH`/`UPI`, post balanced journal entries (Debit Cash/Bank, Credit Revenue & GST Output).
     - Write audit trail record.
- **Response:**
  ```json
  {
    "success": true,
    "invoice": {
      "id": "uuid",
      "invoiceNumber": "INV-2026-000042",
      "grandTotal": 56.00,
      "paidAmount": 56.00,
      "balanceDue": 0.00,
      "paymentStatus": "PAID"
    }
  }
  ```

### 2.2 `GET /api/invoices`
- **Query Params:** `query`, `customerId`, `status`, `paymentStatus`, `startDate`, `endDate`, `limit`, `offset`.

### 2.3 `GET /api/invoices/[id]`
- Returns complete invoice with line items, tax breakup, payment records, customer profile, and business GSTIN header for rendering and printing.

### 2.4 `POST /api/invoices/[id]/cancel`
- Voids the invoice, restores product inventory (`currentStock = currentStock + quantity`), reverses Khata customer balance if credit, and logs immutable audit trail.
