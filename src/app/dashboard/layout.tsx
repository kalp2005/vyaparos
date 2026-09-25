'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { BottomNav } from '@/components/layout/BottomNav';
import { Logo } from '@/components/ui/Logo';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { TransactionModal } from '@/components/khata/TransactionModal';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { ToastProvider } from '@/context/ToastContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authData, setAuthData] = useState<{
    user: any;
    activeBusiness: any;
    membership: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Global Modal States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Unauthenticated');
        }
        return res.json();
      })
      .then((data) => {
        if (!data.success || !data.user) {
          router.push('/login');
          return;
        }

        if (!data.activeBusiness) {
          router.push('/onboarding');
          return;
        }

        setAuthData(data);
      })
      .catch((err) => {
        console.error('Session check failed:', err);
        router.push('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  // Global Keyboard Shortcut for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Logo size="lg" glow={true} showWordmark={true} />
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading VyaparOS...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-vyapar-500 selection:text-white">
        {/* Desktop Sidebar */}
        <Sidebar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          <TopNav
            userName={authData?.user?.fullName}
            businessName={authData?.activeBusiness?.name}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
            {children}
          </main>
          <BottomNav onQuickAdd={() => setIsTransactionModalOpen(true)} />
        </div>

        {/* Global Action Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenTransaction={() => setIsTransactionModalOpen(true)}
          onOpenCustomer={() => setIsAddCustomerModalOpen(true)}
        />

        {/* Global Transaction Modal */}
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        {/* Global Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      </div>
    </ToastProvider>
  );
}
