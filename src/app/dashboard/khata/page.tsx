'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Filter, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TransactionFeed, TransactionItem } from '@/components/khata/TransactionFeed';
import { TransactionModal } from '@/components/khata/TransactionModal';
import { ReversalModal } from '@/components/khata/ReversalModal';
import { useLanguage } from '@/lib/i18n/context';
import { FadeIn } from '@/components/ui/motion';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function KhataPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED' | 'VOIDED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [reversalTxn, setReversalTxn] = useState<TransactionItem | null>(null);

  const fetchTransactions = () => {
    setIsLoading(true);
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.transactions) {
          setTransactions(data.transactions);
        }
      })
      .catch((err) => console.error('Failed to load transactions:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((txn) => {
    if (filterType === 'VOIDED') return txn.isVoided;
    if (txn.isVoided) return false;
    if (filterType === 'CREDIT_GIVEN') return txn.transactionType === 'CREDIT_GIVEN';
    if (filterType === 'PAYMENT_RECEIVED') return txn.transactionType === 'PAYMENT_RECEIVED';
    return true;
  });

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.khata.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.khata.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsTxnModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold text-xs shadow-md shadow-vyapar-500/20"
        >
          {t.dashboard.addUdhar}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-fit overflow-x-auto">
        {[
          { key: 'ALL', label: t.khata.allEntries },
          { key: 'CREDIT_GIVEN', label: t.khata.udharGiven },
          { key: 'PAYMENT_RECEIVED', label: t.khata.paymentReceived },
          { key: 'VOIDED', label: t.khata.voidedEntries },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions Feed Card */}
      <Card className="p-2 sm:p-4">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t.khata.noTransactions}
            description={t.khata.noTransactionsSub}
            actionLabel={t.dashboard.addUdhar}
            onAction={() => setIsTxnModalOpen(true)}
            actionIcon={<Plus className="w-4 h-4" />}
          />
        ) : (
          <TransactionFeed
            transactions={filtered}
            onReverse={(txn) => setReversalTxn(txn)}
            showCustomerName={true}
          />
        )}
      </Card>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        onSuccess={() => fetchTransactions()}
      />

      <ReversalModal
        isOpen={!!reversalTxn}
        onClose={() => setReversalTxn(null)}
        onSuccess={() => fetchTransactions()}
        transaction={
          reversalTxn
            ? {
                id: reversalTxn.id,
                amount: reversalTxn.amount,
                transactionType: reversalTxn.transactionType,
                customerName: reversalTxn.customer?.name,
              }
            : null
        }
      />
    </FadeIn>
  );
}
