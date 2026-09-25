-- ============================================================================
-- VyaparOS — Phase 2: GST Billing, Invoicing, Product Catalog & POS Counters
-- Migration: 20260831000002_phase2_billing_and_pos.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES & PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#0284c7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    brand VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    purchase_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(14,2) NOT NULL,
    is_tax_inclusive BOOLEAN NOT NULL DEFAULT false,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    cess_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    hsn_code VARCHAR(20),
    current_stock DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    minimum_stock DECIMAL(14,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_business_name ON products(business_id, name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(business_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(business_id, barcode);

-- ----------------------------------------------------------------------------
-- 2. INVOICES, LINE ITEMS & MULTI-PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    
    subtotal DECIMAL(14,2) NOT NULL,
    discount_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(14,2) NOT NULL,
    cgst_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    sgst_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    igst_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    cess_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    round_off DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(14,2) NOT NULL,
    paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'CANCELLED', 'VOID', 'REFUNDED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'UNPAID')),
    supply_type VARCHAR(30) NOT NULL DEFAULT 'INTRA_STATE' CHECK (supply_type IN ('INTRA_STATE', 'INTER_STATE')),
    billing_type VARCHAR(30) NOT NULL DEFAULT 'POS' CHECK (billing_type IN ('POS', 'TAX_INVOICE', 'BILL_OF_SUPPLY', 'ESTIMATE')),
    notes TEXT,
    terms_conditions TEXT,
    idempotency_key VARCHAR(128),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(business_id, invoice_number),
    UNIQUE(business_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_date ON invoices(business_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(business_id, customer_id);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    hsn_code VARCHAR(20),
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    quantity DECIMAL(14,2) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(14,2) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    cgst_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    igst_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    cess_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    amount DECIMAL(14,2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT')),
    payment_reference VARCHAR(100),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
    current_count INT NOT NULL DEFAULT 0,
    financial_year VARCHAR(20) NOT NULL,
    UNIQUE(business_id, prefix, financial_year)
);

-- Row-Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
