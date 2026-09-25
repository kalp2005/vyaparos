'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { useLanguage } from '@/lib/i18n/context';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-6 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Logo size="md" glow={true} />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitch variant="compact" />
          <Link href="/login">
            <Button variant="outline" size="sm">
              {t.landing.navSignIn}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              {t.landing.navGetStarted}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.landing.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-[1.15]">
          {t.landing.heroTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-vyapar-500 to-indigo-600">{t.landing.heroTitle2}</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t.landing.heroDesc}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/login">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />} className="shadow-lg shadow-vyapar-500/25">
              {t.landing.ctaOpenKhata}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              {t.landing.ctaExploreDashboard}
            </Button>
          </Link>
        </div>

        {/* Core Value Pillars Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.landing.feature1Title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.landing.feature1Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.landing.feature2Title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.landing.feature2Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.landing.feature3Title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.landing.feature3Desc}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>{t.landing.footerCopyright}</p>
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Link href="/sitemap" className="hover:text-vyapar-600 transition-colors">
            Website Map & Directory
          </Link>
          <span>•</span>
          <Link href="/dashboard/billing/pos" className="hover:text-vyapar-600 transition-colors">
            POS Counter
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-vyapar-600 transition-colors">
            Merchant Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
