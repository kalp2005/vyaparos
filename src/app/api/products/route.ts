import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim() || '';
  const categoryId = url.searchParams.get('categoryId');
  const barcode = url.searchParams.get('barcode')?.trim();
  const lowStockOnly = url.searchParams.get('lowStock') === 'true';
  const isActiveParam = url.searchParams.get('isActive');

  try {
    const where: any = {
      businessId: business.id,
    };

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (barcode) {
      where.barcode = barcode;
    } else if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const filtered = lowStockOnly
      ? products.filter((p) => p.currentStock <= p.minimumStock)
      : products;

    return NextResponse.json({
      success: true,
      products: filtered,
      count: filtered.length,
    });
  } catch (err: any) {
    console.error('List products error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;

  try {
    const body = await req.json();
    const {
      name,
      categoryId,
      sku,
      barcode,
      brand,
      unit,
      purchasePrice,
      sellingPrice,
      isTaxInclusive,
      gstRate,
      cessRate,
      hsnCode,
      currentStock,
      minimumStock,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product name is required.' },
        { status: 400 }
      );
    }

    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid selling price is required.' },
        { status: 400 }
      );
    }

    // Check Barcode Uniqueness within tenant
    if (barcode && barcode.trim().length > 0) {
      const cleanBarcode = barcode.trim();
      const existingBarcode = await db.product.findFirst({
        where: {
          businessId: business.id,
          barcode: cleanBarcode,
        },
      });

      if (existingBarcode) {
        return NextResponse.json(
          { success: false, error: `A product with barcode "${cleanBarcode}" already exists (${existingBarcode.name}).` },
          { status: 409 }
        );
      }
    }

    // Verify Category if provided
    if (categoryId) {
      const cat = await db.category.findFirst({
        where: {
          id: categoryId,
          businessId: business.id,
        },
      });
      if (!cat) {
        return NextResponse.json(
          { success: false, error: 'Selected category does not exist in this store.' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.create({
      data: {
        businessId: business.id,
        categoryId: categoryId || null,
        name: name.trim(),
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        brand: brand?.trim() || null,
        unit: (unit || 'PCS').toUpperCase(),
        purchasePrice: parseFloat(purchasePrice) || 0.0,
        sellingPrice: price,
        isTaxInclusive: Boolean(isTaxInclusive),
        gstRate: parseFloat(gstRate) || 0.0,
        cessRate: parseFloat(cessRate) || 0.0,
        hsnCode: hsnCode?.trim() || null,
        currentStock: parseFloat(currentStock) || 0.0,
        minimumStock: parseFloat(minimumStock) || 5.0,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    await logAudit({
      businessId: business.id,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      action: 'PRODUCT_CREATED',
      entityName: 'product',
      entityId: product.id,
      newState: {
        name: product.name,
        sellingPrice: product.sellingPrice,
        gstRate: product.gstRate,
        currentStock: product.currentStock,
      },
    });

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully',
    });
  } catch (err: any) {
    console.error('Create product error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
