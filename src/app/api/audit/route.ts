import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.REPORT_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');

  try {
    const logs = await db.auditLog.findMany({
      where: {
        businessId: business.id,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
