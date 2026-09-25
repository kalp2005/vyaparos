# VyaparOS — Phase 2 Database Schema Plan
## Models, Relationships, Migrations & Tenancy Isolation

---

## 1. Schema Analysis & Compatibility Audit

### 1.1 Existing Models (Preserved without Conflict)
- `User`: Global Firebase Auth bridge.
- `Business`: Multi-tenant business master with `gstin`, `upiVpa`, `currency`.
- `Branch`: Physical counter and godown locations with `stateCode`, `stateName`.
- `Customer`: Khata party directory with `openingBalance`, `outstandingBalance`, `gstin`, `stateCode`.
- `Transaction`: Ledger entry with `invoiceId` foreign key placeholder already in place!
- `TransactionEntry`: Double-entry balanced legs (Debit/Credit).
- `AuditLog`: Immutable audit trail.

### 1.2 New Models for Phase 2
1. **`Category`**: Product categorization hierarchy per business.
2. **`Product`**: SKU, Barcode, Name, Unit, Purchase/Selling Price, Tax Inclusive, GST Rate, HSN/SAC, Stock, Reorder Level.
3. **`Invoice`**: Master sales invoice with numbering, subtotal, discounts, CGST, SGST, IGST, CESS, roundoff, grand total, lifecycle status, payment status.
4. **`InvoiceItem`**: Historical snapshot line items preserving item name, SKU, HSN, rate, GST %, and calculated taxes.
5. **`InvoicePayment`**: Multi-payment records supporting split payments (Cash + UPI + Credit) linked to `Invoice`.
6. **`InvoiceSequence`**: Atomic sequence counter per business per financial year.

---

## 2. Prisma Schema Definition (`prisma/schema.prisma`)

```prisma
// -------------------------------------------------------------
// 5. Product Catalog & Inventory Foundation
// -------------------------------------------------------------
model Category {
  id          String    @id @default(uuid())
  businessId  String    @map("business_id")
  name        String
  description String?
  color       String?   @default("#0284c7")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  products    Product[]

  @@unique([businessId, name])
  @@index([businessId])
  @@map("categories")
}

model Product {
  id             String        @id @default(uuid())
  businessId     String        @map("business_id")
  categoryId     String?       @map("category_id")
  name           String
  sku            String?
  barcode        String?
  brand          String?
  unit           String        @default("PCS") // 'PCS', 'KG', 'GM', 'LTR', 'ML', 'BOX', 'DOZEN', 'MTR'
  purchasePrice  Float         @default(0.0) @map("purchase_price")
  sellingPrice   Float         @map("selling_price")
  isTaxInclusive Boolean       @default(false) @map("is_tax_inclusive")
  gstRate        Float         @default(0.0) @map("gst_rate") // 0, 5, 12, 18, 28
  cessRate       Float         @default(0.0) @map("cess_rate")
  hsnCode        String?       @map("hsn_code")
  currentStock   Float         @default(0.0) @map("current_stock")
  minimumStock   Float         @default(5.0) @map("minimum_stock")
  isActive       Boolean       @default(true) @map("is_active")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  business       Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  category       Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  invoiceItems   InvoiceItem[]

  @@unique([businessId, barcode])
  @@index([businessId, name])
  @@index([businessId, sku])
  @@index([businessId, barcode])
  @@map("products")
}

// -------------------------------------------------------------
// 6. Invoices, Line Items & Multi-Payment Split
// -------------------------------------------------------------
model Invoice {
  id              String           @id @default(uuid())
  businessId      String           @map("business_id")
  branchId        String?          @map("branch_id")
  customerId      String?          @map("customer_id")
  invoiceNumber   String           @map("invoice_number")
  invoiceDate     DateTime         @default(now()) @map("invoice_date")
  dueDate         DateTime?        @map("due_date")
  
  // Financial Summary
  subtotal        Float            // Sum of (qty * rate) before discounts
  discountTotal   Float            @default(0.0) @map("discount_total")
  taxableAmount   Float            @map("taxable_amount")
  cgstTotal       Float            @default(0.0) @map("cgst_total")
  sgstTotal       Float            @default(0.0) @map("sgst_total")
  igstTotal       Float            @default(0.0) @map("igst_total")
  cessTotal       Float            @default(0.0) @map("cess_total")
  roundOff        Float            @default(0.0) @map("round_off")
  grandTotal      Float            @map("grand_total")
  paidAmount      Float            @default(0.0) @map("paid_amount")
  balanceDue      Float            @default(0.0) @map("balance_due")
  
  // Status & Tax Classification
  status          String           @default("ISSUED") // 'DRAFT', 'ISSUED', 'CANCELLED', 'VOID', 'REFUNDED'
  paymentStatus   String           @default("UNPAID") // 'PAID', 'PARTIALLY_PAID', 'UNPAID'
  supplyType      String           @default("INTRA_STATE") @map("supply_type") // 'INTRA_STATE', 'INTER_STATE'
  billingType     String           @default("POS") @map("billing_type") // 'POS', 'TAX_INVOICE', 'BILL_OF_SUPPLY', 'ESTIMATE'
  notes           String?
  termsConditions String?          @map("terms_conditions")
  idempotencyKey  String?          @map("idempotency_key")
  createdByUserId String           @map("created_by_user_id")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  business        Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  branch          Branch?          @relation(fields: [branchId], references: [id], onDelete: SetNull)
  customer        Customer?        @relation(fields: [customerId], references: [id], onDelete: SetNull)
  creator         User             @relation("InvoiceCreator", fields: [createdByUserId], references: [id], onDelete: Restrict)
  items           InvoiceItem[]
  payments        InvoicePayment[]
  transactions    Transaction[]

  @@unique([businessId, invoiceNumber])
  @@unique([businessId, idempotencyKey])
  @@index([businessId, invoiceDate DESC])
  @@index([businessId, customerId])
  @@map("invoices")
}

model InvoiceItem {
  id             String   @id @default(uuid())
  invoiceId      String   @map("invoice_id")
  productId      String?  @map("product_id")
  
  // Historical Snapshot fields
  itemName       String   @map("item_name")
  sku            String?
  hsnCode        String?  @map("hsn_code")
  unit           String   @default("PCS")
  quantity       Float
  unitPrice      Float    @map("unit_price")
  discountPercent Float   @default(0.0) @map("discount_percent")
  discountAmount Float    @default(0.0) @map("discount_amount")
  taxableAmount  Float    @map("taxable_amount")
  gstRate        Float    @default(0.0) @map("gst_rate")
  cgstAmount     Float    @default(0.0) @map("cgst_amount")
  sgstAmount     Float    @default(0.0) @map("sgst_amount")
  igstAmount     Float    @default(0.0) @map("igst_amount")
  cessAmount     Float    @default(0.0) @map("cess_amount")
  totalAmount    Float    @map("total_amount")
  createdAt      DateTime @default(now()) @map("created_at")

  invoice        Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product        Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([invoiceId])
  @@index([productId])
  @@map("invoice_items")
}

model InvoicePayment {
  id               String   @id @default(uuid())
  invoiceId        String   @map("invoice_id")
  businessId       String   @map("business_id")
  amount           Float
  paymentMode      String   @default("CASH") @map("payment_mode") // 'CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'
  paymentReference String?  @map("payment_reference")
  paymentDate      DateTime @default(now()) @map("payment_date")
  notes            String?
  createdByUserId  String   @map("created_by_user_id")
  createdAt        DateTime @default(now()) @map("created_at")

  invoice          Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@index([businessId])
  @@map("invoice_payments")
}

model InvoiceSequence {
  id           String @id @default(uuid())
  businessId   String @map("business_id")
  prefix       String @default("INV")
  currentCount Int    @default(0) @map("current_count")
  financialYear String @map("financial_year") // e.g. '2026-2027'

  @@unique([businessId, prefix, financialYear])
  @@map("invoice_sequences")
}
```

---

## 3. Migration & Concurrency Strategy

1. **Migration Path:** Apply `prisma db push` / generate Supabase SQL migration without dropping existing `customers`, `transactions`, or `users`.
2. **Atomic Invoicing Transaction:** All invoice creation, line items, stock decrements, ledger entries, and customer balance updates execute inside a single atomic `db.$transaction`.
