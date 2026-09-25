import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;

  try {
    const categories = await db.category.findMany({
      where: {
        businessId: business.id,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    console.error('List categories error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;

  try {
    const body = await req.json();
    const { name, description, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category name is required.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    const existing = await db.category.findFirst({
      where: {
        businessId: business.id,
        name: cleanName,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Category "${cleanName}" already exists.` },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        businessId: business.id,
        name: cleanName,
        description: description?.trim() || null,
        color: color || '#0284c7',
      },
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (err: any) {
    console.error('Create category error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
