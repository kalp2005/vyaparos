'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Building2, MapPin, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { useLanguage } from '@/lib/i18n/context';

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Business / Shop name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          legalName: legalName.trim() || undefined,
          businessType,
          gstin: gstin.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          stateName,
          pincode: pincode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to setup business');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950 relative">
      {/* Top Right Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitch variant="compact" />
      </div>

      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center mb-2">
            <Logo size="lg" glow={true} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.onboarding.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.onboarding.subtitle}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.onboarding.businessNameLabel}
              placeholder="e.g. Ramesh Kirana & General Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Store className="w-4 h-4" />}
              autoFocus
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.onboarding.businessTypeLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'retail', label: t.onboarding.retail },
                  { key: 'wholesale', label: t.onboarding.wholesale },
                  { key: 'distributor', label: t.onboarding.distributor },
                  { key: 'services', label: t.onboarding.services },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setBusinessType(item.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      businessType === item.key
                        ? 'border-vyapar-600 bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950/70 dark:text-vyapar-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t.onboarding.cityLabel}
                placeholder="e.g. Mumbai, Lucknow, Pune"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />

              <Input
                label={t.onboarding.gstinLabel}
                placeholder="27AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <Input
              label={t.onboarding.addressLabel}
              placeholder="e.g. Shop #12, Market Complex"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>{t.onboarding.defaultCurrency} <strong>Indian Rupee (INR ₹)</strong></span>
              <span className="font-semibold text-emerald-600">{t.onboarding.freePlanActive}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold mt-2 shadow-md shadow-vyapar-500/20 cursor-pointer"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t.onboarding.saveAndLaunchBtn}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
