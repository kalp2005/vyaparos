'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Users,
  BookOpen,
  History,
  Settings,
  PlusCircle,
  CreditCard,
  Package,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransaction?: () => void;
  onOpenCustomer?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenTransaction,
  onOpenCustomer,
}: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items = [
    {
      group: 'Quick Actions',
      id: 'action-add-transaction',
      title: t.dashboard.addUdhar,
      subtitle: t.modals.recordTxnSub,
      icon: PlusCircle,
      action: () => {
        onClose();
        if (onOpenTransaction) onOpenTransaction();
      },
    },
    {
      group: 'Quick Actions',
      id: 'action-add-customer',
      title: t.customers.addCustomerBtn,
      subtitle: t.modals.addCustomerSub,
      icon: Users,
      action: () => {
        onClose();
        if (onOpenCustomer) onOpenCustomer();
      },
    },
    {
      group: 'Navigation',
      id: 'nav-dashboard',
      title: t.nav.dashboard,
      subtitle: t.dashboard.overviewTitle,
      icon: LayoutDashboard,
      action: () => {
        onClose();
        router.push('/dashboard');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-pos',
      title: 'POS Counter (High Speed)',
      subtitle: 'Fast billing, barcode scanner, receipt printing',
      icon: CreditCard,
      action: () => {
        onClose();
        router.push('/dashboard/billing/pos');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-billing',
      title: t.nav.billing,
      subtitle: 'GST invoices, bill register, tax summaries',
      icon: CreditCard,
      action: () => {
        onClose();
        router.push('/dashboard/billing');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-products',
      title: t.nav.inventory,
      subtitle: 'Catalog, barcodes, stock levels & prices',
      icon: Package,
      action: () => {
        onClose();
        router.push('/dashboard/products');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-customers',
      title: t.nav.customers,
      subtitle: t.customers.title,
      icon: Users,
      action: () => {
        onClose();
        router.push('/dashboard/customers');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-khata',
      title: t.nav.khata,
      subtitle: t.khata.title,
      icon: BookOpen,
      action: () => {
        onClose();
        router.push('/dashboard/khata');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-activity',
      title: t.nav.activity,
      subtitle: t.activity.title,
      icon: History,
      action: () => {
        onClose();
        router.push('/dashboard/activity');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-settings',
      title: t.nav.settings,
      subtitle: t.settings.title,
      icon: Settings,
      action: () => {
        onClose();
        router.push('/dashboard/settings');
      },
    },
    {
      group: 'Navigation',
      id: 'nav-sitemap',
      title: 'Website Map & Architecture',
      subtitle: 'Complete directory of all pages, roles, and APIs',
      icon: Search,
      action: () => {
        onClose();
        router.push('/sitemap');
      },
    },
  ];

  const filteredItems = items.filter((item) =>
    `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t.common.searchPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
              />
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t.customers.noCustomers}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-vyapar-50 dark:bg-vyapar-950/80 text-vyapar-900 dark:text-vyapar-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-vyapar-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{item.title}</p>
                            <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {isSelected ? '↵' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  ↑↓
                </span>{' '}
                {t.common.actions}
              </span>
              <span>VyaparOS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
