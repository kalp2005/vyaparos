import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERMISSIONS } from '@/lib/types/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireTenant(req, PERMISSIONS.PAYMENT_CREATE);
  if ('errorResponse' in guard) return guard.errorResponse;

  const { user, business, membership } = guard.context;
  const { id } = await params;

  try {
    const body = await req.json();
    const { amount, paymentMode, paymentReference, notes } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid positive payment amount is required.' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id,
          businessId: business.id,
        },
        include: {
          customer: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
        throw new Error('Cannot add payment to a cancelled invoice');
      }

      if (invoice.balanceDue <= 0) {
        throw new Error('This invoice is already fully paid');
      }

      const appliedAmount = Math.min(invoice.balanceDue, paymentAmount);
      const newPaidAmount = invoice.paidAmount + appliedAmount;
      const newBalanceDue = Math.max(0, invoice.grandTotal - newPaidAmount);
      const newPaymentStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

      // 1. Record InvoicePayment
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          businessId: business.id,
          amount: appliedAmount,
          paymentMode: paymentMode || 'CASH',
          paymentReference: paymentReference || null,
          notes: notes || null,
          createdByUserId: user.id,
        },
      });

      // 2. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          paymentStatus: newPaymentStatus,
        },
      });

      // 3. If linked to Customer Khata, reduce customer outstandingBalance
      if (invoice.customer) {
        await tx.customer.update({
          where: { id: invoice.customer.id },
          data: {
            outstandingBalance: {
              decrement: appliedAmount,
            },
          },
        });

        // Record Khata payment transaction
        const txn = await tx.transaction.create({
          data: {
            businessId: business.id,
            partyType: 'CUSTOMER',
            customerId: invoice.customer.id,
            invoiceId: invoice.id,
            transactionType: 'PAYMENT_RECEIVED',
            amount: appliedAmount,
            paymentMode: paymentMode || 'CASH',
            paymentReference: paymentReference || null,
            description: `Payment for Invoice ${invoice.invoiceNumber}`,
            createdByUserId: user.id,
          },
        });

        // Double-entry legs: Debit Cash/Bank, Credit Accounts Receivable
        const assetAccount = paymentMode === 'UPI' || paymentMode === 'BANK_TRANSFER'
          ? 'BANK_ACCOUNT'
          : 'CASH_IN_HAND';

        await tx.transactionEntry.createMany({
          data: [
            {
              transactionId: txn.id,
              accountType: assetAccount,
              entryType: 'DEBIT',
              amount: appliedAmount,
            },
            {
              transactionId: txn.id,
              accountType: 'ACCOUNTS_RECEIVABLE',
              entryType: 'CREDIT',
              amount: appliedAmount,
            },
          ],
        });
      }

      await logAudit(
        {
          businessId: business.id,
          actorUserId: user.id,
          globalRole: user.globalRole,
          businessRole: membership.roleKey,
          action: 'PAYMENT_RECORDED',
          entityName: 'invoice_payment',
          entityId: payment.id,
          newState: {
            invoiceId: invoice.id,
            amount: appliedAmount,
            paymentMode: paymentMode || 'CASH',
            newBalanceDue,
          },
        },
        tx
      );

      return {
        payment,
        invoice: updatedInvoice,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Payment recorded successfully',
    });
  } catch (err: any) {
    console.error('Record payment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
