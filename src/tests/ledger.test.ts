import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { createKhataTransaction, reverseTransaction } from '../lib/ledger';
import { cleanDatabase } from './setup';

describe('VyaparOS — Atomic Double-Entry Ledger Engine', () => {
  let testUser: any;
  let testBusiness: any;
  let testCustomer: any;

  beforeEach(async () => {
    await cleanDatabase();

    testUser = await db.user.create({
      data: {
        firebaseUid: 'test-firebase-uid-123',
        fullName: 'Ramesh Kirana Owner',
        email: 'ramesh@kirana.test',
        globalRole: 'SHOPKEEPER',
      },
    });

    testBusiness = await db.business.create({
      data: {
        ownerUserId: testUser.id,
        name: 'Ramesh Kirana Store',
        businessType: 'retail',
        currency: 'INR',
      },
    });

    testCustomer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Suresh Sharma',
        phoneNumber: '9876500001',
        openingBalance: 0.0,
        outstandingBalance: 0.0,
      },
    });
  });

  it('atomically records Udhar (Credit Given), creates balanced journal legs, and increases customer balance', async () => {
    const result = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 5000,
      paymentMode: 'CREDIT',
      description: '5 Bags of Basmati Rice on Udhar',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(result.transaction).toBeDefined();
    expect(result.previousBalance).toBe(0);
    expect(result.newBalance).toBe(5000);

    const updatedCustomer = await db.customer.findUnique({
      where: { id: testCustomer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(5000);

    const legs = await db.transactionEntry.findMany({
      where: { transactionId: result.transaction.id },
    });

    expect(legs).toHaveLength(2);
    const debitLeg = legs.find((l) => l.entryType === 'DEBIT');
    const creditLeg = legs.find((l) => l.entryType === 'CREDIT');

    expect(debitLeg?.accountType).toBe('ACCOUNTS_RECEIVABLE');
    expect(debitLeg?.amount).toBe(5000);
    expect(creditLeg?.accountType).toBe('SALES_REVENUE');
    expect(creditLeg?.amount).toBe(5000);

    // Invariant: Total Debits == Total Credits
    const totalDebits = legs.filter((l) => l.entryType === 'DEBIT').reduce((acc, l) => acc + l.amount, 0);
    const totalCredits = legs.filter((l) => l.entryType === 'CREDIT').reduce((acc, l) => acc + l.amount, 0);
    expect(totalDebits).toBe(totalCredits);
  });

  it('atomically records Jama (Payment Received) and decreases customer balance', async () => {
    await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 5000,
      paymentMode: 'CREDIT',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    const paymentResult = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      transactionType: 'PAYMENT_RECEIVED',
      amount: 2000,
      paymentMode: 'CASH',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(paymentResult.previousBalance).toBe(5000);
    expect(paymentResult.newBalance).toBe(3000);

    const updatedCustomer = await db.customer.findUnique({
      where: { id: testCustomer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(3000);

    const paymentLegs = await db.transactionEntry.findMany({
      where: { transactionId: paymentResult.transaction.id },
    });

    expect(paymentLegs).toHaveLength(2);
    const debitLeg = paymentLegs.find((l) => l.entryType === 'DEBIT');
    const creditLeg = paymentLegs.find((l) => l.entryType === 'CREDIT');

    expect(debitLeg?.accountType).toBe('CASH_IN_HAND');
    expect(debitLeg?.amount).toBe(2000);
    expect(creditLeg?.accountType).toBe('ACCOUNTS_RECEIVABLE');
    expect(creditLeg?.amount).toBe(2000);

    // Invariant: Total Debits == Total Credits
    const totalDebits = paymentLegs.filter((l) => l.entryType === 'DEBIT').reduce((acc, l) => acc + l.amount, 0);
    const totalCredits = paymentLegs.filter((l) => l.entryType === 'CREDIT').reduce((acc, l) => acc + l.amount, 0);
    expect(totalDebits).toBe(totalCredits);
  });

  it('safely reverses a transaction non-destructively and restores customer balance', async () => {
    const txnResult = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 4000,
      paymentMode: 'CREDIT',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(txnResult.newBalance).toBe(4000);

    const reversalResult = await reverseTransaction({
      businessId: testBusiness.id,
      transactionId: txnResult.transaction.id,
      voidReason: 'Entered duplicate bill by mistake',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(reversalResult.transaction.isVoided).toBe(true);
    expect(reversalResult.transaction.voidReason).toBe('Entered duplicate bill by mistake');
    expect(reversalResult.newBalance).toBe(0);

    const customerInDb = await db.customer.findUnique({
      where: { id: testCustomer.id },
    });
    expect(customerInDb?.outstandingBalance).toBe(0);

    // Verify original transaction row is preserved in DB (not deleted)
    const preservedTxn = await db.transaction.findUnique({
      where: { id: txnResult.transaction.id },
    });
    expect(preservedTxn).toBeDefined();
    expect(preservedTxn?.isVoided).toBe(true);
    expect(preservedTxn?.amount).toBe(4000);

    const audit = await db.auditLog.findFirst({
      where: {
        action: 'TRANSACTION_REVERSED',
        entityId: txnResult.transaction.id,
      },
    });
    expect(audit).toBeDefined();
    expect(audit?.actorUserId).toBe(testUser.id);
  });

  it('rejects reversal if void reason is missing', async () => {
    const txnResult = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 1000,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    await expect(
      reverseTransaction({
        businessId: testBusiness.id,
        transactionId: txnResult.transaction.id,
        voidReason: '',
        actorUserId: testUser.id,
        globalRole: 'SHOPKEEPER',
      })
    ).rejects.toThrow('A valid void reason is mandatory');
  });

  /* -------------------------------------------------------------
   * P1-1 & P1-2: Opening Balance & Idempotency Regression Tests
   * ------------------------------------------------------------- */
  it('correctly handles Opening Balance = ₹0 without inflating balance', async () => {
    const customer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Zero Balance Party',
        phoneNumber: '9000000010',
        openingBalance: 0.0,
        outstandingBalance: 0.0,
      },
    });

    expect(customer.openingBalance).toBe(0);
    expect(customer.outstandingBalance).toBe(0);
  });

  it('correctly initializes Customer with Opening Balance = ₹500 exactly once (P0-1 regression check)', async () => {
    // 1. Create customer with 0 initial derived balance
    const customer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Opening Balance Party',
        phoneNumber: '9000000020',
        openingBalance: 500.0,
        outstandingBalance: 0.0,
      },
    });

    // 2. Record opening balance transaction
    const txnResult = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: customer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 500.0,
      paymentMode: 'CREDIT',
      description: 'Opening Balance Entry',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    // Invariant: Customer balance must be exactly ₹500 (NOT ₹1,000)
    expect(txnResult.newBalance).toBe(500);

    const updatedCustomer = await db.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(500);
  });

  it('correctly calculates Opening Balance ₹500 + Jama ₹200 = ₹300', async () => {
    const customer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Partial Payer Party',
        phoneNumber: '9000000030',
        openingBalance: 500.0,
        outstandingBalance: 0.0,
      },
    });

    // Opening balance ₹500
    await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: customer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 500.0,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    // Payment (Jama) ₹200
    const payment = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: customer.id,
      transactionType: 'PAYMENT_RECEIVED',
      amount: 200.0,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(payment.newBalance).toBe(300);

    const updatedCustomer = await db.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(300);
  });

  it('correctly calculates Opening Balance ₹500 + Udhar ₹300 = ₹800', async () => {
    const customer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Additional Credit Party',
        phoneNumber: '9000000040',
        openingBalance: 500.0,
        outstandingBalance: 0.0,
      },
    });

    // Opening balance ₹500
    await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: customer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 500.0,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    // Additional Udhar ₹300
    const udhar = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: customer.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 300.0,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(udhar.newBalance).toBe(800);

    const updatedCustomer = await db.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(800);
  });

  it('enforces financial idempotency: duplicate requests with same idempotencyKey return existing transaction without altering balance', async () => {
    const idempotencyKey = 'IDEM-KEY-998877';

    // Request 1: First submission
    const res1 = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      idempotencyKey,
      transactionType: 'CREDIT_GIVEN',
      amount: 1500,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(res1.isDuplicate).toBe(false);
    expect(res1.newBalance).toBe(1500);

    // Request 2: Duplicate submission (e.g. user double-clicked or network retried)
    const res2 = await createKhataTransaction({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      idempotencyKey,
      transactionType: 'CREDIT_GIVEN',
      amount: 1500,
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
    });

    expect(res2.isDuplicate).toBe(true);
    expect(res2.transaction.id).toBe(res1.transaction.id);
    expect(res2.newBalance).toBe(1500); // Balance unchanged!

    // Verify in database that only ONE transaction row exists
    const txnCount = await db.transaction.count({
      where: { businessId: testBusiness.id, customerId: testCustomer.id },
    });
    expect(txnCount).toBe(1);

    const finalCustomer = await db.customer.findUnique({
      where: { id: testCustomer.id },
    });
    expect(finalCustomer?.outstandingBalance).toBe(1500);
  });
});
