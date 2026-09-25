import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.BUSINESS_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;

  try {
    // 1. Fetch Customers in business
    const customers = await db.customer.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        outstandingBalance: true,
      },
    });

    let totalReceivables = 0; // Lena Hai (Positive balance)
    let totalAdvance = 0; // Customer Advance (Negative balance)
    let overdueCount = 0;

    for (const c of customers) {
      if (c.outstandingBalance > 0) {
        totalReceivables += c.outstandingBalance;
        overdueCount++;
      } else if (c.outstandingBalance < 0) {
        totalAdvance += Math.abs(c.outstandingBalance);
      }
    }

    // 2. Fetch Top Defaulters (highest positive balances)
    const topDefaulters = customers
      .filter((c) => c.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
      .slice(0, 5);

    // 3. Fetch Today's Transactions
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTransactions = await db.transaction.findMany({
      where: {
        businessId: business.id,
        transactionDate: {
          gte: startOfToday,
        },
        isVoided: false,
      },
    });

    let todayCreditGiven = 0;
    let todayPaymentReceived = 0;
    let cashInHandToday = 0;

    for (const txn of todayTransactions) {
      if (txn.transactionType === 'CREDIT_GIVEN') {
        todayCreditGiven += txn.amount;
      } else if (txn.transactionType === 'PAYMENT_RECEIVED') {
        todayPaymentReceived += txn.amount;
        if (txn.paymentMode === 'CASH' || txn.paymentMode === 'UPI' || txn.paymentMode === 'BANK_TRANSFER') {
          cashInHandToday += txn.amount;
        }
      }
    }

    // 4. Fetch Recent Transactions
    const recentTransactions = await db.transaction.findMany({
      where: {
        businessId: business.id,
      },
      take: 6,
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const summary = {
      totalReceivable: totalReceivables,
      totalAdvance,
      totalPayable: 0.0, // Supplier payables in Phase 4
      netBalance: totalReceivables - totalAdvance,
      totalCustomers: customers.length,
      todayCreditGiven,
      todayPaymentReceived,
      todaySales: todayCreditGiven,
      todayCollections: todayPaymentReceived,
      netCash: cashInHandToday,
      overdueCount,
    };

    return NextResponse.json({
      success: true,
      summary,
      stats: summary,
      topDefaulters,
      recentTransactions,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate business dashboard stats' },
      { status: 500 }
    );
  }
}
