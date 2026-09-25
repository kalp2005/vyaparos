'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TransactionModal } from '@/components/khata/TransactionModal';
import { ReversalModal } from '@/components/khata/ReversalModal';
import { TransactionFeed, TransactionItem } from '@/components/khata/TransactionFeed';
import { useLanguage } from '@/lib/i18n/context';
import { FadeIn, NumberCounter } from '@/components/ui/motion';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t, formatCurrency } = useLanguage();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnModalType, setTxnModalType] = useState<'CREDIT_GIVEN' | 'PAYMENT_RECEIVED'>('CREDIT_GIVEN');
  const [reversalTxn, setReversalTxn] = useState<TransactionItem | null>(null);

  const fetchCustomerData = () => {
    if (!customerId) return;
    setIsLoading(true);
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomer(data.customer);
          setTransactions(data.customer.transactions || []);
        } else {
          router.push('/dashboard/customers');
        }
      })
      .catch((err) => console.error('Error fetching customer profile:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const isDue = (customer?.outstandingBalance || 0) > 0;
  const isAdvance = (customer?.outstandingBalance || 0) < 0;

  const whatsappMsg = customer
    ? encodeURIComponent(
        isDue
          ? t.customerProfile.reminderDueMsg
              .replace('{name}', customer.name)
              .replace('{amount}', Math.abs(customer.outstandingBalance).toString())
          : t.customerProfile.reminderSettledMsg.replace('{name}', customer.name)
      )
    : '';

  return (
    <FadeIn className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.customerProfile.backToDirectory}</span>
        </Link>
      </div>

      {/* Customer Header Summary Card */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Avatar & Meta */}
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                  isDue
                    ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : isAdvance
                    ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {customer?.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {customer?.name}
                  </h1>
                  <Badge variant={isDue ? 'dena' : isAdvance ? 'advance' : 'lena'} size="sm">
                    {isDue
                      ? t.financial.lenaHai
                      : isAdvance
                      ? t.financial.advance
                      : t.financial.settled}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer?.phoneNumber}
                  </span>
                  {customer?.city && <span>• {customer.city}</span>}
                  <span>• Trust Score: <strong>{customer?.paymentReliabilityScore || 750}</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Outstanding Balance Display & WhatsApp */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  {t.financial.currentBalance}
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-mono ${
                    isDue
                      ? 'text-rose-600 dark:text-rose-400'
                      : isAdvance
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <NumberCounter value={Math.abs(customer?.outstandingBalance || 0)} />
                </span>
              </div>

              {customer && (
                <a
                  href={`https://wa.me/91${customer.phoneNumber.replace(/\D/g, '')}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.customerProfile.sendWhatsApp}</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Action Entry Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                setTxnModalType('CREDIT_GIVEN');
                setIsTxnModalOpen(true);
              }}
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
              className="font-bold shadow-md shadow-rose-500/10"
            >
              + {t.financial.udharDiya}
            </Button>

            <Button
              variant="success"
              size="md"
              onClick={() => {
                setTxnModalType('PAYMENT_RECEIVED');
                setIsTxnModalOpen(true);
              }}
              leftIcon={<ArrowDownLeft className="w-4 h-4" />}
              className="font-bold shadow-md shadow-emerald-500/10"
            >
              + {t.financial.jamaMila}
            </Button>
          </div>
        </Card>
      )}

      {/* Transaction Statement Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>{t.customerProfile.statementTitle}</span>
          </h2>
          <span className="text-xs text-slate-400">
            {transactions.length} Total Entries
          </span>
        </div>

        <Card className="p-2 sm:p-4">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <TransactionFeed
              transactions={transactions}
              onReverse={(txn) => setReversalTxn(txn)}
              showCustomerName={false}
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      {customer && (
        <TransactionModal
          isOpen={isTxnModalOpen}
          onClose={() => setIsTxnModalOpen(false)}
          onSuccess={() => fetchCustomerData()}
          preselectedCustomerId={customer.id}
          preselectedCustomerName={customer.name}
          defaultType={txnModalType}
        />
      )}

      <ReversalModal
        isOpen={!!reversalTxn}
        onClose={() => setReversalTxn(null)}
        onSuccess={() => fetchCustomerData()}
        transaction={
          reversalTxn
            ? {
                id: reversalTxn.id,
                amount: reversalTxn.amount,
                transactionType: reversalTxn.transactionType,
                customerName: customer?.name,
              }
            : null
        }
      />
    </FadeIn>
  );
}
