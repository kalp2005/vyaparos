'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Building2, Users, Activity, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, globalRole, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalBusinesses: 142,
    totalUsers: 890,
    platformUptime: '99.98%',
    activeTenants: 128,
  });

  useEffect(() => {
    if (user && user.globalRole !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Admin Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <Badge variant="dena" size="sm">
            PLATFORM SUPER ADMIN
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Admin: {user?.fullName || 'Superadmin'}</span>
          <Button variant="outline" size="sm" onClick={signOut} className="text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Exit Admin
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Platform Master Control</h1>
            <p className="text-xs text-slate-400">System metrics, tenant health, and platform governance</p>
          </div>
        </div>

        {/* Privacy Guard Notice */}
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800 text-amber-300 text-xs flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Merchant Privacy & DPDP Act 2023 Isolation Constraint Active</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">
              Platform Administrators do not have automated direct access to individual merchant customer khata ledgers or transaction amounts. All platform maintenance access generates an immutable audit record.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-5 bg-slate-800/80 border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Registered Businesses</span>
            </div>
            <div className="text-3xl font-black mt-2 text-white">{stats.totalBusinesses}</div>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Platform Users</span>
            </div>
            <div className="text-3xl font-black mt-2 text-white">{stats.totalUsers}</div>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>System Uptime</span>
            </div>
            <div className="text-3xl font-black mt-2 text-emerald-400">{stats.platformUptime}</div>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4 text-vyapar-400" />
              <span>Active Tenants</span>
            </div>
            <div className="text-3xl font-black mt-2 text-white">{stats.activeTenants}</div>
          </Card>
        </div>

        {/* Tenant Governance Table */}
        <Card className="p-6 bg-slate-800/60 border-slate-700 space-y-4">
          <h2 className="text-base font-bold text-slate-100">Registered Business Tenants</h2>
          <div className="divide-y divide-slate-700/60 text-xs">
            {[
              { id: '1', name: 'Ramesh Kirana & General Store', owner: 'Ramesh Kumar', type: 'Retail', status: 'ACTIVE' },
              { id: '2', name: 'Deshmukh FMCG Wholesalers', owner: 'Priya Deshmukh', type: 'Wholesale', status: 'ACTIVE' },
              { id: '3', name: 'Sai Traders & Hardware', owner: 'Sanjay Shinde', type: 'Distributor', status: 'ACTIVE' },
            ].map((tenant) => (
              <div key={tenant.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-200">{tenant.name}</p>
                  <p className="text-slate-400 text-[11px]">Owner: {tenant.owner} • {tenant.type}</p>
                </div>
                <Badge variant="lena" size="sm">{tenant.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
