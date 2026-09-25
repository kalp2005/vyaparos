'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 text-center">
        <Link href="/" className="inline-flex items-center justify-center">
          <Logo size="lg" glow={true} />
        </Link>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Verify Your Identity
          </h2>

          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Please verify your email address or enter the OTP sent to your registered mobile number to proceed.
          </p>

          <Link href="/login" className="block pt-2">
            <Button variant="primary" size="lg" className="w-full font-bold">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
