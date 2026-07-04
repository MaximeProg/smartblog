'use client';

import { Bell, CheckCheck, Info, AlertTriangle, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'info' as const,
    title: 'Welcome to NexusBlog!',
    body: 'Your account is ready. Create your first blog to start publishing.',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'success' as const,
    title: 'Subscription activated',
    body: 'Your Free plan is active. Upgrade to Pro to unlock all features.',
    time: '1 hour ago',
    read: true,
  },
];

const TYPE_CONFIG = {
  info:    { icon: Info,          bg: 'bg-blue-50',   border: 'border-blue-100',   icon_cls: 'text-blue-500'    },
  success: { icon: Zap,           bg: 'bg-emerald-50',border: 'border-emerald-100',icon_cls: 'text-emerald-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-amber-100',  icon_cls: 'text-amber-500'   },
};

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-black text-slate-900">{t('title')}</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {unread > 0 ? t('unreadCount', { n: unread }) : t('allRead')}
                </p>
              </div>
              {unread > 0 && (
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-[12px] font-medium text-slate-600 transition-colors">
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {MOCK_NOTIFICATIONS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{t('noneTitle')}</h3>
                <p className="text-[13px] text-slate-500 max-w-[260px] leading-relaxed">
                  {t('noneDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {MOCK_NOTIFICATIONS.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type];
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${notif.read ? 'opacity-70' : ''}`}
                    >
                      <div className={`h-9 w-9 rounded-xl border ${cfg.border} ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <cfg.icon className={`h-4.5 w-4.5 ${cfg.icon_cls}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[13.5px] font-semibold ${notif.read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[11px] text-slate-400 mt-1.5">{notif.time}</p>
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
