import { Prisma } from '@prisma/client';
import { db } from './db';

/**
 * Get current Indian Financial Year string (e.g. '2026-2027').
 * In India, financial year starts on April 1st and ends on March 31st.
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
  
  if (month >= 3) {
    // April to December
    return `${year}-${year + 1}`;
  } else {
    // January to March
    return `${year - 1}-${year}`;
  }
}

/**
 * Atomically generate the next sequential, collision-free invoice number for a given business tenant.
 * Must be executed inside a Prisma transaction context to guarantee thread-safe uniqueness.
 */
export async function generateNextInvoiceNumber(
  businessId: string,
  prefix: string = 'INV',
  tx?: Prisma.TransactionClient,
  customDate: Date = new Date()
): Promise<string> {
  const client = tx || db;
  const financialYear = getCurrentFinancialYear(customDate);
  const cleanPrefix = prefix.trim().toUpperCase();

  // Find or create the sequence row for this tenant and FY
  let sequence = await client.invoiceSequence.findUnique({
    where: {
      businessId_prefix_financialYear: {
        businessId,
        prefix: cleanPrefix,
        financialYear,
      },
    },
  });

  if (!sequence) {
    sequence = await client.invoiceSequence.create({
      data: {
        businessId,
        prefix: cleanPrefix,
        financialYear,
        currentCount: 1,
      },
    });
  } else {
    sequence = await client.invoiceSequence.update({
      where: {
        id: sequence.id,
      },
      data: {
        currentCount: {
          increment: 1,
        },
      },
    });
  }

  // Format: INV-000001 (or INV-26-000001 for financial year alignment)
  const paddedNumber = sequence.currentCount.toString().padStart(6, '0');
  const shortFy = financialYear.split('-').map(y => y.slice(2)).join('');
  return `${cleanPrefix}-${shortFy}-${paddedNumber}`;
}
