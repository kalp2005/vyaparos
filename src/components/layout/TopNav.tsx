'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Wifi, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { LanguageSwitch } from '../ui/LanguageSwitch';
import { Logo } from '../ui/Logo';
import { useLanguage } from '@/lib/i18n/context';

interface TopNavProps {
  userName?: string;
  businessName?: string;
  onOpenCommandPalette?: () => void;
}

export function TopNav({
  userName = 'Shopkeeper',
  businessName = 'My Store',
  onOpenCommandPalette,
}: TopNavProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile Brand Indicator */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Desktop Search / Quick Action Input Bar */}
      <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{t.common.searchPlaceholder}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 shadow-2xs">
            {t.common.searchShortcut}
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline / Online Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.nav.online}</span>
        </div>

        {/* Multilingual Language Switcher */}
        <LanguageSwitch variant="compact" />

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-700 dark:text-vyapar-300 border border-vyapar-200 dark:border-vyapar-800 flex items-center justify-center text-xs font-black">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {userName}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 cursor-pointer"
            title={t.nav.logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
