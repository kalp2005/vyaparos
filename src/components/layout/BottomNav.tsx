'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Settings, Plus } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface BottomNavProps {
  onQuickAdd?: () => void;
}

export function BottomNav({ onQuickAdd }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    {
      name: t.nav.dashboard,
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: t.nav.khata,
      href: '/dashboard/khata',
      icon: BookOpen,
      active: pathname === '/dashboard/khata',
    },
  ];

  const rightItems = [
    {
      name: t.nav.customers,
      href: '/dashboard/customers',
      icon: Users,
      active: pathname.startsWith('/dashboard/customers'),
    },
    {
      name: t.nav.settings,
      href: '/dashboard/settings',
      icon: Settings,
      active: pathname === '/dashboard/settings',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 lg:hidden backdrop-blur-md">
      <div className="flex items-center justify-around relative">
        {/* Left Nav items */}
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                item.active
                  ? 'text-vyapar-600 dark:text-vyapar-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* Central Floating Quick Add Action */}
        <div className="-mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={onQuickAdd}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-vyapar-700 to-vyapar-500 text-white shadow-lg shadow-vyapar-600/30 flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
            title="Record Transaction"
          >
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
            + Entry
          </span>
        </div>

        {/* Right Nav items */}
        {rightItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                item.active
                  ? 'text-vyapar-600 dark:text-vyapar-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
