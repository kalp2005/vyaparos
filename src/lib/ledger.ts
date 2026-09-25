import { db } from './db';
import { logAudit } from './audit';

export interface CreateTransactionParams {
  businessId: string;
  branchId?: string | null;
  customerId: string;
  idempotencyKey?: string | null;
  transactionType: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
  amount: number;
  paymentMode?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  paymentReference?: string;
  transactionDate?: Date;
  description?: string;
  actorUserId: string;
  globalRole: string;
  businessRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReverseTransactionParams {
  businessId: string;
  transactionId: string;
  voidReason: string;
  actorUserId: string;
  globalRole: string;
  businessRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Execute an atomic Khata transaction with double-entry legs, balance update, idempotency check, and audit log.
 */
export async function createKhataTransaction(params: CreateTransactionParams) {
  if (params.amount <= 0) {
    throw new Error('Transaction amount must be strictly greater than zero.');
  }

  return await db.$transaction(async (tx) => {
    // 0. Idempotency Check: if key provided, verify if already executed
    if (params.idempotencyKey && params.idempotencyKey.trim().length > 0) {
      const existing = await tx.transaction.findFirst({
        where: {
          businessId: params.businessId,
          idempotencyKey: params.idempotencyKey.trim(),
        },
        include: {
          customer: true,
        },
      });

      if (existing) {
        return {
          transaction: existing,
          previousBalance: existing.customer?.outstandingBalance || 0,
          newBalance: existing.customer?.outstandingBalance || 0,
          customerName: existing.customer?.name || '',
          isDuplicate: true,
        };
      }
    }

    // 1. Verify customer exists within the tenant
    const customer = await tx.customer.findFirst({
      where: {
        id: params.customerId,
        businessId: params.businessId,
      },
    });

    if (!customer) {
      throw new Error(`Customer with ID ${params.customerId} not found in this business.`);
    }

    const previousBalance = customer.outstandingBalance;
    const isCredit = params.transactionType === 'CREDIT_GIVEN';
    const delta = isCredit ? params.amount : -params.amount;
    const newBalance = previousBalance + delta;

    // 2. Create Transaction record
    const txn = await tx.transaction.create({
      data: {
        businessId: params.businessId,
        branchId: params.branchId || null,
        partyType: 'CUSTOMER',
        customerId: customer.id,
        idempotencyKey: params.idempotencyKey?.trim() || null,
        transactionType: params.transactionType,
        amount: params.amount,
        paymentMode: params.paymentMode || (isCredit ? 'CREDIT' : 'CASH'),
        paymentReference: params.paymentReference || null,
        transactionDate: params.transactionDate || new Date(),
        description: params.description || null,
        createdByUserId: params.actorUserId,
      },
    });

    // 3. Create Balanced Double-Entry Journal Legs
    if (isCredit) {
      // Udhar (Credit Sale): Debit Accounts Receivable, Credit Sales Revenue
      await tx.transactionEntry.createMany({
        data: [
          {
            transactionId: txn.id,
            accountType: 'ACCOUNTS_RECEIVABLE',
            entryType: 'DEBIT',
            amount: params.amount,
          },
          {
            transactionId: txn.id,
            accountType: 'SALES_REVENUE',
            entryType: 'CREDIT',
            amount: params.amount,
          },
        ],
      });
    } else {
      // Jama (Payment Received): Debit Cash/Bank, Credit Accounts Receivable
      const assetAccount = params.paymentMode === 'BANK_TRANSFER' || params.paymentMode === 'UPI' 
        ? 'BANK_ACCOUNT' 
        : 'CASH_IN_HAND';

      await tx.transactionEntry.createMany({
        data: [
          {
            transactionId: txn.id,
            accountType: assetAccount,
            entryType: 'DEBIT',
            amount: params.amount,
          },
          {
            transactionId: txn.id,
            accountType: 'ACCOUNTS_RECEIVABLE',
            entryType: 'CREDIT',
            amount: params.amount,
          },
        ],
      });
    }

    // 4. Atomically update customer balance
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        outstandingBalance: newBalance,
      },
    });

    // 5. Log immutable audit entry
    await logAudit(
      {
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        globalRole: params.globalRole,
        businessRole: params.businessRole,
        action: 'TRANSACTION_CREATED',
        entityName: 'transaction',
        entityId: txn.id,
        oldState: {
          customerBalance: previousBalance,
        },
        newState: {
          transactionId: txn.id,
          type: params.transactionType,
          amount: params.amount,
          customerBalance: newBalance,
          idempotencyKey: params.idempotencyKey || null,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
      tx
    );

    return {
      transaction: txn,
      previousBalance,
      newBalance,
      customerName: customer.name,
      isDuplicate: false,
    };
  });
}

/**
 * Non-destructive reversal/void of a transaction with balancing counter-entry and audit trail.
 */
export async function reverseTransaction(params: ReverseTransactionParams) {
  if (!params.voidReason || params.voidReason.trim().length === 0) {
    throw new Error('A valid void reason is mandatory to reverse a financial transaction.');
  }

  return await db.$transaction(async (tx) => {
    // 1. Locate original transaction within the tenant
    const txn = await tx.transaction.findFirst({
      where: {
        id: params.transactionId,
        businessId: params.businessId,
      },
      include: {
        customer: true,
      },
    });

    if (!txn) {
      throw new Error(`Transaction with ID ${params.transactionId} not found in this business.`);
    }

    if (txn.isVoided) {
      throw new Error('This transaction has already been reversed.');
    }

    if (!txn.customerId || !txn.customer) {
      throw new Error('Cannot reverse a transaction not linked to a customer.');
    }

    const previousBalance = txn.customer.outstandingBalance;
    const isOriginalCredit = txn.transactionType === 'CREDIT_GIVEN';
    
    // Invert the original delta to restore balance
    const reversalDelta = isOriginalCredit ? -txn.amount : txn.amount;
    const newBalance = previousBalance + reversalDelta;

    // 2. Mark transaction as voided
    const updatedTxn = await tx.transaction.update({
      where: { id: txn.id },
      data: {
        isVoided: true,
        voidReason: params.voidReason,
        voidedByUserId: params.actorUserId,
        voidedAt: new Date(),
      },
    });

    // 3. Atomically restore customer balance
    await tx.customer.update({
      where: { id: txn.customer.id },
      data: {
        outstandingBalance: newBalance,
      },
    });

    // 4. Log Reversal Audit Log
    await logAudit(
      {
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        globalRole: params.globalRole,
        businessRole: params.businessRole,
        action: 'TRANSACTION_REVERSED',
        entityName: 'transaction',
        entityId: txn.id,
        oldState: {
          isVoided: false,
          customerBalance: previousBalance,
        },
        newState: {
          isVoided: true,
          voidReason: params.voidReason,
          customerBalance: newBalance,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
      tx
    );

    return {
      transaction: updatedTxn,
      previousBalance,
      newBalance,
      customerName: txn.customer.name,
    };
  });
}
