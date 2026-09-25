'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export interface TransactionItem {
  id: string;
  transactionType: string;
  amount: number;
  paymentMode: string;
  paymentReference?: string | null;
  transactionDate: string;
  description?: string | null;
  isVoided: boolean;
  voidReason?: string | null;
  customer?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
  creator?: {
    fullName: string;
  } | null;
}

interface TransactionFeedProps {
  transactions: TransactionItem[];
  onReverse?: (transaction: TransactionItem) => void;
  showCustomerName?: boolean;
}

export function TransactionFeed({
  transactions,
  onReverse,
  showCustomerName = true,
}: TransactionFeedProps) {
  const { t, formatCurrency } = useLanguage();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t.khata.noTransactions}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {t.khata.noTransactionsSub}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {transactions.map((txn) => {
        const isCredit = txn.transactionType === 'CREDIT_GIVEN';
        const formattedDate = new Date(txn.transactionDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={txn.id}
            className={`py-3.5 px-2 sm:px-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl transition-all ${
              txn.isVoided ? 'opacity-55' : ''
            }`}
          >
            {/* Left Info */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  txn.isVoided
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : isCredit
                    ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isCredit ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {showCustomerName && txn.customer && (
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {txn.customer.name}
                    </span>
                  )}
                  <Badge variant={txn.isVoided ? 'void' : isCredit ? 'dena' : 'lena'} size="sm">
                    {txn.isVoided
                      ? t.financial.reversedVoid
                      : isCredit
                      ? t.financial.udharDiya
                      : t.financial.jamaMila}
                  </Badge>
                  {txn.paymentMode && (
                    <span className="text-[11px] font-mono text-slate-400">
                      via {txn.paymentMode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span>{formattedDate}</span>
                  {txn.description && <span>• {txn.description}</span>}
                  {txn.creator && <span>• by {txn.creator.fullName}</span>}
                </div>

                {txn.isVoided && txn.voidReason && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
                    Void Reason: {txn.voidReason}
                  </p>
                )}
              </div>
            </div>

            {/* Right Amount & Actions */}
            <div className="flex items-center gap-3 shrink-0 text-right">
              <div>
                <span
                  className={`text-base sm:text-lg font-black tracking-tight ${
                    txn.isVoided
                      ? 'text-slate-400 line-through'
                      : isCredit
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>

              {!txn.isVoided && onReverse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReverse(txn)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5"
                  title="Reverse this transaction"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
