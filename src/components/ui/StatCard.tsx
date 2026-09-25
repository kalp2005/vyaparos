import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  hindiTitle?: string;
  amount: number;
  type?: 'lena' | 'dena' | 'neutral' | 'cash';
  icon?: React.ReactNode;
  trend?: string;
}

export function StatCard({
  title,
  subtitle,
  hindiTitle,
  amount,
  type = 'neutral',
  icon,
  trend,
}: StatCardProps) {
  const typeStyles = {
    lena: {
      text: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />,
    },
    dena: {
      text: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      border: 'border-rose-100 dark:border-rose-900/40',
      icon: <ArrowUpRight className="w-4 h-4 text-rose-600" />,
    },
    cash: {
      text: 'text-vyapar-600 dark:text-vyapar-400',
      badgeBg: 'bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950/60 dark:text-vyapar-300',
      border: 'border-vyapar-100 dark:border-vyapar-900/40',
      icon: <TrendingUp className="w-4 h-4 text-vyapar-600" />,
    },
    neutral: {
      text: 'text-slate-900 dark:text-slate-100',
      badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      icon: null,
    },
  };

  const style = typeStyles[type];

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <Card className={`relative overflow-hidden border ${style.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
            {hindiTitle && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${style.badgeBg}`}>
                {hindiTitle}
              </span>
            )}
          </div>
          <div className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight ${style.text}`}>
            {formattedAmount}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
          {style.icon}
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
}
