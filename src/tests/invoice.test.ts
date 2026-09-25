import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createInvoice, cancelInvoice } from '@/lib/invoice';
import { generateNextInvoiceNumber } from '@/lib/invoice-number';

describe('VyaparOS — Phase 2 Invoicing, POS & Ledger Integration', () => {
  let testUser: any;
  let testBusiness: any;
  let testCustomer: any;
  let testProduct: any;

  beforeEach(async () => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create Tenant
    testUser = await db.user.create({
      data: {
        firebaseUid: `test_fb_invoice_${uniqueSuffix}`,
        email: `merchant_${uniqueSuffix}@test.com`,
        fullName: 'Test Merchant',
        globalRole: 'SHOPKEEPER',
      },
    });

    testBusiness = await db.business.create({
      data: {
        ownerUserId: testUser.id,
        name: `Test Kirana ${uniqueSuffix}`,
        businessType: 'retail',
        gstin: '27AAAAA0000A1Z5',
      },
    });

    await db.branch.create({
      data: {
        businessId: testBusiness.id,
        name: 'Main Counter',
        isMainBranch: true,
        addressLine1: 'Shop #1',
        city: 'Mumbai',
        stateCode: '27',
        stateName: 'Maharashtra',
        pincode: '400001',
      },
    });

    // Create Customer
    testCustomer = await db.customer.create({
      data: {
        businessId: testBusiness.id,
        name: 'Anil Gupta',
        phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        stateCode: '27',
        openingBalance: 0,
        outstandingBalance: 0,
      },
    });

    // Create Tracked Product
    testProduct = await db.product.create({
      data: {
        businessId: testBusiness.id,
        name: 'Basmati Rice 5kg',
        sku: `BR-5K-${uniqueSuffix}`,
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        unit: 'PCS',
        purchasePrice: 400,
        sellingPrice: 500,
        gstRate: 5,
        isTaxInclusive: false,
        currentStock: 20,
        minimumStock: 5,
      },
    });
  });

  it('generates collision-free sequential invoice numbers', async () => {
    const num1 = await generateNextInvoiceNumber(testBusiness.id, 'INV');
    const num2 = await generateNextInvoiceNumber(testBusiness.id, 'INV');
    const num3 = await generateNextInvoiceNumber(testBusiness.id, 'INV');

    expect(num1).toContain('INV-');
    expect(num1.endsWith('000001')).toBe(true);
    expect(num2.endsWith('000002')).toBe(true);
    expect(num3.endsWith('000003')).toBe(true);
  });

  it('completes POS cash sale: generates invoice, decrements stock, and posts balanced journal entries', async () => {
    const result = await createInvoice({
      businessId: testBusiness.id,
      billingType: 'POS',
      items: [
        {
          productId: testProduct.id,
          itemName: testProduct.name,
          quantity: 2,
          unitPrice: 500,
          gstRate: 5,
          isTaxInclusive: false,
        },
      ],
      payments: [
        {
          paymentMode: 'CASH',
          amount: 1050, // 2 * 500 = 1000 + 5% GST (50) = 1050
        },
      ],
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(result.invoice.grandTotal).toBe(1050);
    expect(result.invoice.paymentStatus).toBe('PAID');
    expect(result.invoice.status).toBe('ISSUED');

    // 1. Verify Product Stock decremented from 20 to 18
    const updatedProduct = await db.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(updatedProduct?.currentStock).toBe(18);

    // 2. Verify Double-Entry Journal Legs are balanced (Debits == Credits)
    const txn = await db.transaction.findFirst({
      where: { invoiceId: result.invoice.id },
      include: { entries: true },
    });
    expect(txn).toBeDefined();

    const debits = txn?.entries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);
    const credits = txn?.entries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((sum, e) => sum + e.amount, 0);

    expect(debits).toBe(1050);
    expect(credits).toBe(1050);
  });

  it('completes Credit / Udhar sale: links customer and updates customer outstanding balance', async () => {
    const result = await createInvoice({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      billingType: 'POS',
      items: [
        {
          productId: testProduct.id,
          itemName: testProduct.name,
          quantity: 1,
          unitPrice: 500,
          gstRate: 5,
          isTaxInclusive: false,
        },
      ],
      payments: [
        {
          paymentMode: 'CREDIT',
          amount: 525, // 500 + 5% GST = 525
        },
      ],
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(result.invoice.paymentStatus).toBe('UNPAID');
    expect(result.invoice.balanceDue).toBe(525);

    // Verify customer outstanding balance increased to ₹525
    const updatedCustomer = await db.customer.findUnique({
      where: { id: testCustomer.id },
    });
    expect(updatedCustomer?.outstandingBalance).toBe(525);
  });

  it('atomically cancels invoice: restores inventory stock and customer balance', async () => {
    // 1. Create a credit invoice of ₹525 (1 item)
    const { invoice } = await createInvoice({
      businessId: testBusiness.id,
      customerId: testCustomer.id,
      billingType: 'POS',
      items: [
        {
          productId: testProduct.id,
          itemName: testProduct.name,
          quantity: 2,
          unitPrice: 500,
          gstRate: 5,
          isTaxInclusive: false,
        },
      ],
      payments: [
        {
          paymentMode: 'CREDIT',
          amount: 1050,
        },
      ],
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    // Stock before cancel: 20 - 2 = 18
    let productCheck = await db.product.findUnique({ where: { id: testProduct.id } });
    expect(productCheck?.currentStock).toBe(18);

    // Customer balance before cancel: 1050
    let custCheck = await db.customer.findUnique({ where: { id: testCustomer.id } });
    expect(custCheck?.outstandingBalance).toBe(1050);

    // 2. Cancel invoice
    const cancelRes = await cancelInvoice({
      businessId: testBusiness.id,
      invoiceId: invoice.id,
      cancelReason: 'Customer returned damaged packaging',
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(cancelRes.cancelled).toBe(true);

    // 3. Verify Stock is restored back to 20
    productCheck = await db.product.findUnique({ where: { id: testProduct.id } });
    expect(productCheck?.currentStock).toBe(20);

    // 4. Verify Customer balance is restored back to 0
    custCheck = await db.customer.findUnique({ where: { id: testCustomer.id } });
    expect(custCheck?.outstandingBalance).toBe(0);
  });

  it('guarantees idempotency: repeated request with same key returns identical invoice', async () => {
    const idempotencyKey = `idemp_test_${Date.now()}`;

    const res1 = await createInvoice({
      businessId: testBusiness.id,
      idempotencyKey,
      items: [
        {
          itemName: 'Item XYZ',
          quantity: 1,
          unitPrice: 200,
          gstRate: 0,
        },
      ],
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    const res2 = await createInvoice({
      businessId: testBusiness.id,
      idempotencyKey,
      items: [
        {
          itemName: 'Item XYZ',
          quantity: 1,
          unitPrice: 200,
          gstRate: 0,
        },
      ],
      actorUserId: testUser.id,
      globalRole: 'SHOPKEEPER',
      businessRole: 'OWNER',
    });

    expect(res1.invoice.id).toBe(res2.invoice.id);
    expect(res2.isDuplicate).toBe(true);
  });
});
