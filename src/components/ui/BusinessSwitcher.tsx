'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ChevronDown, Check, Plus, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BusinessSwitcher() {
  const router = useRouter();
  const { activeBusiness, activeRole, memberships, switchBusiness } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentBusinessName = activeBusiness?.name || 'Ramesh Kirana Store';
  const currentRole = activeRole || 'OWNER';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-vyapar-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-vyapar-600 dark:group-hover:text-vyapar-400 transition-colors">
              {currentBusinessName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {currentRole}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-slate-900 dark:text-slate-100' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Your Businesses
            </div>

            {memberships && memberships.length > 0 ? (
              memberships.map((m) => {
                const isSelected = activeBusiness?.id === m.businessId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      switchBusiness(m.businessId);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-vyapar-50 dark:bg-vyapar-950/80 text-vyapar-900 dark:text-vyapar-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{m.businessName}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{m.roleKey.toLowerCase()} • {m.businessType}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-vyapar-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            ) : (
              <div className="p-2 rounded-xl text-left text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span>{currentBusinessName}</span>
                <Check className="w-3.5 h-3.5 text-vyapar-600" />
              </div>
            )}

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/onboarding');
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-vyapar-600 dark:text-vyapar-400 hover:bg-vyapar-50 dark:hover:bg-vyapar-950/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Business</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
