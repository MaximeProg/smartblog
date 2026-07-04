'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Info, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { authApi } from '@/lib/api';
import type { NotificationItem } from '@/types';

const TYPE_CONFIG = {
  info:    { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-100 dark:border-blue-800',    icon_cls: 'text-blue-500'             },
  success: { icon: Zap,           bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', icon_cls: 'text-emerald-500'       },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-100 dark:border-amber-800',  icon_cls: 'text-amber-500'            },
  error:   { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-100 dark:border-red-800',      icon_cls: 'text-red-500'              },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await authApi.notifications();
      return data;
    },
    staleTime: 60_000,
  });

  const unread = notifications.filter(n => !n.read).length;

  function markAllRead() {
    qc.setQueryData<NotificationItem[]>(['notifications'], prev =>
      prev?.map(n => ({ ...n, read: true })) ?? []
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">{t('title')}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {unread > 0 ? t('unreadCount', { n: unread }) : t('allRead')}
                </p>
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[12px] font-medium text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mb-2">{t('noneTitle')}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed">
                  {t('noneDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md dark:border-slate-700 ${notif.read ? 'opacity-60' : ''}`}
                    >
                      <div className={`h-9 w-9 rounded-xl border ${cfg.border} ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <cfg.icon className={`h-4 w-4 ${cfg.icon_cls}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[13.5px] font-semibold ${notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{timeAgo(notif.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
