'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, ArrowRight, ShieldCheck, LogOut, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';

export default function ShopperHomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Shopper Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <Badge variant="advance" size="sm">
            SHOPPER ACCOUNT
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Shopper: {user?.fullName || 'Customer'}</span>
          <Button variant="outline" size="sm" onClick={signOut} className="text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Digital Khata & Purchases
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View your verified transaction balances with local stores
          </p>
        </div>

        {/* Linked Stores Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 border-l-4 border-l-vyapar-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Total Pending Dues</span>
              <Badge variant="dena" size="sm">Dena Hai</Badge>
            </div>
            <div className="text-3xl font-black text-rose-600">₹3,500.00</div>
            <p className="text-xs text-slate-500">Across 1 connected local merchant</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Advance Deposits</span>
              <Badge variant="lena" size="sm">Advance</Badge>
            </div>
            <div className="text-3xl font-black text-emerald-600">₹0.00</div>
            <p className="text-xs text-slate-500">All payments up to date</p>
          </Card>
        </div>

        {/* Linked Merchant Accounts */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold">Connected Merchant Stores</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Ramesh Kirana & General Store</h3>
                  <p className="text-xs text-slate-400">Shop #4, Market Road • Phone: 9876543210</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-rose-600 block">₹3,500.00</span>
                <span className="text-[10px] text-slate-400">Pending Balance</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Verification Notice */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All transaction records are cryptographically verified by VyaparOS and double-entry authenticated.</span>
        </div>
      </main>
    </div>
  );
}
