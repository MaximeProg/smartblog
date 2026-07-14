'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Info, AlertTriangle, Zap, Loader2, BellRing, BellOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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

// ── Web Push helper ───────────────────────────────────────────────

function urlB64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  const bytes   = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

async function registerPush(vapidKey: string) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(vapidKey),
  });
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await authApi.savePushSubscription(json);
  return sub;
}

// ── Read-state persistence (localStorage) ─────────────────────────

const STORAGE_KEY = 'smarterbloggers:notif-read';

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch { /* quota exceeded — ignore */ }
}

// ── Page ──────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pushState, setPushState] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await authApi.notifications();
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Merge API data with persisted local read state
  const notifications = rawNotifications.map(n => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));

  const unread = notifications.filter(n => !n.read).length;

  // Sync badge count cache avec la liste complète
  useEffect(() => {
    qc.setQueryData(['notifications-count'], { unread, total: notifications.length });
  }, [unread, notifications.length, qc]);

  // Détecte l'état push actuel
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPushState(Notification.permission === 'granted' ? 'granted' : 'unknown');
  }, []);

  const enablePush = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({ variant: 'destructive', title: 'Notifications non supportées dans ce navigateur.' });
      return;
    }
    setPushState('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushState('denied'); return; }

      const { data } = await authApi.getVapidPublicKey();
      if (!data.public_key) throw new Error('No VAPID key');

      await registerPush(data.public_key);
      setPushState('granted');
      toast({ title: 'Notifications push activées !' });
    } catch {
      setPushState('unknown');
      toast({ variant: 'destructive', title: 'Impossible d\'activer les notifications push.' });
    }
  }, [toast]);

  const disablePush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await authApi.deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setPushState('unknown');
      toast({ title: 'Notifications push désactivées.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la désactivation.' });
    }
  }, [toast]);

  function markAllRead() {
    const newReadIds = new Set([...readIds, ...notifications.map(n => n.id)]);
    setReadIds(newReadIds);
    persistReadIds(newReadIds);
    qc.setQueryData(['notifications-count'], { unread: 0, total: notifications.length });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">{t('title')}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {unread > 0 ? t('unreadCount', { n: unread }) : t('allRead')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Bouton Push */}
                {'Notification' in window && 'serviceWorker' in navigator && (
                  pushState === 'granted' ? (
                    <button
                      onClick={disablePush}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[12px] font-medium text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <BellOff className="h-3.5 w-3.5" />
                      Désactiver push
                    </button>
                  ) : pushState === 'denied' ? (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <BellOff className="h-3 w-3" /> Push bloqué par le navigateur
                    </span>
                  ) : (
                    <button
                      onClick={enablePush}
                      disabled={pushState === 'loading'}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
                    >
                      {pushState === 'loading'
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <BellRing className="h-3.5 w-3.5" />}
                      Activer les push
                    </button>
                  )
                )}

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
