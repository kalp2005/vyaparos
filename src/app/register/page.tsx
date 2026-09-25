'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, Store, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/lib/i18n/context';
import { GlobalRole } from '@/lib/types/permissions';

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<GlobalRole>('SHOPKEEPER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please provide valid email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUpWithEmail(email, password, fullName, selectedRole);
      if (selectedRole === 'SHOPKEEPER') {
        router.push('/onboarding');
      } else if (selectedRole === 'SHOPPER') {
        router.push('/shopper/home');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo size="lg" glow={true} />
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.auth.registerTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.auth.registerSub}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Account Type / Role Selection */}
          <div className="space-y-1.5 mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t.auth.selectRoleLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('SHOPKEEPER')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'SHOPKEEPER'
                    ? 'border-vyapar-600 bg-vyapar-50 text-vyapar-900 dark:bg-vyapar-950/80 dark:text-vyapar-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Store className="w-4 h-4 text-vyapar-600" />
                  <span>{t.auth.shopkeeperRole}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{t.auth.shopkeeperDesc}</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('SHOPPER')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'SHOPPER'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span>{t.auth.shopperRole}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{t.auth.shopperDesc}</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.fullNameLabel}
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label={t.auth.emailLabel}
              type="email"
              placeholder="merchant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label={t.auth.passwordLabel}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold mt-2 shadow-md shadow-vyapar-500/20 cursor-pointer"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t.auth.createAccountBtn}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            {t.auth.haveAccount}{' '}
            <Link href="/login" className="font-bold text-vyapar-600 dark:text-vyapar-400 hover:underline">
              {t.auth.logInLink}
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.auth.securedWith}</span>
        </div>
      </div>
    </div>
  );
}
