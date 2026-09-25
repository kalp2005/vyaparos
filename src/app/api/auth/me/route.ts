import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authCtx = await getAuthContext(req);

    if (!authCtx || !authCtx.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch all businesses user belongs to
    const memberships = await db.businessMember.findMany({
      where: {
        userId: authCtx.user.id,
        status: 'ACTIVE',
      },
      include: {
        business: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: authCtx.user,
      membership: authCtx.membership || null,
      activeBusiness: authCtx.business || null,
      accessibleBusinesses: memberships.map((m) => ({
        businessId: m.businessId,
        businessName: m.business.name,
        businessType: m.business.businessType,
        roleKey: m.role.roleKey,
      })),
    });
  } catch (err: any) {
    console.error('Auth /me error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
