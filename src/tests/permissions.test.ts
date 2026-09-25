import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from '../lib/types/permissions';

describe('VyaparOS — Dual-Layer Permissions Engine', () => {
  it('grants full permissions to OWNER', () => {
    expect(hasPermission('OWNER', PERMISSIONS.BUSINESS_UPDATE)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.CUSTOMER_DELETE)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.TRANSACTION_REVERSE)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.STAFF_INVITE)).toBe(true);
  });

  it('allows CASHIER to bill and create transactions but forbids reversals and staff invites', () => {
    expect(hasPermission('CASHIER', PERMISSIONS.TRANSACTION_CREATE)).toBe(true);
    expect(hasPermission('CASHIER', PERMISSIONS.INVOICE_CREATE)).toBe(true);
    expect(hasPermission('CASHIER', PERMISSIONS.CUSTOMER_READ)).toBe(true);

    // Forbidden for Cashier
    expect(hasPermission('CASHIER', PERMISSIONS.TRANSACTION_REVERSE)).toBe(false);
    expect(hasPermission('CASHIER', PERMISSIONS.STAFF_INVITE)).toBe(false);
    expect(hasPermission('CASHIER', PERMISSIONS.BUSINESS_UPDATE)).toBe(false);
  });

  it('allows ACCOUNTANT to view reports and ledgers but forbids customer creation or billing', () => {
    expect(hasPermission('ACCOUNTANT', PERMISSIONS.REPORT_READ)).toBe(true);
    expect(hasPermission('ACCOUNTANT', PERMISSIONS.TRANSACTION_READ)).toBe(true);

    expect(hasPermission('ACCOUNTANT', PERMISSIONS.INVOICE_CREATE)).toBe(false);
    expect(hasPermission('ACCOUNTANT', PERMISSIONS.TRANSACTION_REVERSE)).toBe(false);
  });
});
