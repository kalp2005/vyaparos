'use client';

import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, User, RotateCcw, Plus, Sparkles, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/i18n/context';
import { FadeIn } from '@/components/ui/motion';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiFetch } from '@/lib/api-client';

interface AuditItem {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  globalRole: string;
  businessRole?: string | null;
  newState?: string | null;
  createdAt: string;
  actor?: {
    fullName: string;
    email?: string | null;
  } | null;
}

export default function ActivityPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    apiFetch('/api/audit')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.logs) {
          setLogs(data.logs);
        }
      })
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {t.activity.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.activity.subtitle}
        </p>
      </div>

      {/* Activity Timeline Card */}
      <Card className="p-4 sm:p-6">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded yet"
            description="All staff actions, customer credit adjustments, and reversals will appear in this immutable timeline."
          />
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {logs.map((log) => {
              const formattedDate = new Date(log.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isReversal = log.action.includes('REVERSE');
              const isCreate = log.action.includes('CREATE');

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      isReversal
                        ? 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950'
                        : isCreate
                        ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                        : 'bg-vyapar-500 ring-4 ring-vyapar-100 dark:ring-vyapar-950'
                    }`}
                  />

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <Badge
                          variant={isReversal ? 'void' : isCreate ? 'lena' : 'neutral'}
                          size="sm"
                        >
                          {log.entityName}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong>{log.actor?.fullName || 'System'}</strong> ({log.businessRole || log.globalRole})
                      </span>
                      {log.newState && (
                        <span className="text-[11px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 truncate max-w-xs">
                          {log.newState}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </FadeIn>
  );
}
