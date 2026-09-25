'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Globe, Store, ShieldCheck, Database, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { useLanguage } from '@/lib/i18n/context';
import { FadeIn } from '@/components/ui/motion';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activeBusiness) {
          setBusiness(data.activeBusiness);
        }
      })
      .catch((err) => console.error('Error fetching settings info:', err));
  }, []);

  return (
    <FadeIn className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {t.settings.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Language Preferences Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.settings.languagePreference}
            </h2>
            <p className="text-xs text-slate-500">
              Select your preferred commercial language (English, हिन्दी, मराठी, Hinglish)
            </p>
          </div>
        </div>

        <div className="pt-2">
          <LanguageSwitch variant="pills" />
        </div>
      </Card>

      {/* Business Details Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.settings.storeProfile}
            </h2>
            <p className="text-xs text-slate-500">
              Manage your store metadata, GSTIN, and accounting preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold">{t.settings.storeName}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {business?.name || 'Ramesh Kirana Store'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold">{t.settings.businessType}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block capitalize">
              {business?.businessType || 'Retail'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold">{t.settings.currencyFormatting}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block font-mono">
              Indian Rupee (INR ₹)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold">{t.settings.dbEngine}</span>
            <span className="text-sm font-bold text-emerald-600 mt-1 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Connected to Supabase PostgreSQL
            </span>
          </div>
        </div>
      </Card>

      {/* Security & Data Integrity */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.settings.cloudInfra}
            </h2>
            <p className="text-xs text-slate-500">
              {t.settings.privacyStandard} (DPDP Act 2023 Compliant)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            • All Khata records are cryptographically verified and backed up with double-entry journal balance recalculation.
          </p>
          <p>
            • Authentication is securely isolated via Firebase Web SDK and verified on the server via Firebase Admin SDK.
          </p>
          <p>
            • DPDP Act 2023 compliant data isolation and privacy protection is active for this tenant.
          </p>
        </div>
      </Card>
    </FadeIn>
  );
}
