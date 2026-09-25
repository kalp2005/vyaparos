import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { cancelInvoice } from '@/lib/invoice';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.INVOICE_CANCEL);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const body = await req.json();
    const { cancelReason } = body;

    if (!cancelReason || cancelReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'A cancellation reason is mandatory.' },
        { status: 400 }
      );
    }

    const result = await cancelInvoice({
      businessId: business.id,
      invoiceId: id,
      cancelReason: cancelReason.trim(),
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      message: 'Invoice cancelled and inventory/ledger restored successfully',
    });
  } catch (err: any) {
    console.error('Cancel invoice error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to cancel invoice' },
      { status: 400 }
    );
  }
}
