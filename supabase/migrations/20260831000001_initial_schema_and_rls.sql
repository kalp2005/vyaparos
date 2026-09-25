-- ============================================================================
-- VyaparOS — Supabase PostgreSQL Schema & Row-Level Security Migration
-- Version: 2.0.0 (Firebase Auth UID Bridge + Dual-Layer Role Architecture)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS (Canonical Bridge to Firebase Auth UID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL, -- Canonical Firebase Auth identifier
    phone_number VARCHAR(15),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    global_role VARCHAR(20) NOT NULL DEFAULT 'SHOPKEEPER' CHECK (global_role IN ('ADMIN', 'SHOPKEEPER', 'SHOPPER')),
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2. BUSINESSES (Multi-Tenant Master)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(250),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    business_type VARCHAR(50) NOT NULL DEFAULT 'retail' CHECK (business_type IN ('retail', 'wholesale', 'distributor', 'services')),
    currency VARCHAR(5) DEFAULT 'INR',
    logo_url TEXT,
    upi_vpa VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(15),
    bank_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_gstin ON businesses(gstin);

-- ----------------------------------------------------------------------------
-- 3. BRANCHES & COUNTERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    branch_code VARCHAR(20),
    is_main_branch BOOLEAN DEFAULT false,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    contact_phone VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_branches_business ON branches(business_id);

-- ----------------------------------------------------------------------------
-- 4. ROLES & PERMISSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    role_key VARCHAR(50) NOT NULL CHECK (role_key IN ('OWNER', 'MANAGER', 'CASHIER', 'SALESPERSON', 'ACCOUNTANT', 'INVENTORY_MANAGER')),
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- 5. BUSINESS MEMBERSHIPS & INVITATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED')),
    invited_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_business_user ON business_members(business_id, user_id);

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email_or_phone VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    invited_by_user_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. SHOPPER ACCOUNTS (Consumer Linkage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopper_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'REVOKED')),
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, business_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_shopper_lookup ON shopper_accounts(user_id, business_id);

-- ----------------------------------------------------------------------------
-- 7. CUSTOMERS (Khata Master)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state_code VARCHAR(2),
    gstin VARCHAR(15),
    credit_limit DECIMAL(14,2) DEFAULT 0.00,
    payment_terms_days INT DEFAULT 0,
    opening_balance DECIMAL(14,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(14,2) DEFAULT 0.00,
    payment_reliability_score INT DEFAULT 750,
    tags TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(business_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(business_id, phone_number);

-- ----------------------------------------------------------------------------
-- 8. TRANSACTIONS & DOUBLE-ENTRY JOURNAL LEGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    party_type VARCHAR(20) DEFAULT 'CUSTOMER',
    customerId UUID REFERENCES customers(id) ON DELETE RESTRICT,
    invoiceId UUID,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('CREDIT_GIVEN', 'PAYMENT_RECEIVED', 'SUPPLIER_PAYMENT', 'EXPENSE', 'OPENING_BALANCE')),
    amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT')),
    payment_reference VARCHAR(100),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    is_voided BOOLEAN DEFAULT false,
    void_reason TEXT,
    voided_by_user_id UUID REFERENCES users(id),
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(business_id, customerId);

CREATE TABLE IF NOT EXISTS transaction_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', 'CASH_IN_HAND', 'BANK_ACCOUNT', 'ACCOUNTS_PAYABLE', 'GST_OUTPUT_CGST', 'GST_OUTPUT_SGST', 'EXPENSE_ACCOUNT')),
    entry_type VARCHAR(6) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_transaction ON transaction_entries(transaction_id);

-- ----------------------------------------------------------------------------
-- 9. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES users(id),
    global_role VARCHAR(20) NOT NULL,
    business_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_state TEXT,
    new_state TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_logs(business_id, created_at DESC);

-- ============================================================================
-- 10. SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to get current verified user ID from JWT sub claim
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
    SELECT id FROM users WHERE firebase_uid = auth.jwt()->>'sub' LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Business Isolation Policy
CREATE POLICY business_isolation_policy ON businesses
    FOR ALL
    USING (
        id IN (
            SELECT business_id FROM business_members 
            WHERE user_id = auth_user_id() AND status = 'ACTIVE'
        )
    );

-- Customer Access Policy
CREATE POLICY customer_isolation_policy ON customers
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM business_members 
            WHERE user_id = auth_user_id() AND status = 'ACTIVE'
        )
        OR
        id IN (
            SELECT customer_id FROM shopper_accounts 
            WHERE user_id = auth_user_id() AND status = 'ACTIVE'
        )
    );

-- Transaction Access Policy
CREATE POLICY transaction_isolation_policy ON transactions
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM business_members 
            WHERE user_id = auth_user_id() AND status = 'ACTIVE'
        )
        OR
        customerId IN (
            SELECT customer_id FROM shopper_accounts 
            WHERE user_id = auth_user_id() AND status = 'ACTIVE'
        )
    );
