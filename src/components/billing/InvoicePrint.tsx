'use client';

import React from 'react';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/context';

interface InvoicePrintProps {
  invoice: any;
  business: any;
  format?: 'a4' | 'thermal80' | 'thermal58';
  onClose?: () => void;
}

export function InvoicePrint({
  invoice,
  business,
  format = 'a4',
  onClose,
}: InvoicePrintProps) {
  const { formatCurrency } = useLanguage();
  const [printFormat, setPrintFormat] = React.useState<'a4' | 'thermal80' | 'thermal58'>(format);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!invoice.customer?.phoneNumber) {
      alert('No customer phone number available for this invoice.');
      return;
    }
    const cleanPhone = invoice.customer.phoneNumber.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${invoice.customer.name}, here is your bill ${invoice.invoiceNumber} from ${business.name} for ₹${invoice.grandTotal.toFixed(2)}. Thank you for shopping with us!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 print:p-0 print:bg-white print:static print:h-auto">
      {/* Control Bar (Hidden when printing) */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-between shadow-xl print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              printFormat === 'a4'
                ? 'bg-vyapar-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            A4 GST Invoice
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('thermal80')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              printFormat === 'thermal80'
                ? 'bg-vyapar-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            80mm Thermal
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('thermal58')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              printFormat === 'thermal58'
                ? 'bg-vyapar-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            58mm POS
          </button>
        </div>

        <div className="flex items-center gap-2">
          {invoice.customer?.phoneNumber && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              WhatsApp
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Now
          </Button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Area */}
      {printFormat === 'a4' ? (
        /* ================= A4 GST TAX INVOICE ================= */
        <div className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {business.name}
              </h1>
              {business.legalName && business.legalName !== business.name && (
                <p className="text-xs text-slate-500 font-medium">{business.legalName}</p>
              )}
              {business.gstin && (
                <p className="text-xs font-bold font-mono text-slate-700 mt-1">
                  GSTIN: <span className="text-vyapar-700">{business.gstin}</span>
                </p>
              )}
              {business.upiVpa && (
                <p className="text-xs font-medium text-slate-600">UPI VPA: {business.upiVpa}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-vyapar-50 border border-vyapar-200 text-vyapar-800 text-xs font-black rounded-lg uppercase tracking-wider">
                {invoice.billingType === 'TAX_INVOICE' || business.gstin ? 'TAX INVOICE' : 'RETAIL INVOICE'}
              </span>
              <p className="text-sm font-black text-slate-900 mt-2 font-mono">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500">
                Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500">
                Supply: <span className="font-semibold">{invoice.supplyType === 'INTRA_STATE' ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}</span>
              </p>
            </div>
          </div>

          {/* Bill To Customer */}
          <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Billed To (Party Details)</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {invoice.customer ? invoice.customer.name : 'Walk-in Customer'}
              </p>
              {invoice.customer?.phoneNumber && (
                <p className="text-slate-600">Phone: {invoice.customer.phoneNumber}</p>
              )}
              {invoice.customer?.gstin && (
                <p className="font-mono font-semibold text-slate-700">GSTIN: {invoice.customer.gstin}</p>
              )}
              {invoice.customer?.address && (
                <p className="text-slate-500">{invoice.customer.address}</p>
              )}
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Summary</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                Status: <span className="font-bold uppercase text-emerald-700">{invoice.paymentStatus}</span>
              </p>
              <p className="text-xs text-slate-600">
                Paid Amount: <span className="font-bold">{formatCurrency(invoice.paidAmount)}</span>
              </p>
              {invoice.balanceDue > 0 && (
                <p className="text-xs font-bold text-rose-600">
                  Balance Due (Udhar): {formatCurrency(invoice.balanceDue)}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2 w-8">#</th>
                  <th className="py-2">Item Description</th>
                  <th className="py-2">HSN</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Taxable</th>
                  <th className="py-2 text-right">GST %</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it: any, idx: number) => (
                  <tr key={it.id || idx}>
                    <td className="py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 font-bold text-slate-900">{it.itemName}</td>
                    <td className="py-2.5 font-mono text-slate-500">{it.hsnCode || '-'}</td>
                    <td className="py-2.5 text-right font-medium">{it.quantity} {it.unit}</td>
                    <td className="py-2.5 text-right font-mono">{it.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono">{it.taxableAmount.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono">{it.gstRate}%</td>
                    <td className="py-2.5 text-right font-bold font-mono">{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Summary */}
          <div className="flex justify-between items-start border-t-2 border-slate-300 pt-4">
            <div className="w-1/2 text-xs space-y-2">
              {business.bankAccountNumber && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-[10px] uppercase text-slate-400">Bank Details for Transfer</p>
                  <p className="font-semibold text-slate-800">{business.bankName || 'Primary Bank'}</p>
                  <p className="font-mono text-slate-600">A/C: {business.bankAccountNumber}</p>
                  <p className="font-mono text-slate-600">IFSC: {business.bankIfscCode}</p>
                </div>
              )}
              {invoice.notes && (
                <p className="text-slate-500 italic text-[11px]">Note: {invoice.notes}</p>
              )}
            </div>

            <div className="w-2/5 text-xs space-y-1.5 text-right">
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between py-0.5 text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono font-medium">-{invoice.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono font-medium">{invoice.taxableAmount.toFixed(2)}</span>
              </div>
              {invoice.cgstTotal > 0 && (
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>CGST:</span>
                  <span className="font-mono font-medium">+{invoice.cgstTotal.toFixed(2)}</span>
                </div>
              )}
              {invoice.sgstTotal > 0 && (
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>SGST:</span>
                  <span className="font-mono font-medium">+{invoice.sgstTotal.toFixed(2)}</span>
                </div>
              )}
              {invoice.igstTotal > 0 && (
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>IGST:</span>
                  <span className="font-mono font-medium">+{invoice.igstTotal.toFixed(2)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between py-0.5 text-slate-400">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-vyapar-700">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Thank you for your business! Computer-generated tax invoice via VyaparOS.</p>
          </div>
        </div>
      ) : (
        /* ================= THERMAL RECEIPT (58mm / 80mm) ================= */
        <div
          className={`bg-white text-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 font-mono text-[11px] leading-tight print:shadow-none print:border-none print:p-0 print:m-0 ${
            printFormat === 'thermal58' ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
          }`}
        >
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <p className="font-black text-sm uppercase">{business.name}</p>
            {business.gstin && <p className="text-[10px]">GSTIN: {business.gstin}</p>}
            {business.upiVpa && <p className="text-[10px]">UPI: {business.upiVpa}</p>}
            <p className="text-[10px] mt-1 font-bold">INV: {invoice.invoiceNumber}</p>
            <p className="text-[10px] text-slate-500">
              {new Date(invoice.invoiceDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            {invoice.customer && (
              <p className="text-[10px] font-bold mt-0.5">Cust: {invoice.customer.name}</p>
            )}
          </div>

          {/* Items */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-0.5">
              <span>ITEM</span>
              <span>QTY x RATE</span>
              <span>AMT</span>
            </div>
            {invoice.items.map((it: any, idx: number) => (
              <div key={it.id || idx} className="space-y-0.5">
                <p className="font-bold truncate">{it.itemName}</p>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>{it.quantity} {it.unit} x {it.unitPrice.toFixed(2)}</span>
                  <span className="font-bold font-mono text-slate-900">{it.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{invoice.discountTotal.toFixed(2)}</span>
              </div>
            )}
            {(invoice.cgstTotal > 0 || invoice.sgstTotal > 0 || invoice.igstTotal > 0) && (
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Total Tax (GST):</span>
                <span>+₹{(invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-1 mt-1">
              <span>TOTAL:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Paid: ₹{invoice.paidAmount.toFixed(2)}</span>
              <span>Due: ₹{invoice.balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-500">
            <p>*** THANK YOU! VISIT AGAIN ***</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Powered by VyaparOS</p>
          </div>
        </div>
      )}
    </div>
  );
}
