'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface ReversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  transaction: {
    id: string;
    amount: number;
    transactionType: string;
    customerName?: string;
  } | null;
}

export function ReversalModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: ReversalModalProps) {
  const { t, formatCurrency } = useLanguage();
  const [voidReason, setVoidReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const isCredit = transaction.transactionType === 'CREDIT_GIVEN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setError('Please provide a mandatory reason for reversing this transaction.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voidReason: voidReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reverse transaction');
      }

      setVoidReason('');
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error reversing transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const noticeText = t.modals.reversalNoticeDesc
    .replace('{amount}', transaction.amount.toString())
    .replace('{type}', isCredit ? t.financial.udhar : t.financial.jama)
    .replace('{customer}', transaction.customerName || 'Customer');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.reverseTitle}
      subtitle={t.modals.reverseSub}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t.modals.reversalNotice}</span>
          </div>
          <p>{noticeText}</p>
        </div>

        <Input
          label={t.modals.voidReasonLabel}
          placeholder={t.modals.voidReasonPlaceholder}
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          required
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {t.modals.cancel}
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            isLoading={isLoading}
            className="font-bold"
          >
            {t.modals.confirmReversalBtn}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
