import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.INVOICE_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business: authBusiness } = guard.context;
  const { id } = await params;

  try {
    const [invoice, business] = await Promise.all([
      db.invoice.findFirst({
        where: {
          id,
          businessId: authBusiness.id,
        },
        include: {
          customer: true,
          branch: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
          transactions: true,
        },
      }),
      db.business.findUnique({
        where: { id: authBusiness.id },
      }),
    ]);

    if (!invoice || !business) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
      business: {
        id: business.id,
        name: business.name,
        legalName: business.legalName,
        gstin: business.gstin,
        pan: business.pan,
        upiVpa: business.upiVpa,
        currency: business.currency,
        bankAccountNumber: business.bankAccountNumber,
        bankIfscCode: business.bankIfscCode,
        bankName: business.bankName,
      },
    });
  } catch (err: any) {
    console.error('Get invoice error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice details' },
      { status: 500 }
    );
  }
}
