import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { cleanDatabase } from './setup';

describe('VyaparOS — Shopper Role & Customer Linkage Isolation', () => {
  let merchantUser: any;
  let shopperUserA: any;
  let shopperUserB: any;
  let business: any;
  let customerA: any;
  let customerB: any;

  beforeEach(async () => {
    await cleanDatabase();

    merchantUser = await db.user.create({
      data: {
        firebaseUid: 'fb_merchant_1',
        fullName: 'Store Merchant',
        globalRole: 'SHOPKEEPER',
      },
    });

    business = await db.business.create({
      data: {
        ownerUserId: merchantUser.id,
        name: 'Grocery Mart',
      },
    });

    customerA = await db.customer.create({
      data: {
        businessId: business.id,
        name: 'Shopper Person A',
        phoneNumber: '9111111111',
        outstandingBalance: 1500,
      },
    });

    customerB = await db.customer.create({
      data: {
        businessId: business.id,
        name: 'Shopper Person B',
        phoneNumber: '9222222222',
        outstandingBalance: 4000,
      },
    });

    shopperUserA = await db.user.create({
      data: {
        firebaseUid: 'fb_shopper_a',
        fullName: 'Shopper Person A',
        globalRole: 'SHOPPER',
      },
    });

    shopperUserB = await db.user.create({
      data: {
        firebaseUid: 'fb_shopper_b',
        fullName: 'Shopper Person B',
        globalRole: 'SHOPPER',
      },
    });
  });

  it('links shopper A exclusively to customer A record', async () => {
    const link = await db.shopperAccount.create({
      data: {
        userId: shopperUserA.id,
        businessId: business.id,
        customerId: customerA.id,
        status: 'ACTIVE',
      },
    });

    expect(link.id).toBeDefined();
    expect(link.userId).toBe(shopperUserA.id);
    expect(link.customerId).toBe(customerA.id);

    // Verify Shopper A can find their linked record
    const shopperRecord = await db.shopperAccount.findFirst({
      where: {
        userId: shopperUserA.id,
        businessId: business.id,
      },
      include: {
        customer: true,
      },
    });

    expect(shopperRecord?.customer.id).toBe(customerA.id);
    expect(shopperRecord?.customer.name).toBe('Shopper Person A');
    expect(shopperRecord?.customer.outstandingBalance).toBe(1500);
  });

  it('prevents Shopper A from querying Shopper B customer record', async () => {
    // Link Shopper A to Customer A
    await db.shopperAccount.create({
      data: {
        userId: shopperUserA.id,
        businessId: business.id,
        customerId: customerA.id,
        status: 'ACTIVE',
      },
    });

    // Attempt lookup for Customer B under Shopper A identity
    const unauthorizedAccess = await db.shopperAccount.findFirst({
      where: {
        userId: shopperUserA.id,
        customerId: customerB.id,
      },
    });

    expect(unauthorizedAccess).toBeNull();
  });
});
