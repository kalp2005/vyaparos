'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { useLanguage } from '@/lib/i18n/context';
import { FadeIn } from '@/components/ui/motion';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface CustomerItem {
  id: string;
  name: string;
  phoneNumber: string;
  outstandingBalance: number;
  creditLimit: number;
  paymentReliabilityScore: number;
}

export default function CustomersPage() {
  const { t, formatCurrency } = useLanguage();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DUE' | 'SETTLED' | 'ADVANCE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchCustomers = () => {
    setIsLoading(true);
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customers) {
          setCustomers(data.customers);
        }
      })
      .catch((err) => console.error('Customers fetch error:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtering
  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search);

    if (!matchesSearch) return false;

    if (filter === 'DUE') return c.outstandingBalance > 0;
    if (filter === 'SETTLED') return c.outstandingBalance === 0;
    if (filter === 'ADVANCE') return c.outstandingBalance < 0;
    return true;
  });

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.customers.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.customers.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold text-xs shadow-md shadow-vyapar-500/20"
        >
          {t.customers.addCustomerBtn}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.customers.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: t.customers.filterAll },
            { key: 'DUE', label: t.customers.filterDue },
            { key: 'SETTLED', label: t.customers.filterSettled },
            { key: 'ADVANCE', label: t.customers.filterAdvance },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === f.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table & Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t.customers.noCustomers}
            description={t.customers.noCustomersSub}
            actionLabel={t.customers.addCustomerBtn}
            onAction={() => setIsAddModalOpen(true)}
            actionIcon={<Plus className="w-4 h-4" />}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((customer) => {
              const isDue = customer.outstandingBalance > 0;
              const isAdvance = customer.outstandingBalance < 0;
              const whatsappMsg = encodeURIComponent(
                t.customerProfile.reminderDueMsg
                  .replace('{name}', customer.name)
                  .replace('{amount}', customer.outstandingBalance.toString())
              );

              return (
                <div
                  key={customer.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Left: Customer Profile Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDue
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                          : isAdvance
                          ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-vyapar-600 dark:hover:text-vyapar-400 truncate block"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phoneNumber}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Balance & WhatsApp Tagada */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <span
                        className={`text-base sm:text-lg font-black block font-mono ${
                          isDue
                            ? 'text-rose-600 dark:text-rose-400'
                            : isAdvance
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(Math.abs(customer.outstandingBalance))}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isDue
                          ? t.financial.lenaHai
                          : isAdvance
                          ? t.financial.advance
                          : t.financial.settled}
                      </span>
                    </div>

                    {isDue && (
                      <a
                        href={`https://wa.me/91${customer.phoneNumber.replace(/\D/g, '')}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
                        title={t.customers.whatsAppReminder}
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}

                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />
    </FadeIn>
  );
}
