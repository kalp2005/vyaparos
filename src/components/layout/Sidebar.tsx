'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  History,
  Settings,
  Sparkles,
  CreditCard,
  Package,
  Search,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { Logo } from '@/components/ui/Logo';
import { BusinessSwitcher } from '@/components/ui/BusinessSwitcher';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      name: t.nav.dashboard,
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: t.nav.billing,
      href: '/dashboard/billing',
      icon: CreditCard,
      active: pathname.startsWith('/dashboard/billing'),
    },
    {
      name: t.nav.inventory,
      href: '/dashboard/products',
      icon: Package,
      active: pathname.startsWith('/dashboard/products'),
    },
    {
      name: t.nav.customers,
      href: '/dashboard/customers',
      icon: Users,
      active: pathname.startsWith('/dashboard/customers'),
    },
    {
      name: t.nav.khata,
      href: '/dashboard/khata',
      icon: BookOpen,
      active: pathname === '/dashboard/khata',
    },
    {
      name: t.nav.activity,
      href: '/dashboard/activity',
      icon: History,
      active: pathname === '/dashboard/activity',
    },
    {
      name: t.nav.settings,
      href: '/dashboard/settings',
      icon: Settings,
      active: pathname === '/dashboard/settings',
    },
  ];

  const futureModules = [
    { name: t.nav.aiAssistant, icon: Sparkles, phase: 'Phase 7' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 min-h-screen select-none backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="md" glow={true} />
        </Link>
      </div>

      {/* Business Switcher Dropdown */}
      <div className="p-3">
        <BusinessSwitcher />
      </div>

      {/* Quick Search / Command Palette Shortcut */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t.common.search}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400">
            {t.common.searchShortcut}
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t.common.coreOperations}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                item.active
                  ? 'text-vyapar-700 dark:text-vyapar-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {item.active && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-vyapar-50 dark:bg-vyapar-950/80 rounded-xl border border-vyapar-200/60 dark:border-vyapar-800/60"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    item.active ? 'text-vyapar-600 dark:text-vyapar-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}

        {/* Future Modules */}
        {futureModules.length > 0 && (
          <>
            <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.common.upcoming}
            </div>
            {futureModules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 cursor-not-allowed opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {item.phase}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </nav>

      {/* Language Switcher in Sidebar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          {t.settings.languagePreference}
        </div>
        <LanguageSwitch variant="pills" />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-medium">VyaparOS</span>
        <span className="font-mono text-[10px] text-emerald-600 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t.nav.online}
        </span>
      </div>
    </aside>
  );
}
