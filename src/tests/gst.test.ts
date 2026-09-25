import { describe, it, expect } from 'vitest';
import {
  calculateLineItem,
  calculateGstInvoice,
  resolveSupplyType,
  roundCurrency,
} from '@/lib/gst';

describe('VyaparOS — Indian GST Calculation Engine', () => {
  it('correctly calculates Tax-Exclusive intra-state line items', () => {
    // ₹1,000 @ 18% GST (Intra-state: 9% CGST + 9% SGST)
    const line = calculateLineItem(
      {
        itemName: 'Electronic Scale',
        quantity: 1,
        unitPrice: 1000,
        gstRate: 18,
        isTaxInclusive: false,
      },
      'INTRA_STATE'
    );

    expect(line.grossAmount).toBe(1000);
    expect(line.taxableAmount).toBe(1000);
    expect(line.cgstAmount).toBe(90);
    expect(line.sgstAmount).toBe(90);
    expect(line.igstAmount).toBe(0);
    expect(line.totalTaxAmount).toBe(180);
    expect(line.totalAmount).toBe(1180);
  });

  it('correctly calculates Tax-Inclusive intra-state line items', () => {
    // Selling price ₹1,180 with 18% GST inclusive -> Taxable ₹1,000, GST ₹180
    const line = calculateLineItem(
      {
        itemName: 'Branded Basmati Rice',
        quantity: 1,
        unitPrice: 1180,
        gstRate: 18,
        isTaxInclusive: true,
      },
      'INTRA_STATE'
    );

    expect(line.grossAmount).toBe(1180);
    expect(line.taxableAmount).toBe(1000);
    expect(line.cgstAmount).toBe(90);
    expect(line.sgstAmount).toBe(90);
    expect(line.igstAmount).toBe(0);
    expect(line.totalTaxAmount).toBe(180);
    expect(line.totalAmount).toBe(1180);
  });

  it('correctly routes 100% of tax to IGST for Inter-State supply', () => {
    // Inter-State supply: ₹2,000 @ 12% GST -> IGST ₹240, CGST 0, SGST 0
    const line = calculateLineItem(
      {
        itemName: 'Dry Fruits Box',
        quantity: 2,
        unitPrice: 1000,
        gstRate: 12,
        isTaxInclusive: false,
      },
      'INTER_STATE'
    );

    expect(line.grossAmount).toBe(2000);
    expect(line.taxableAmount).toBe(2000);
    expect(line.cgstAmount).toBe(0);
    expect(line.sgstAmount).toBe(0);
    expect(line.igstAmount).toBe(240);
    expect(line.totalTaxAmount).toBe(240);
    expect(line.totalAmount).toBe(2240);
  });

  it('correctly applies line discounts before GST computation', () => {
    // ₹1,000 with 10% discount -> Taxable ₹900 @ 18% -> CGST ₹81, SGST ₹81, Total ₹1,062
    const line = calculateLineItem(
      {
        itemName: 'Cooking Oil 15L',
        quantity: 1,
        unitPrice: 1000,
        discountPercent: 10,
        gstRate: 18,
        isTaxInclusive: false,
      },
      'INTRA_STATE'
    );

    expect(line.discountAmount).toBe(100);
    expect(line.taxableAmount).toBe(900);
    expect(line.cgstAmount).toBe(81);
    expect(line.sgstAmount).toBe(81);
    expect(line.totalAmount).toBe(1062);
  });

  it('calculates full multi-item invoice with HSN summary and round-off', () => {
    const summary = calculateGstInvoice(
      [
        {
          itemName: 'Item A',
          hsnCode: '2106',
          quantity: 2,
          unitPrice: 49.5,
          gstRate: 5,
          isTaxInclusive: false,
        },
        {
          itemName: 'Item B',
          hsnCode: '1905',
          quantity: 1,
          unitPrice: 100,
          gstRate: 12,
          isTaxInclusive: false,
        },
      ],
      'INTRA_STATE'
    );

    // Item A: 2 * 49.5 = 99 @ 5% = 4.95 (CGST 2.48, SGST 2.47) -> Total 103.95
    // Item B: 1 * 100 = 100 @ 12% = 12 (CGST 6, SGST 6) -> Total 112
    // Raw Total = 215.95 -> Rounded = 216 -> Round-off = +0.05
    expect(summary.subtotal).toBe(199);
    expect(summary.taxableAmount).toBe(199);
    expect(summary.rawTotal).toBe(215.95);
    expect(summary.roundOff).toBe(0.05);
    expect(summary.grandTotal).toBe(216);
    expect(summary.hsnSummary.length).toBe(2);
  });

  it('correctly resolves supply type based on state codes', () => {
    expect(resolveSupplyType('27', '27')).toBe('INTRA_STATE');
    expect(resolveSupplyType('27', '09')).toBe('INTER_STATE');
    expect(resolveSupplyType('27', null)).toBe('INTRA_STATE');
  });
});
