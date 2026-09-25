/**
 * VyaparOS — Deterministic Indian GST Calculation Engine
 * 
 * Provides statutory-compliant, high-precision monetary calculations for:
 * - Tax Exclusive and Tax Inclusive pricing
 * - Intra-State supply (CGST 50% + SGST 50%) vs Inter-State supply (IGST 100%)
 * - Line item discounts (percentage or flat)
 * - Round-off and Grand Total computation
 * 
 * Uses exact 2-decimal rounded arithmetic (Paise precision) to avoid floating-point drift.
 */

export type SupplyType = 'INTRA_STATE' | 'INTER_STATE';

export interface GstLineItemInput {
  productId?: string | null;
  itemName: string;
  sku?: string | null;
  hsnCode?: string | null;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  isTaxInclusive?: boolean;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  cessRate?: number; // e.g. 0, 12
}

export interface CalculatedLineItem {
  productId?: string | null;
  itemName: string;
  sku?: string | null;
  hsnCode?: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  grossAmount: number; // qty * unitPrice
  taxableAmount: number; // base taxable amount after discounts
  gstRate: number;
  cessRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  totalAmount: number; // taxable + totalTax
}

export interface CalculatedInvoiceSummary {
  supplyType: SupplyType;
  items: CalculatedLineItem[];
  subtotal: number; // sum of (qty * unitPrice)
  discountTotal: number; // sum of discounts
  taxableAmount: number; // sum of line taxable values
  cgstTotal: number; // sum of CGST
  sgstTotal: number; // sum of SGST
  igstTotal: number; // sum of IGST
  cessTotal: number; // sum of CESS
  totalTax: number; // cgst + sgst + igst + cess
  rawTotal: number; // taxableAmount + totalTax
  roundOff: number; // difference to reach nearest whole rupee
  grandTotal: number; // rounded final payable amount
  hsnSummary: Array<{
    hsnCode: string;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalTax: number;
  }>;
}

/**
 * Round a number strictly to 2 decimal places with half-up rounding.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Determine if a transaction between two Indian state codes is Intra-State or Inter-State.
 * If customer state is missing or equal to merchant state -> INTRA_STATE.
 */
export function resolveSupplyType(merchantStateCode?: string | null, customerStateCode?: string | null): SupplyType {
  if (!merchantStateCode || !customerStateCode) {
    return 'INTRA_STATE';
  }
  const cleanMerchant = merchantStateCode.trim().toUpperCase();
  const cleanCustomer = customerStateCode.trim().toUpperCase();
  return cleanMerchant === cleanCustomer ? 'INTRA_STATE' : 'INTER_STATE';
}

/**
 * Calculate a single line item's taxes and amounts deterministically.
 */
export function calculateLineItem(item: GstLineItemInput, supplyType: SupplyType = 'INTRA_STATE'): CalculatedLineItem {
  const quantity = Math.max(0, item.quantity);
  const unitPrice = Math.max(0, item.unitPrice);
  const gstRate = Math.max(0, item.gstRate || 0);
  const cessRate = Math.max(0, item.cessRate || 0);
  const totalTaxRate = gstRate + cessRate;
  const isInclusive = Boolean(item.isTaxInclusive);

  const grossAmount = roundCurrency(quantity * unitPrice);

  // Determine Discount
  let discountAmount = 0;
  let discountPercent = item.discountPercent || 0;
  if (item.discountAmount && item.discountAmount > 0) {
    discountAmount = Math.min(grossAmount, roundCurrency(item.discountAmount));
    discountPercent = grossAmount > 0 ? roundCurrency((discountAmount / grossAmount) * 100) : 0;
  } else if (discountPercent > 0) {
    discountAmount = roundCurrency(grossAmount * (discountPercent / 100));
  }

  const effectiveGross = Math.max(0, grossAmount - discountAmount);

  let taxableAmount = 0;
  let totalTaxAmount = 0;

  if (isInclusive && totalTaxRate > 0) {
    // Tax Inclusive Formula: TaxableValue = Gross / (1 + (Rate / 100))
    taxableAmount = roundCurrency(effectiveGross / (1 + totalTaxRate / 100));
    totalTaxAmount = roundCurrency(effectiveGross - taxableAmount);
  } else {
    // Tax Exclusive Formula: Tax = TaxableValue * (Rate / 100)
    taxableAmount = effectiveGross;
    totalTaxAmount = roundCurrency(taxableAmount * (totalTaxRate / 100));
  }

  // Calculate CESS vs GST
  let cessAmount = 0;
  let gstAmount = totalTaxAmount;
  if (cessRate > 0 && totalTaxRate > 0) {
    cessAmount = roundCurrency(taxableAmount * (cessRate / 100));
    gstAmount = Math.max(0, roundCurrency(totalTaxAmount - cessAmount));
  }

  // Split into CGST / SGST vs IGST
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (supplyType === 'INTRA_STATE') {
    cgstAmount = roundCurrency(gstAmount / 2);
    // Ensure sum matches gstAmount without 1-paisa rounding gap
    sgstAmount = roundCurrency(gstAmount - cgstAmount);
  } else {
    igstAmount = gstAmount;
  }

  const totalAmount = roundCurrency(taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount);

  return {
    productId: item.productId || null,
    itemName: item.itemName,
    sku: item.sku || null,
    hsnCode: item.hsnCode || null,
    unit: item.unit || 'PCS',
    quantity,
    unitPrice,
    discountPercent,
    discountAmount,
    grossAmount,
    taxableAmount,
    gstRate,
    cessRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    totalTaxAmount: roundCurrency(cgstAmount + sgstAmount + igstAmount + cessAmount),
    totalAmount,
  };
}

/**
 * Calculate full invoice totals, HSN summaries, and rounding for a collection of line items.
 */
export function calculateGstInvoice(
  items: GstLineItemInput[],
  supplyType: SupplyType = 'INTRA_STATE'
): CalculatedInvoiceSummary {
  const calculatedItems = items.map((item) => calculateLineItem(item, supplyType));

  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let cessTotal = 0;

  for (const it of calculatedItems) {
    subtotal = roundCurrency(subtotal + it.grossAmount);
    discountTotal = roundCurrency(discountTotal + it.discountAmount);
    taxableAmount = roundCurrency(taxableAmount + it.taxableAmount);
    cgstTotal = roundCurrency(cgstTotal + it.cgstAmount);
    sgstTotal = roundCurrency(sgstTotal + it.sgstAmount);
    igstTotal = roundCurrency(igstTotal + it.igstAmount);
    cessTotal = roundCurrency(cessTotal + it.cessAmount);
  }

  const totalTax = roundCurrency(cgstTotal + sgstTotal + igstTotal + cessTotal);
  const rawTotal = roundCurrency(taxableAmount + totalTax);

  // Standard Indian Invoicing Round-off to nearest Integer Rupee
  const roundedGrandTotal = Math.round(rawTotal);
  const roundOff = roundCurrency(roundedGrandTotal - rawTotal);

  // Group by HSN and GST Rate for GSTR compliance summary
  const hsnMap = new Map<string, {
    hsnCode: string;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalTax: number;
  }>();

  for (const it of calculatedItems) {
    const key = `${it.hsnCode || 'NO_HSN'}_${it.gstRate}`;
    const existing = hsnMap.get(key) || {
      hsnCode: it.hsnCode || 'N/A',
      taxableAmount: 0,
      gstRate: it.gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      totalTax: 0,
    };

    existing.taxableAmount = roundCurrency(existing.taxableAmount + it.taxableAmount);
    existing.cgstAmount = roundCurrency(existing.cgstAmount + it.cgstAmount);
    existing.sgstAmount = roundCurrency(existing.sgstAmount + it.sgstAmount);
    existing.igstAmount = roundCurrency(existing.igstAmount + it.igstAmount);
    existing.cessAmount = roundCurrency(existing.cessAmount + it.cessAmount);
    existing.totalTax = roundCurrency(existing.totalTax + it.totalTaxAmount);

    hsnMap.set(key, existing);
  }

  return {
    supplyType,
    items: calculatedItems,
    subtotal,
    discountTotal,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    cessTotal,
    totalTax,
    rawTotal,
    roundOff,
    grandTotal: roundedGrandTotal,
    hsnSummary: Array.from(hsnMap.values()),
  };
}
