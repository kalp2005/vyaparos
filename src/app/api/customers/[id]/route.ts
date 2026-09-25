import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.CUSTOMER_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const { id } = await params;

  try {
    const customer = await db.customer.findFirst({
      where: {
        id,
        businessId: business.id,
      },
      include: {
        transactions: {
          orderBy: {
            transactionDate: 'desc',
          },
          include: {
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
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found in this business.' },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics from active (non-voided) transactions
    let totalCredit = 0;
    let totalPayments = 0;

    for (const txn of customer.transactions) {
      if (!txn.isVoided) {
        if (txn.transactionType === 'CREDIT_GIVEN') {
          totalCredit += txn.amount;
        } else if (txn.transactionType === 'PAYMENT_RECEIVED') {
          totalPayments += txn.amount;
        }
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        summary: {
          totalCredit,
          totalPayments,
          outstandingBalance: customer.outstandingBalance,
          transactionCount: customer.transactions.length,
        },
      },
    });
  } catch (err: any) {
    console.error('Get customer error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.CUSTOMER_UPDATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, phoneNumber, email, address, paymentTermsDays, notes, tags } = body;

    const existing = await db.customer.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const updated = await db.customer.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        phoneNumber: phoneNumber?.trim() || existing.phoneNumber,
        email: email?.trim() ?? existing.email,
        address: address?.trim() ?? existing.address,
        paymentTermsDays: paymentTermsDays !== undefined ? parseInt(paymentTermsDays) : existing.paymentTermsDays,
        notes: notes?.trim() ?? existing.notes,
        tags: Array.isArray(tags) ? tags.join(',') : tags ?? existing.tags,
      },
    });

    await logAudit({
      businessId: business.id,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      action: 'CUSTOMER_UPDATED',
      entityName: 'customer',
      entityId: updated.id,
      oldState: existing,
      newState: updated,
    });

    return NextResponse.json({
      success: true,
      customer: updated,
      message: 'Customer updated successfully',
    });
  } catch (err: any) {
    console.error('Update customer error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}
