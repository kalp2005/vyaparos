'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { FadeIn } from '@/components/ui/motion';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) {
      setError(`Please enter your ${authMode === 'phone' ? 'mobile number' : 'email address'}`);
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
    }, 500);
  };

  const handleVerifyLogin = async (e?: React.FormEvent, directUid?: string, directName?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const uid = directUid || (authMode === 'phone' ? `phone_${phoneOrEmail.replace(/\D/g, '')}` : `email_${phoneOrEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
    const name = directName || fullName || 'Ramesh Kumar';
    const email = authMode === 'email' ? phoneOrEmail : undefined;
    const phone = authMode === 'phone' ? phoneOrEmail : undefined;
    const idToken = `dev-token-${uid}`;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          fullName: name,
          email,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.memberships && data.memberships.length > 0) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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

      <FadeIn className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo size="lg" glow={true} />
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.auth.signInTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.auth.signInSub}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('phone');
                setIsOtpSent(false);
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'phone'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t.auth.mobileOtpTab}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setIsOtpSent(false);
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'email'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t.auth.emailTab}</span>
            </button>
          </div>

          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label={t.auth.fullNameLabel}
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              {authMode === 'phone' ? (
                <Input
                  label={t.auth.mobileNumberLabel}
                  type="tel"
                  placeholder="9876543210"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  helperText={t.auth.mobileHelper}
                  required
                />
              ) : (
                <Input
                  label={t.auth.emailLabel}
                  type="email"
                  placeholder="merchant@example.com"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold mt-2 shadow-md shadow-vyapar-500/20 cursor-pointer"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t.auth.sendOtpBtn}
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => handleVerifyLogin(e)} className="space-y-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-500">{t.auth.otpSentTo}</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{phoneOrEmail}</p>
              </div>

              <Input
                label={t.auth.enterOtpLabel}
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center text-xl font-mono tracking-widest"
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold mt-2 shadow-md shadow-vyapar-500/20 cursor-pointer"
                isLoading={isLoading}
              >
                {t.auth.verifyBtn}
              </Button>

              <button
                type="button"
                onClick={() => setIsOtpSent(false)}
                className="w-full text-center text-xs font-semibold text-vyapar-600 dark:text-vyapar-400 hover:underline pt-2 cursor-pointer"
              >
                {t.auth.changePhoneEmail}
              </button>
            </form>
          )}

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t.auth.demoSignIn}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleVerifyLogin(undefined, 'demo_kirana_owner', 'Ramesh Kumar (Kirana)')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Ramesh Kumar</p>
                <p className="text-[10px] text-slate-500">{t.auth.kiranaOwner}</p>
              </button>

              <button
                type="button"
                onClick={() => handleVerifyLogin(undefined, 'demo_wholesale_owner', 'Priya Deshmukh (Wholesale)')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Priya Deshmukh</p>
                <p className="text-[10px] text-slate-500">{t.auth.fmcgWholesaler}</p>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            {t.auth.noAccount}{' '}
            <Link href="/register" className="font-bold text-vyapar-600 dark:text-vyapar-400 hover:underline">
              {t.auth.createAccountLink}
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.auth.securedWith}</span>
        </div>
      </FadeIn>
    </div>
  );
}
