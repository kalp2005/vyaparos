'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Map,
  Compass,
  ArrowRight,
  Search,
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  BookOpen,
  History,
  Settings,
  ShoppingBag,
  ShieldAlert,
  LogIn,
  UserPlus,
  Store,
  KeyRound,
  ExternalLink,
  Code2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

interface SiteRoute {
  path: string;
  title: string;
  category: 'Public & Auth' | 'Merchant Core' | 'Billing & POS' | 'Inventory' | 'Customer Portal' | 'Administration' | 'API Endpoints';
  description: string;
  icon: any;
  roles: string[];
  phase: string;
  isApi?: boolean;
}

const SITE_ROUTES: SiteRoute[] = [
  // Public & Auth
  {
    path: '/',
    title: 'Landing Page & Platform Showcase',
    category: 'Public & Auth',
    description: 'Public marketing website showcasing VyaparOS features, value pillars, and instant demo access.',
    icon: Sparkles,
    roles: ['Public'],
    phase: 'Phase 1',
  },
  {
    path: '/login',
    title: 'Secure Authentication & Sign-In',
    category: 'Public & Auth',
    description: 'Firebase Authentication with Indian +91 Mobile OTP verification, email sign-in, and instant demo profiles.',
    icon: LogIn,
    roles: ['Public'],
    phase: 'Phase 1',
  },
  {
    path: '/register',
    title: 'Merchant & Shopper Registration',
    category: 'Public & Auth',
    description: 'Account creation with global role assignment (Shopkeeper merchant vs Shopper customer).',
    icon: UserPlus,
    roles: ['Public'],
    phase: 'Phase 1',
  },
  {
    path: '/onboarding',
    title: 'Business Setup & Store Wizard',
    category: 'Public & Auth',
    description: 'First-time merchant store initialization: Business Name, Type, GSTIN, Address, and currency configuration.',
    icon: Store,
    roles: ['Shopkeeper'],
    phase: 'Phase 1',
  },
  {
    path: '/forgot-password',
    title: 'Password & Credential Recovery',
    category: 'Public & Auth',
    description: 'Firebase Auth email password reset and credential self-service.',
    icon: KeyRound,
    roles: ['Public'],
    phase: 'Phase 1',
  },

  // Merchant Core & Ledger
  {
    path: '/dashboard',
    title: 'Merchant Dashboard & Pulse',
    category: 'Merchant Core',
    description: 'Real-time financial pulse: Net cash in hand, receivables (Lena Hai), payables (Dena Hai), and quick actions.',
    icon: LayoutDashboard,
    roles: ['Owner', 'Manager', 'Cashier', 'Accountant'],
    phase: 'Phase 1',
  },
  {
    path: '/dashboard/customers',
    title: 'Customer Directory & Credit Master',
    category: 'Merchant Core',
    description: 'Party management, pending dues filter, credit limit settings, and automated WhatsApp payment reminders.',
    icon: Users,
    roles: ['Owner', 'Manager', 'Cashier', 'Salesperson'],
    phase: 'Phase 1',
  },
  {
    path: '/dashboard/customers/[id]',
    title: 'Customer 360° Khata Statement',
    category: 'Merchant Core',
    description: 'Detailed chronological customer statement with running balance, payment reliability index, and WhatsApp tagada.',
    icon: Users,
    roles: ['Owner', 'Manager', 'Cashier', 'Accountant'],
    phase: 'Phase 1',
  },
  {
    path: '/dashboard/khata',
    title: 'Unified Double-Entry Ledger',
    category: 'Merchant Core',
    description: 'Full chronological transaction feed with balanced debits & credits, non-destructive reversals, and audit trail.',
    icon: BookOpen,
    roles: ['Owner', 'Manager', 'Accountant'],
    phase: 'Phase 1',
  },
  {
    path: '/dashboard/activity',
    title: 'Immutable Security & Audit Trail',
    category: 'Merchant Core',
    description: 'DPDP-compliant immutable system log recording actor, IP, timestamp, old state, and new state for all operations.',
    icon: History,
    roles: ['Owner', 'Manager'],
    phase: 'Phase 1',
  },
  {
    path: '/dashboard/settings',
    title: 'Business & Store Settings',
    category: 'Merchant Core',
    description: 'Store metadata, UPI VPA payment link configuration, bank accounts, and commercial language switch.',
    icon: Settings,
    roles: ['Owner', 'Manager'],
    phase: 'Phase 1',
  },

  // Billing & POS (Phase 2)
  {
    path: '/dashboard/billing/pos',
    title: 'High-Speed Counter POS Billing',
    category: 'Billing & POS',
    description: 'Sub-second counter checkout with barcode scanner support, keyboard shortcuts (F2/F4/F8), split payments, and instant receipt printing.',
    icon: CreditCard,
    roles: ['Owner', 'Manager', 'Cashier', 'Salesperson'],
    phase: 'Phase 2',
  },
  {
    path: '/dashboard/billing',
    title: 'GST Invoices Register & Feed',
    category: 'Billing & POS',
    description: 'Master billing register with status filters (Paid, Part Paid, Udhar, Cancelled), GST tax summary, and PDF/Thermal print generator.',
    icon: CreditCard,
    roles: ['Owner', 'Manager', 'Cashier', 'Accountant'],
    phase: 'Phase 2',
  },

  // Inventory (Phase 2 & Phase 3)
  {
    path: '/dashboard/products',
    title: 'Product Catalog & Stock Management',
    category: 'Inventory',
    description: 'Product SKUs, barcodes, selling/purchase prices, tax-inclusive toggle, GST slabs, live stock, and low-stock reorder warnings.',
    icon: Package,
    roles: ['Owner', 'Manager', 'Inventory Manager'],
    phase: 'Phase 2',
  },

  // Customer & Admin Portals
  {
    path: '/shopper/home',
    title: 'Shopper / Consumer Khata Portal',
    category: 'Customer Portal',
    description: 'Customer-facing portal to view linked store accounts, outstanding balances, and purchase receipts with multi-tenant isolation.',
    icon: ShoppingBag,
    roles: ['Shopper'],
    phase: 'Phase 8',
  },
  {
    path: '/admin/dashboard',
    title: 'System Platform Administration',
    category: 'Administration',
    description: 'Global operator dashboard for platform health, multi-tenant diagnostics, and system auditing.',
    icon: ShieldAlert,
    roles: ['Platform Admin'],
    phase: 'Phase 9',
  },

  // Developer APIs
  {
    path: '/api/invoices',
    title: 'Invoicing & POS Billing Pipeline',
    category: 'API Endpoints',
    description: 'POST atomic billing transaction, GET filtered invoices list with GST aggregate stats.',
    icon: Code2,
    roles: ['API / Server'],
    phase: 'Phase 2',
    isApi: true,
  },
  {
    path: '/api/products',
    title: 'Product Catalog & Barcode API',
    category: 'API Endpoints',
    description: 'GET product query/barcode search, POST new product creation with audit logs.',
    icon: Code2,
    roles: ['API / Server'],
    phase: 'Phase 2',
    isApi: true,
  },
  {
    path: '/api/customers',
    title: 'Customer Directory & Balance API',
    category: 'API Endpoints',
    description: 'GET filtered customer lists, POST new party creation with opening balance reconciliation.',
    icon: Code2,
    roles: ['API / Server'],
    phase: 'Phase 1',
    isApi: true,
  },
  {
    path: '/api/transactions',
    title: 'Double-Entry Transaction Engine',
    category: 'API Endpoints',
    description: 'Atomic Udhar / Jama ledger transactions with idempotency protection and journal legs.',
    icon: Code2,
    roles: ['API / Server'],
    phase: 'Phase 1',
    isApi: true,
  },
];

export default function WebsiteMapPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'Public & Auth',
    'Merchant Core',
    'Billing & POS',
    'Inventory',
    'Customer Portal',
    'Administration',
    'API Endpoints',
  ];

  const filteredRoutes = SITE_ROUTES.filter((route) => {
    if (selectedCategory !== 'ALL' && route.category !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      route.path.toLowerCase().includes(q) ||
      route.title.toLowerCase().includes(q) ||
      route.description.toLowerCase().includes(q) ||
      route.category.toLowerCase().includes(q) ||
      route.roles.some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-6 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Logo size="md" glow={true} />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitch variant="compact" />
          <Link href="/dashboard">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Title & Description */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-700 dark:text-vyapar-300 border border-vyapar-200 dark:border-vyapar-800 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Information Architecture & Sitemap</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            VyaparOS Website & Application Map
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Complete architectural roadmap and clickable directory of all modules, interfaces, role boundaries, and API surfaces across VyaparOS.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by route path, page title, role permission, or feature keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-vyapar-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.path}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-vyapar-500/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Meta: Icon + Phase + Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-600 dark:text-vyapar-400 border border-vyapar-100 dark:border-vyapar-900/60 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {r.phase}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950 dark:text-vyapar-300">
                        {r.category}
                      </span>
                    </div>
                  </div>

                  {/* Route Title & Path */}
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-vyapar-600 transition-colors">
                      {r.title}
                    </h2>
                    <code className="text-[11px] font-mono font-bold text-slate-400 mt-0.5 block">
                      {r.path}
                    </code>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                {/* Role Badges & Navigation Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.roles.map((role) => (
                      <span
                        key={role}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  {!r.isApi ? (
                    <Link
                      href={r.path.includes('[id]') ? '/dashboard/customers' : r.path}
                      className="inline-flex items-center gap-1 text-xs font-bold text-vyapar-600 hover:text-vyapar-700 dark:text-vyapar-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      REST API
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Information Architecture Matrix Card */}
        <div className="bg-gradient-to-r from-slate-900 via-vyapar-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black tracking-tight">
              VyaparOS Multi-Tenant Architecture Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            VyaparOS strictly isolates data between business tenants via verified Firebase Auth JWT tokens and Supabase PostgreSQL Row-Level Security. Every ledger transaction is cryptographically tied to the merchant tenant and balanced across atomic double-entry legs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Identity Layer</span>
              <span className="font-bold text-slate-200 mt-1 block">Firebase Authentication (UID)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Database Layer</span>
              <span className="font-bold text-slate-200 mt-1 block">Supabase PostgreSQL 16+</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Ledger Engine</span>
              <span className="font-bold text-slate-200 mt-1 block">Atomic Double-Entry Journal</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© 2026 VyaparOS India. The Connected Operating System for Indian MSMEs.</p>
      </footer>
    </div>
  );
}
