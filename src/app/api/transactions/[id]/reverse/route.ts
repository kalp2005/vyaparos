import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { reverseTransaction } from '@/lib/ledger';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.TRANSACTION_REVERSE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const body = await req.json();
    const { voidReason } = body;

    if (!voidReason || voidReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'A mandatory void reason is required to reverse a transaction.' },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Execute atomic reversal
    const result = await reverseTransaction({
      businessId: business.id,
      transactionId: id,
      voidReason: voidReason.trim(),
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      customerName: result.customerName,
      message: 'Transaction successfully reversed and customer balance restored.',
    });
  } catch (err: any) {
    console.error('Reverse transaction error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reverse transaction' },
      { status: 500 }
    );
  }
}
