import { db } from './db';
import { logAudit } from './audit';
import { calculateGstInvoice, resolveSupplyType, roundCurrency, GstLineItemInput, SupplyType } from './gst';
import { generateNextInvoiceNumber } from './invoice-number';

export interface CreateInvoicePaymentInput {
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  amount: number;
  paymentReference?: string | null;
  notes?: string | null;
}

export interface CreateInvoiceParams {
  businessId: string;
  branchId?: string | null;
  customerId?: string | null;
  billingType?: 'POS' | 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE';
  invoiceDate?: Date;
  dueDate?: Date | null;
  items: GstLineItemInput[];
  payments?: CreateInvoicePaymentInput[];
  notes?: string | null;
  termsConditions?: string | null;
  idempotencyKey?: string | null;
  actorUserId: string;
  globalRole: string;
  businessRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CancelInvoiceParams {
  businessId: string;
  invoiceId: string;
  cancelReason: string;
  actorUserId: string;
  globalRole: string;
  businessRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Atomic Invoicing Pipeline:
 * Calculates GST, generates sequential number, decrements stock, records split payments,
 * posts balanced double-entry journal legs, updates customer Khata balance (if credit), and logs audit trail.
 */
export async function createInvoice(params: CreateInvoiceParams) {
  if (!params.items || params.items.length === 0) {
    throw new Error('Invoice must contain at least one line item.');
  }

  // Check Idempotency Key before processing
  if (params.idempotencyKey && params.idempotencyKey.trim().length > 0) {
    const existing = await db.invoice.findFirst({
      where: {
        businessId: params.businessId,
        idempotencyKey: params.idempotencyKey.trim(),
      },
      include: {
        items: true,
        payments: true,
        customer: true,
      },
    });

    if (existing) {
      return {
        invoice: existing,
        isDuplicate: true,
      };
    }
  }

  return await db.$transaction(async (tx) => {
    // 1. Fetch business and customer details to resolve supply type (Intra vs Inter state)
    const business = await tx.business.findUnique({
      where: { id: params.businessId },
      include: { branches: true },
    });

    if (!business) {
      throw new Error(`Business with ID ${params.businessId} not found.`);
    }

    let customer = null;
    if (params.customerId) {
      customer = await tx.customer.findFirst({
        where: {
          id: params.customerId,
          businessId: params.businessId,
        },
      });
      if (!customer) {
        throw new Error(`Customer with ID ${params.customerId} not found.`);
      }
    }

    // Determine state codes for GST supply type
    const mainBranch = business.branches.find((b) => b.isMainBranch) || business.branches[0];
    const merchantStateCode = mainBranch?.stateCode || '27'; // Default Maharashtra
    const customerStateCode = customer?.stateCode || merchantStateCode;
    const supplyType: SupplyType = resolveSupplyType(merchantStateCode, customerStateCode);

    // 2. Deterministic GST calculation
    const calc = calculateGstInvoice(params.items, supplyType);

    // 3. Process Payments (Distinguish realized cash/bank from Credit/Udhar)
    const paymentsInput = params.payments ? [...params.payments] : [];
    let nonCreditPaid = 0;
    let creditAmount = 0;

    for (const p of paymentsInput) {
      if (p.amount > 0) {
        if (p.paymentMode === 'CREDIT') {
          creditAmount = roundCurrency(creditAmount + p.amount);
        } else {
          nonCreditPaid = roundCurrency(nonCreditPaid + p.amount);
        }
      }
    }

    // If no payments provided, default to immediate full CASH payment for POS
    if (paymentsInput.length === 0) {
      paymentsInput.push({
        paymentMode: 'CASH',
        amount: calc.grandTotal,
      });
      nonCreditPaid = calc.grandTotal;
    }

    const totalCovered = roundCurrency(nonCreditPaid + creditAmount);
    const unallocatedDue = Math.max(0, roundCurrency(calc.grandTotal - totalCovered));
    const totalCreditOrDue = roundCurrency(creditAmount + unallocatedDue);
    const balanceDue = totalCreditOrDue;
    const paidAmount = nonCreditPaid;

    // If there is an unpaid balance or credit payment mode, a Customer is mandatory
    if (totalCreditOrDue > 0 && !customer) {
      throw new Error('Customer selection is mandatory for Credit / Udhar sales.');
    }

    let paymentStatus = 'PAID';
    if (balanceDue > 0 && paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (paidAmount === 0 || balanceDue === calc.grandTotal) {
      paymentStatus = 'UNPAID';
    }

    // 4. Generate sequential invoice number
    const invoiceNumber = await generateNextInvoiceNumber(
      params.businessId,
      'INV',
      tx,
      params.invoiceDate || new Date()
    );

    // 5. Create Invoice record
    const invoice = await tx.invoice.create({
      data: {
        businessId: params.businessId,
        branchId: params.branchId || mainBranch?.id || null,
        customerId: customer?.id || null,
        invoiceNumber,
        invoiceDate: params.invoiceDate || new Date(),
        dueDate: params.dueDate || null,
        subtotal: calc.subtotal,
        discountTotal: calc.discountTotal,
        taxableAmount: calc.taxableAmount,
        cgstTotal: calc.cgstTotal,
        sgstTotal: calc.sgstTotal,
        igstTotal: calc.igstTotal,
        cessTotal: calc.cessTotal,
        roundOff: calc.roundOff,
        grandTotal: calc.grandTotal,
        paidAmount,
        balanceDue,
        status: 'ISSUED',
        paymentStatus,
        supplyType,
        billingType: params.billingType || 'POS',
        notes: params.notes || null,
        termsConditions: params.termsConditions || null,
        idempotencyKey: params.idempotencyKey?.trim() || null,
        createdByUserId: params.actorUserId,
      },
    });

    // 6. Create Snapshot Line Items and Decrement Product Stock
    for (const item of calc.items) {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId || null,
          itemName: item.itemName,
          sku: item.sku || null,
          hsnCode: item.hsnCode || null,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxableAmount: item.taxableAmount,
          gstRate: item.gstRate,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          cessAmount: item.cessAmount,
          totalAmount: item.totalAmount,
        },
      });

      // If item is linked to a tracked product in catalog, decrement stock
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // 7. Record Invoice Payments
    for (const p of paymentsInput) {
      if (p.amount > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            businessId: params.businessId,
            amount: p.amount,
            paymentMode: p.paymentMode,
            paymentReference: p.paymentReference || null,
            notes: p.notes || null,
            createdByUserId: params.actorUserId,
          },
        });
      }
    }

    // 8. Double-Entry Accounting & Customer Khata Integration
    // Create Transaction record representing this sale
    const txn = await tx.transaction.create({
      data: {
        businessId: params.businessId,
        branchId: params.branchId || null,
        partyType: customer ? 'CUSTOMER' : 'OTHER',
        customerId: customer?.id || null,
        invoiceId: invoice.id,
        idempotencyKey: params.idempotencyKey ? `txn-${params.idempotencyKey}` : null,
        transactionType: balanceDue > 0 ? 'CREDIT_GIVEN' : 'PAYMENT_RECEIVED',
        amount: calc.grandTotal,
        paymentMode: paymentsInput[0]?.paymentMode || 'CASH',
        paymentReference: paymentsInput[0]?.paymentReference || null,
        transactionDate: params.invoiceDate || new Date(),
        description: `Invoice ${invoiceNumber}`,
        createdByUserId: params.actorUserId,
      },
    });

    // Create balanced journal entries
    // Total Debits (Receivable + Cash + Bank) MUST equal Total Credits (Revenue + CGST + SGST + IGST)
    const entriesData: Array<{
      transactionId: string;
      accountType: string;
      entryType: string;
      amount: number;
    }> = [];

    // Debit side:
    if (balanceDue > 0) {
      entriesData.push({
        transactionId: txn.id,
        accountType: 'ACCOUNTS_RECEIVABLE',
        entryType: 'DEBIT',
        amount: balanceDue,
      });
    }

    for (const p of paymentsInput) {
      if (p.paymentMode !== 'CREDIT' && p.amount > 0) {
        const assetAccount = p.paymentMode === 'UPI' || p.paymentMode === 'BANK_TRANSFER' || p.paymentMode === 'CARD'
          ? 'BANK_ACCOUNT'
          : 'CASH_IN_HAND';

        entriesData.push({
          transactionId: txn.id,
          accountType: assetAccount,
          entryType: 'DEBIT',
          amount: p.amount,
        });
      }
    }

    // Credit side:
    if (calc.taxableAmount > 0) {
      entriesData.push({
        transactionId: txn.id,
        accountType: 'SALES_REVENUE',
        entryType: 'CREDIT',
        amount: calc.taxableAmount,
      });
    }
    if (calc.cgstTotal > 0) {
      entriesData.push({
        transactionId: txn.id,
        accountType: 'GST_OUTPUT_CGST',
        entryType: 'CREDIT',
        amount: calc.cgstTotal,
      });
    }
    if (calc.sgstTotal > 0) {
      entriesData.push({
        transactionId: txn.id,
        accountType: 'GST_OUTPUT_SGST',
        entryType: 'CREDIT',
        amount: calc.sgstTotal,
      });
    }
    if (calc.igstTotal > 0) {
      entriesData.push({
        transactionId: txn.id,
        accountType: 'GST_OUTPUT_IGST',
        entryType: 'CREDIT',
        amount: calc.igstTotal,
      });
    }

    await tx.transactionEntry.createMany({
      data: entriesData,
    });

    // 9. Update Customer Outstanding Balance if Credit / Udhar exists
    if (customer && balanceDue > 0) {
      const prevBal = customer.outstandingBalance;
      const newBal = roundCurrency(prevBal + balanceDue);
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          outstandingBalance: newBal,
        },
      });
    }

    // 10. Audit Log
    await logAudit(
      {
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        globalRole: params.globalRole,
        businessRole: params.businessRole,
        action: 'INVOICE_CREATED',
        entityName: 'invoice',
        entityId: invoice.id,
        newState: {
          invoiceNumber,
          grandTotal: calc.grandTotal,
          paidAmount,
          balanceDue,
          paymentStatus,
          itemsCount: calc.items.length,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
      tx
    );

    return {
      invoice,
      summary: calc,
      isDuplicate: false,
    };
  });
}

/**
 * Non-destructive Invoice Cancellation:
 * Restores product stock, voids Khata transactions, adjusts customer balances, and logs audit trail.
 */
export async function cancelInvoice(params: CancelInvoiceParams) {
  if (!params.cancelReason || params.cancelReason.trim().length === 0) {
    throw new Error('A valid cancellation reason is mandatory.');
  }

  return await db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: params.invoiceId,
        businessId: params.businessId,
      },
      include: {
        items: true,
        payments: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${params.invoiceId} not found.`);
    }

    if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
      throw new Error('This invoice has already been cancelled.');
    }

    // 1. Mark Invoice as CANCELLED
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELLED',
        notes: invoice.notes ? `${invoice.notes} | Cancelled: ${params.cancelReason}` : `Cancelled: ${params.cancelReason}`,
      },
    });

    // 2. Restore Product Inventory
    for (const item of invoice.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // 3. Reverse Customer Balance if Credit was extended
    if (invoice.customer && invoice.balanceDue > 0) {
      await tx.customer.update({
        where: { id: invoice.customer.id },
        data: {
          outstandingBalance: {
            decrement: invoice.balanceDue,
          },
        },
      });
    }

    // 4. Mark associated Transactions as VOID
    await tx.transaction.updateMany({
      where: { invoiceId: invoice.id },
      data: {
        isVoided: true,
        voidReason: params.cancelReason,
        voidedByUserId: params.actorUserId,
        voidedAt: new Date(),
      },
    });

    // 5. Audit Log
    await logAudit(
      {
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        globalRole: params.globalRole,
        businessRole: params.businessRole,
        action: 'INVOICE_CANCELLED',
        entityName: 'invoice',
        entityId: invoice.id,
        oldState: { status: invoice.status },
        newState: { status: 'CANCELLED', reason: params.cancelReason },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
      tx
    );

    return {
      invoice: updatedInvoice,
      cancelled: true,
    };
  });
}
