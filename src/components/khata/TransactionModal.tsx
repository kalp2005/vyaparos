'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { useToast } from '@/context/ToastContext';

interface CustomerOption {
  id: string;
  name: string;
  phoneNumber: string;
  outstandingBalance: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  preselectedCustomerId?: string;
  preselectedCustomerName?: string;
  defaultType?: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
  preselectedCustomerName,
  defaultType = 'CREDIT_GIVEN',
}: TransactionModalProps) {
  const { t, formatCurrency } = useLanguage();
  const toast = useToast();

  const [transactionType, setTransactionType] = useState<'CREDIT_GIVEN' | 'PAYMENT_RECEIVED'>(defaultType);
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [description, setDescription] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const amountChips = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    if (isOpen) {
      setTransactionType(defaultType);
      setCustomerId(preselectedCustomerId || '');
      setAmount('');
      setDescription('');
      setPaymentReference('');
      setPaymentMode('CASH');
      setError(null);
      setSuccessResult(null);

      if (!preselectedCustomerId) {
        fetch('/api/customers')
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.customers) {
              setCustomers(data.customers);
              if (data.customers.length > 0 && !customerId) {
                setCustomerId(data.customers[0].id);
              }
            }
          })
          .catch((err) => console.error('Failed to load customers:', err));
      }
    }
  }, [isOpen, preselectedCustomerId, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          transactionType,
          amount: numAmount,
          paymentMode,
          paymentReference: paymentReference || undefined,
          description: description || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      setSuccessResult(data);
      const isCredit = transactionType === 'CREDIT_GIVEN';
      toast.success(
        `${isCredit ? t.financial.udhar : t.financial.jama} of ₹${numAmount} saved`,
        'Transaction Recorded'
      );
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Error recording transaction');
      toast.error(err.message || 'Transaction could not be recorded');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    setSuccessResult(null);
    onClose();
  };

  const isCredit = transactionType === 'CREDIT_GIVEN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCredit ? t.modals.recordCreditTitle : t.modals.recordPaymentTitle}
      subtitle={t.modals.recordTxnSub}
      maxWidth="md"
    >
      {successResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {isCredit ? t.financial.udharDiya : t.financial.jamaMila}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ₹{successResult.transaction?.amount} — <strong>{preselectedCustomerName || 'Customer'}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 max-w-xs mx-auto text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">{t.financial.currentBalance}</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
              ₹{successResult.newBalance}
            </span>
          </div>

          <Button variant="primary" size="md" onClick={handleDone} className="w-full font-bold">
            {t.modals.doneBtn}
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Transaction Type Segmented Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTransactionType('CREDIT_GIVEN')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isCredit
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.financial.udharDiya}</span>
            </button>

            <button
              type="button"
              onClick={() => setTransactionType('PAYMENT_RECEIVED')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                !isCredit
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t.financial.jamaMila}</span>
            </button>
          </div>

          {/* Customer Selection */}
          {preselectedCustomerName ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {preselectedCustomerName}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Verified Customer</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.modals.selectCustomer}
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500"
                required
              >
                <option value="" disabled>
                  {t.modals.chooseCustomerOption}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phoneNumber}) — {t.financial.due}: ₹{c.outstandingBalance}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Input
              label={t.modals.txnAmount}
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              leftIcon={<span className="font-bold font-mono text-base">₹</span>}
              className="text-xl font-bold font-mono"
              autoFocus
              required
            />

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1 font-medium">{t.modals.quickAdd}</span>
              {amountChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAmount(chip.toString())}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  +₹{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'CASH', label: t.modals.cash },
              { key: 'UPI', label: t.modals.upi },
              { key: 'BANK_TRANSFER', label: t.modals.bankTransfer },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setPaymentMode(mode.key)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMode === mode.key
                    ? 'border-vyapar-600 bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950 dark:text-vyapar-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Optional Note */}
          <Input
            label={t.modals.notesDetails}
            placeholder="Notes or item details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              {t.modals.cancel}
            </Button>
            <Button
              type="submit"
              variant={isCredit ? 'danger' : 'success'}
              size="md"
              isLoading={isLoading}
              className="font-bold px-6"
            >
              {isCredit ? t.modals.saveUdharBtn : t.modals.saveJamaBtn}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
