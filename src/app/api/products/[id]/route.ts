import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_READ);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { business } = guard.context;
  const { id } = await params;

  try {
    const product = await db.product.findFirst({
      where: {
        id,
        businessId: business.id,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (err: any) {
    console.error('Get product error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_UPDATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const existing = await db.product.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

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
      isActive,
    } = body;

    const updated = await db.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        sku: sku !== undefined ? sku?.trim() || null : existing.sku,
        barcode: barcode !== undefined ? barcode?.trim() || null : existing.barcode,
        brand: brand !== undefined ? brand?.trim() || null : existing.brand,
        unit: unit !== undefined ? unit.toUpperCase() : existing.unit,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : existing.purchasePrice,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : existing.sellingPrice,
        isTaxInclusive: isTaxInclusive !== undefined ? Boolean(isTaxInclusive) : existing.isTaxInclusive,
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : existing.gstRate,
        cessRate: cessRate !== undefined ? parseFloat(cessRate) : existing.cessRate,
        hsnCode: hsnCode !== undefined ? hsnCode?.trim() || null : existing.hsnCode,
        currentStock: currentStock !== undefined ? parseFloat(currentStock) : existing.currentStock,
        minimumStock: minimumStock !== undefined ? parseFloat(minimumStock) : existing.minimumStock,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
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
      action: 'PRODUCT_UPDATED',
      entityName: 'product',
      entityId: updated.id,
      oldState: {
        name: existing.name,
        sellingPrice: existing.sellingPrice,
        currentStock: existing.currentStock,
      },
      newState: {
        name: updated.name,
        sellingPrice: updated.sellingPrice,
        currentStock: updated.currentStock,
      },
    });

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Product updated successfully',
    });
  } catch (err: any) {
    console.error('Update product error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.INVENTORY_UPDATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const existing = await db.product.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete product by marking isActive = false
    const archived = await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      businessId: business.id,
      actorUserId: user.id,
      globalRole: user.globalRole,
      businessRole: membership.roleKey,
      action: 'PRODUCT_ARCHIVED',
      entityName: 'product',
      entityId: archived.id,
      newState: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (err: any) {
    console.error('Archive product error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to archive product' },
      { status: 500 }
    );
  }
}
