import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { createKhataTransaction, reverseTransaction } from '../lib/ledger';
import { cleanDatabase } from './setup';

describe('VyaparOS — Multi-Tenant Boundary Isolation', () => {
  let userA: any;
  let userB: any;
  let businessA: any;
  let businessB: any;
  let customerA: any;
  let customerB: any;

  beforeEach(async () => {
    await cleanDatabase();

    // Create User & Business A (Kirana Store)
    userA = await db.user.create({
      data: {
        firebaseUid: 'tenant-user-a',
        fullName: 'Merchant A (Kirana)',
        email: 'merchantA@test.com',
      },
    });
    businessA = await db.business.create({
      data: {
        ownerUserId: userA.id,
        name: 'Store A',
      },
    });
    customerA = await db.customer.create({
      data: {
        businessId: businessA.id,
        name: 'Customer of Store A',
        phoneNumber: '9000000001',
      },
    });

    // Create User & Business B (Wholesale Store)
    userB = await db.user.create({
      data: {
        firebaseUid: 'tenant-user-b',
        fullName: 'Merchant B (Wholesale)',
        email: 'merchantB@test.com',
      },
    });
    businessB = await db.business.create({
      data: {
        ownerUserId: userB.id,
        name: 'Store B',
      },
    });
    customerB = await db.customer.create({
      data: {
        businessId: businessB.id,
        name: 'Customer of Store B',
        phoneNumber: '9000000002',
      },
    });
  });

  it('prevents Business A from recording transactions against Business B customer', async () => {
    await expect(
      createKhataTransaction({
        businessId: businessA.id,
        customerId: customerB.id,
        transactionType: 'CREDIT_GIVEN',
        amount: 2000,
        actorUserId: userA.id,
        globalRole: 'SHOPKEEPER',
      })
    ).rejects.toThrow(`Customer with ID ${customerB.id} not found in this business.`);
  });

  it('prevents Business A from reversing transactions belonging to Business B', async () => {
    const txnB = await createKhataTransaction({
      businessId: businessB.id,
      customerId: customerB.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 3000,
      actorUserId: userB.id,
      globalRole: 'SHOPKEEPER',
    });

    await expect(
      reverseTransaction({
        businessId: businessA.id,
        transactionId: txnB.transaction.id,
        voidReason: 'Illicit cross-tenant reversal attempt',
        actorUserId: userA.id,
        globalRole: 'SHOPKEEPER',
      })
    ).rejects.toThrow(`Transaction with ID ${txnB.transaction.id} not found in this business.`);
  });
});
