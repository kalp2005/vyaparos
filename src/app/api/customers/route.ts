import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERMISSIONS } from '@/lib/types/permissions';
import { createKhataTransaction } from '@/lib/ledger';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.CUSTOMER_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim() || '';
  const filter = url.searchParams.get('filter')?.toLowerCase() || 'all';

  try {
    // Build where clause with mandatory tenant isolation
    const where: any = {
      businessId: business.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    if (filter === 'due') {
      where.outstandingBalance = { gt: 0 };
    } else if (filter === 'settled') {
      where.outstandingBalance = { equals: 0 };
    } else if (filter === 'advance') {
      where.outstandingBalance = { lt: 0 };
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      customers,
      count: customers.length,
    });
  } catch (err: any) {
    console.error('List customers error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.CUSTOMER_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;

  try {
    const body = await req.json();
    const { name, phoneNumber, email, address, openingBalance, paymentTermsDays, notes, tags } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required.' },
        { status: 400 }
      );
    }

    if (!phoneNumber || phoneNumber.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'Valid customer mobile number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim();

    // Check for duplicate customer within this business tenant
    const existing = await db.customer.findFirst({
      where: {
        businessId: business.id,
        phoneNumber: cleanPhone,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A customer with phone number ${cleanPhone} already exists in this business (${existing.name}).`,
        },
        { status: 409 }
      );
    }

    const initialBalance = parseFloat(openingBalance) || 0.0;

    // Create customer record with 0.0 derived balance initially
    const customer = await db.customer.create({
      data: {
        businessId: business.id,
        name: name.trim(),
        phoneNumber: cleanPhone,
        email: email?.trim() || null,
        address: address?.trim() || null,
        openingBalance: initialBalance,
        outstandingBalance: 0.0,
        paymentTermsDays: parseInt(paymentTermsDays) || 0,
        notes: notes?.trim() || null,
        tags: Array.isArray(tags) ? tags.join(',') : tags || null,
      },
    });

    let finalCustomer = customer;

    // If initial opening balance is provided, record opening balance transaction
    // which atomically updates customer.outstandingBalance to initialBalance
    if (initialBalance !== 0) {
      const isCredit = initialBalance > 0;
      const txnResult = await createKhataTransaction({
        businessId: business.id,
        customerId: customer.id,
        transactionType: isCredit ? 'CREDIT_GIVEN' : 'PAYMENT_RECEIVED',
        amount: Math.abs(initialBalance),
        paymentMode: 'CREDIT',
        description: 'Opening Balance Entry',
        actorUserId: user.id,
        globalRole: user.globalRole,
        businessRole: membership.roleKey,
      });

      finalCustomer = {
        ...customer,
        outstandingBalance: txnResult.newBalance,
      };
    }

    // Log Audit
    await logAudit({
      businessId: business.id,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      action: 'CUSTOMER_CREATED',
      entityName: 'customer',
      entityId: customer.id,
      newState: {
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        openingBalance: customer.openingBalance,
        outstandingBalance: finalCustomer.outstandingBalance,
      },
    });

    return NextResponse.json({
      success: true,
      customer: finalCustomer,
      message: 'Customer created successfully',
    });
  } catch (err: any) {
    console.error('Create customer error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
