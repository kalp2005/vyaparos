import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { createKhataTransaction } from '@/lib/ledger';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.TRANSACTION_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');
  const type = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  try {
    const where: any = {
      businessId: business.id,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (type) {
      where.transactionType = type;
    }

    const transactions = await db.transaction.findMany({
      where,
      take: limit,
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            outstandingBalance: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        voider: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (err: any) {
    console.error('List transactions error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.TRANSACTION_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;

  try {
    const body = await req.json();
    const {
      customerId,
      transactionType,
      amount,
      paymentMode,
      paymentReference,
      transactionDate,
      description,
      idempotencyKey,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      );
    }

    if (!transactionType || (transactionType !== 'CREDIT_GIVEN' && transactionType !== 'PAYMENT_RECEIVED')) {
      return NextResponse.json(
        { success: false, error: "transactionType must be 'CREDIT_GIVEN' (Udhar) or 'PAYMENT_RECEIVED' (Jama)" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number greater than zero.' },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Execute atomic double-entry cascade with idempotency
    const result = await createKhataTransaction({
      businessId: business.id,
      branchId: membership.branchId,
      customerId,
      idempotencyKey: idempotencyKey || req.headers.get('x-idempotency-key') || undefined,
      transactionType,
      amount: parsedAmount,
      paymentMode: paymentMode || (transactionType === 'CREDIT_GIVEN' ? 'CREDIT' : 'CASH'),
      paymentReference,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      description,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        transaction: result.transaction,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        customerName: result.customerName,
        isDuplicate: result.isDuplicate,
        message: result.isDuplicate
          ? 'Existing transaction returned (idempotency key matched)'
          : `${transactionType === 'CREDIT_GIVEN' ? 'Udhar (Credit)' : 'Jama (Payment)'} recorded successfully`,
      },
      { status: result.isDuplicate ? 200 : 201 }
    );
  } catch (err: any) {
    console.error('Create transaction error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
