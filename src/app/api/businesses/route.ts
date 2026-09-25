import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx || !authCtx.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await db.businessMember.findMany({
      where: {
        userId: authCtx.user.id,
        status: 'ACTIVE',
      },
      include: {
        business: {
          include: {
            branches: true,
          },
        },
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      businesses: memberships.map((m) => ({
        id: m.business.id,
        name: m.business.name,
        legalName: m.business.legalName,
        businessType: m.business.businessType,
        currency: m.business.currency,
        gstin: m.business.gstin,
        upiVpa: m.business.upiVpa,
        roleKey: m.role.roleKey,
        branches: m.business.branches,
      })),
    });
  } catch (err: any) {
    console.error('List businesses error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx || !authCtx.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, legalName, businessType, gstin, phone, address, city, stateCode, stateName, pincode } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business name is required.' },
        { status: 400 }
      );
    }

    // Atomic business creation with default branch, roles and membership
    const result = await db.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          ownerUserId: authCtx.user.id,
          name: name.trim(),
          legalName: legalName?.trim() || null,
          businessType: businessType || 'retail',
          gstin: gstin?.trim() || null,
          currency: 'INR',
        },
      });

      // 2. Create Default Main Branch
      const branch = await tx.branch.create({
        data: {
          businessId: business.id,
          name: 'Main Counter',
          branchCode: 'MAIN',
          isMainBranch: true,
          addressLine1: address?.trim() || 'Main Market Road',
          city: city?.trim() || 'Local City',
          stateCode: stateCode || '27',
          stateName: stateName || 'Maharashtra',
          pincode: pincode || '400001',
          contactPhone: phone || authCtx.user.phoneNumber || null,
        },
      });

      // 3. Create Standard Business Roles
      const ownerRole = await tx.role.create({
        data: {
          businessId: business.id,
          roleKey: 'OWNER',
          displayName: 'Business Owner',
          description: 'Full unrestricted authority over the business',
          isSystemDefault: true,
        },
      });

      // Also provision standard subordinate roles for future staff
      await tx.role.createMany({
        data: [
          {
            businessId: business.id,
            roleKey: 'MANAGER',
            displayName: 'Store Manager',
            description: 'Operations and staff supervision',
            isSystemDefault: true,
          },
          {
            businessId: business.id,
            roleKey: 'CASHIER',
            displayName: 'Counter Cashier',
            description: 'Fast billing and payments',
            isSystemDefault: true,
          },
          {
            businessId: business.id,
            roleKey: 'ACCOUNTANT',
            displayName: 'Accountant / CA',
            description: 'Financial reports and ledger exports',
            isSystemDefault: true,
          },
        ],
      });

      // 4. Create Business Membership for Owner
      const member = await tx.businessMember.create({
        data: {
          businessId: business.id,
          branchId: branch.id,
          userId: authCtx.user.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
        },
      });

      // 5. Log Audit Trail
      await logAudit(
        {
          businessId: business.id,
          actorUserId: authCtx.user.id,
          globalRole: authCtx.user.globalRole,
          businessRole: 'OWNER',
          action: 'BUSINESS_CREATED',
          entityName: 'business',
          entityId: business.id,
          newState: {
            name: business.name,
            businessType: business.businessType,
            branchId: branch.id,
          },
        },
        tx
      );

      return {
        business,
        branch,
        member,
      };
    });

    return NextResponse.json({
      success: true,
      business: result.business,
      branch: result.branch,
      message: 'Business created successfully',
    });
  } catch (err: any) {
    console.error('Create business error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create business' },
      { status: 500 }
    );
  }
}
