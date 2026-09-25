'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Ban,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLanguage } from '@/lib/i18n/context';
import { InvoicePrint } from '@/components/billing/InvoicePrint';

export default function InvoicesFeedPage() {
  const router = useRouter();
  const { formatCurrency } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Print modal state
  const [activePrintInvoice, setActivePrintInvoice] = useState<any | null>(null);
  const [businessData, setBusinessData] = useState<any | null>(null);

  // Cancellation modal state
  const [cancellingInvoiceId, setCancellingInvoiceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchInvoices = () => {
    setIsLoading(true);
    let url = `/api/invoices?search=${encodeURIComponent(searchQuery)}`;
    if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
    if (selectedPaymentStatus !== 'ALL') url += `&paymentStatus=${selectedPaymentStatus}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices || []);
          setStats(data.stats || null);
        }
      })
      .catch((err) => console.error('Fetch invoices error:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activeBusiness) {
          setBusinessData(data.activeBusiness);
        }
      });

    fetchInvoices();
  }, [selectedStatus, selectedPaymentStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleCancelInvoice = async () => {
    if (!cancellingInvoiceId || !cancelReason.trim()) return;
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/invoices/${cancellingInvoiceId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCancellingInvoiceId(null);
        setCancelReason('');
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to cancel invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            GST Invoicing & Bills Feed
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Master billing register, GST tax summaries, and customer invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm">
              Manage Products
            </Button>
          </Link>
          <Link href="/dashboard/billing/pos">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Open POS Counter
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Billed Sales"
          amount={stats?.totalSales || 0}
          type="cash"
          subtitle={`${stats?.invoiceCount || 0} bills generated`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          trend="100% Verified"
        />
        <StatCard
          title="Cash & Digital Collected"
          amount={stats?.totalPaid || 0}
          type="lena"
          subtitle="Realized receipts"
          icon={<CheckCircle2 className="w-5 h-5 text-cyan-600" />}
        />
        <StatCard
          title="Pending Credit (Udhar)"
          amount={stats?.totalDue || 0}
          type="dena"
          subtitle="Receivable from parties"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="GST Tax Collected"
          amount={stats?.totalGst || 0}
          type="neutral"
          subtitle="CGST + SGST + IGST liability"
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Payment Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid (Credit)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Invoices</option>
            <option value="ISSUED">Active (Issued)</option>
            <option value="CANCELLED">Cancelled / Void</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No Invoices Found"
            description="Create your first bill from the POS counter to track sales, GST, and customer credit."
            actionLabel="+ Open POS Counter"
            icon={FileText}
            onAction={() => router.push('/dashboard/billing/pos')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Items</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-vyapar-700 dark:text-vyapar-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {inv.customer ? (
                        <div>
                          <p className="font-bold">{inv.customer.name}</p>
                          <p className="text-[10px] text-slate-400">{inv.customer.phoneNumber}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in Customer</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {inv.items?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {inv.status === 'CANCELLED' ? (
                        <Badge variant="void">Cancelled</Badge>
                      ) : inv.paymentStatus === 'PAID' ? (
                        <Badge variant="advance">Paid</Badge>
                      ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                        <Badge variant="warning">Part Paid</Badge>
                      ) : (
                        <Badge variant="lena">Udhar (Due)</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActivePrintInvoice(inv)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Print Invoice / Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {inv.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setCancellingInvoiceId(inv.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Cancel / Void Bill"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Print Modal */}
      {activePrintInvoice && businessData && (
        <InvoicePrint
          invoice={activePrintInvoice}
          business={businessData}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}

      {/* Invoice Cancellation Modal */}
      {cancellingInvoiceId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Cancel Invoice
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cancelling this invoice will atomically restore product inventory, reverse customer credit balances in Khata, and void the ledger transactions.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Cancellation Reason *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer returned items / Bill generated by mistake"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500 h-20 resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCancellingInvoiceId(null);
                  setCancelReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelInvoice}
                isLoading={isCancelling}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
