import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { hasPermission, PERMISSIONS } from '../lib/types/permissions';
import { cleanDatabase } from './setup';

describe('VyaparOS — Dual-Layer Role & Business Membership Engine', () => {
  let user: any;
  let business: any;
  let ownerRole: any;
  let cashierRole: any;

  beforeEach(async () => {
    await cleanDatabase();

    user = await db.user.create({
      data: {
        firebaseUid: 'fb_user_role_test',
        fullName: 'Shopkeeper User',
        globalRole: 'SHOPKEEPER',
      },
    });

    business = await db.business.create({
      data: {
        ownerUserId: user.id,
        name: 'Test Business Store',
      },
    });

    ownerRole = await db.role.create({
      data: {
        businessId: business.id,
        roleKey: 'OWNER',
        displayName: 'Business Owner',
        isSystemDefault: true,
      },
    });

    cashierRole = await db.role.create({
      data: {
        businessId: business.id,
        roleKey: 'CASHIER',
        displayName: 'Counter Cashier',
        isSystemDefault: true,
      },
    });
  });

  it('correctly associates user to business with OWNER role membership', async () => {
    const membership = await db.businessMember.create({
      data: {
        businessId: business.id,
        userId: user.id,
        roleId: ownerRole.id,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        business: true,
      },
    });

    expect(membership.role.roleKey).toBe('OWNER');
    expect(membership.business.name).toBe('Test Business Store');
    expect(hasPermission(membership.role.roleKey, PERMISSIONS.TRANSACTION_CREATE)).toBe(true);
    expect(hasPermission(membership.role.roleKey, PERMISSIONS.TRANSACTION_REVERSE)).toBe(true);
    expect(hasPermission(membership.role.roleKey, PERMISSIONS.STAFF_INVITE)).toBe(true);
  });

  it('restricts CASHIER role from reversing transactions or inviting staff', async () => {
    const staffUser = await db.user.create({
      data: {
        firebaseUid: 'fb_cashier_user',
        fullName: 'Cashier Staff',
        globalRole: 'SHOPKEEPER',
      },
    });

    const cashierMembership = await db.businessMember.create({
      data: {
        businessId: business.id,
        userId: staffUser.id,
        roleId: cashierRole.id,
        status: 'ACTIVE',
      },
      include: {
        role: true,
      },
    });

    expect(cashierMembership.role.roleKey).toBe('CASHIER');
    expect(hasPermission(cashierMembership.role.roleKey, PERMISSIONS.TRANSACTION_CREATE)).toBe(true);
    expect(hasPermission(cashierMembership.role.roleKey, PERMISSIONS.CUSTOMER_READ)).toBe(true);

    expect(hasPermission(cashierMembership.role.roleKey, PERMISSIONS.TRANSACTION_REVERSE)).toBe(false);
    expect(hasPermission(cashierMembership.role.roleKey, PERMISSIONS.STAFF_INVITE)).toBe(false);
    expect(hasPermission(cashierMembership.role.roleKey, PERMISSIONS.BUSINESS_UPDATE)).toBe(false);
  });
});
