'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Phone,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TransactionModal } from '@/components/khata/TransactionModal';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { useLanguage } from '@/lib/i18n/context';
import { NumberCounter, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { apiFetch } from '@/lib/api-client';

export default function DashboardPage() {
  const { t, formatCurrency } = useLanguage();
  const [data, setData] = useState<{
    summary: {
      totalReceivable: number;
      totalPayable: number;
      netBalance: number;
      totalCustomers: number;
      todayCreditGiven: number;
      todayPaymentReceived: number;
    };
    recentTransactions: any[];
    topDefaulters: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    apiFetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <FadeIn className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t.dashboard.overviewTitle}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950 dark:text-vyapar-300 border border-vyapar-200 dark:border-vyapar-800">
              {t.brand.coreLedger}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.dashboard.overviewSub}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustModalOpen(true)}
            leftIcon={<Users className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            {t.dashboard.newCustomer}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTxnModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="font-bold text-xs shadow-md shadow-vyapar-500/20"
          >
            {t.dashboard.addUdhar}
          </Button>
        </div>
      </div>

      {/* KPI Financial Stat Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Receivables (Lena Hai) */}
          <StaggerItem>
            <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.financial.receivables}
                </span>
                <Badge variant="lena" size="sm">
                  {t.financial.lenaHai}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
                  <NumberCounter value={data?.summary?.totalReceivable || 0} />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +8.4%
                </span>
                <span>{t.financial.receivablesSub}</span>
              </div>
            </Card>
          </StaggerItem>

          {/* Card 2: Total Payables (Dena Hai) */}
          <StaggerItem>
            <Card className="p-5 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.financial.payables}
                </span>
                <Badge variant="dena" size="sm">
                  {t.financial.denaHai}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
                  <NumberCounter value={data?.summary?.totalPayable || 0} />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{t.financial.payablesSub}</span>
              </div>
            </Card>
          </StaggerItem>

          {/* Card 3: Today's Collection (Jama / Rokad) */}
          <StaggerItem>
            <Card className="p-5 border-l-4 border-l-vyapar-600 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.financial.todaysCollections}
                </span>
                <div className="w-6 h-6 rounded-lg bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
                  <NumberCounter value={data?.summary?.todayPaymentReceived || 0} />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{t.financial.todaysCollectionsSub}</span>
              </div>
            </Card>
          </StaggerItem>

          {/* Card 4: Active Khata Accounts */}
          <StaggerItem>
            <Card className="p-5 border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.customers.title}
                </span>
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 font-mono font-black">
                  {data?.summary?.totalCustomers || 0}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{t.customers.subtitle}</span>
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Two Column Grid: Top Dues & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Outstanding Customer Khata Spotlight */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.customers.filterDue}
            </h2>
            <Link
              href="/dashboard/customers"
              className="text-xs font-bold text-vyapar-600 dark:text-vyapar-400 hover:underline flex items-center gap-1"
            >
              <span>{t.dashboard.customerDirectoryCard}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="overflow-hidden">
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : !data?.topDefaulters || data.topDefaulters.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-slate-400">{t.customers.noCustomers}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.topDefaulters.map((cust) => {
                  const whatsappMsg = encodeURIComponent(
                    t.customerProfile.reminderDueMsg
                      .replace('{name}', cust.name)
                      .replace('{amount}', cust.outstandingBalance.toString())
                  );
                  return (
                    <div
                      key={cust.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/customers/${cust.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-vyapar-600 truncate block"
                          >
                            {cust.name}
                          </Link>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{cust.phoneNumber}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 block font-mono">
                            {formatCurrency(cust.outstandingBalance)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {t.financial.due}
                          </span>
                        </div>

                        <a
                          href={`https://wa.me/91${cust.phoneNumber.replace(/\D/g, '')}?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title={t.customers.whatsAppReminder}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">{t.customers.whatsAppReminder}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Recent Real-Time Ledger Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.dashboard.recentTxnsTitle}
            </h2>
            <Link
              href="/dashboard/khata"
              className="text-xs font-bold text-vyapar-600 dark:text-vyapar-400 hover:underline"
            >
              {t.dashboard.viewAllKhata}
            </Link>
          </div>

          <Card className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {t.khata.noTransactions}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentTransactions.slice(0, 5).map((txn) => {
                  const isCredit = txn.transactionType === 'CREDIT_GIVEN';
                  return (
                    <div key={txn.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {txn.customer?.name || 'Customer'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isCredit ? t.financial.udharDiya : t.financial.jamaMila}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Embedded Modals */}
      <TransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        onSuccess={() => loadData()}
      />

      <AddCustomerModal
        isOpen={isCustModalOpen}
        onClose={() => setIsCustModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </FadeIn>
  );
}
