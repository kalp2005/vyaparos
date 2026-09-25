import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { createInvoice } from '@/lib/invoice';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVOICE_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim() || '';
  const customerId = url.searchParams.get('customerId');
  const status = url.searchParams.get('status');
  const paymentStatus = url.searchParams.get('paymentStatus');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const where: any = {
      businessId: business.id,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phoneNumber: { contains: search } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: true,
          items: true,
          payments: true,
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({ where }),
    ]);

    // Calculate quick stats
    const stats = await db.invoice.aggregate({
      where: {
        businessId: business.id,
        status: { not: 'CANCELLED' },
      },
      _sum: {
        grandTotal: true,
        paidAmount: true,
        balanceDue: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      invoices,
      total,
      stats: {
        totalSales: stats._sum.grandTotal || 0,
        totalPaid: stats._sum.paidAmount || 0,
        totalDue: stats._sum.balanceDue || 0,
        totalGst: (stats._sum.cgstTotal || 0) + (stats._sum.sgstTotal || 0) + (stats._sum.igstTotal || 0),
        invoiceCount: stats._count.id || 0,
      },
    });
  } catch (err: any) {
    console.error('List invoices error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVOICE_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;

  try {
    const body = await req.json();
    const {
      customerId,
      branchId,
      billingType,
      invoiceDate,
      dueDate,
      items,
      payments,
      notes,
      termsConditions,
    } = body;

    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key') ||
      body.idempotencyKey ||
      null;

    const result = await createInvoice({
      businessId: business.id,
      branchId,
      customerId,
      billingType: billingType || 'POS',
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      items: items || [],
      payments: payments || [],
      notes,
      termsConditions,
      idempotencyKey,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      summary: 'summary' in result ? result.summary : null,
      isDuplicate: result.isDuplicate,
      message: result.isDuplicate
        ? 'Existing invoice returned (idempotency key matched)'
        : 'Invoice created successfully',
    });
  } catch (err: any) {
    console.error('Create invoice error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create invoice' },
      { status: 400 }
    );
  }
}
