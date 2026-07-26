'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Bell, Send, RefreshCw, Users, Globe, Loader2 } from 'lucide-react';
import { superadminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

export default function NotificationsPage() {
  const t  = useTranslations('superAdmin');
  const tn = useTranslations('superAdmin.notifications');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['sa-notifications'],
    queryFn: () => superadminApi.listNotifications().then(r => r.data),
  });

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: () => superadminApi.sendNotification({ title, message, audience }),
    onSuccess: (res) => {
      const sent = (res.data as any)?.sent ?? 0;
      toast({ title: `${tn('sent')} (${sent})` });
      setTitle('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['sa-notifications'] });
    },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  const AUDIENCES = [
    { id: 'all',     icon: Globe,  label: tn('audience.all') },
    { id: 'paid',    icon: Users,  label: tn('audience.paid') },
    { id: 'free',    icon: Users,  label: tn('audience.free') },
  ];

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tn('breadcrumb')}</span>
        </div>
        <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tn('title')}</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tn('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Compose */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <h3 className="text-[13px] font-bold mb-4" style={{ color: 'var(--sa-text)' }}>{tn('compose')}</h3>

          <div className="mb-3">
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-3)' }}>{tn('field.audience')}</label>
            <div className="flex gap-2">
              {AUDIENCES.map(a => (
                <button key={a.id} onClick={() => setAudience(a.id)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-xl border text-[11px] font-semibold transition-colors"
                  style={{
                    borderColor: audience === a.id ? '#6366f1' : 'var(--sa-border)',
                    background: audience === a.id ? '#6366f1' : 'transparent',
                    color: audience === a.id ? '#fff' : 'var(--sa-text-3)',
                  }}>
                  <a.icon className="h-3 w-3" /> {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-3)' }}>{tn('field.title')}</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder={tn('field.titlePlaceholder')}
              className="w-full h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-3)' }}>{tn('field.message')}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={4} placeholder={tn('field.messagePlaceholder')}
              className="w-full px-3 py-2 rounded-xl border bg-transparent text-[12px] focus:outline-none resize-none"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
          </div>

          <button onClick={() => send()} disabled={!title || !message || sending}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold transition-opacity disabled:opacity-40"
            style={{ background: '#6366f1', color: '#fff' }}>
            {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {tn('send')}
          </button>
        </div>

        {/* History */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <h3 className="text-[13px] font-bold mb-4" style={{ color: 'var(--sa-text)' }}>{tn('history')}</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
            </div>
          ) : (data?.notifications ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Bell className="h-8 w-8" style={{ color: 'var(--sa-text-3)' }} />
              <p className="text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{tn('empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.notifications ?? []).map((n: any) => (
                <div key={n.id ?? n.sent_at} className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                  <Bell className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--sa-text)' }}>{n.title}</p>
                      {n.sent_count > 0 && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--sa-accent-bg)', color: 'var(--sa-accent)' }}>
                          {n.sent_count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--sa-text-3)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--sa-text-3)' }}>
                      {n.sent_at ? new Date(n.sent_at).toLocaleString() : ''}
                      {n.audience && n.audience !== 'all' && (
                        <span className="ml-2 font-semibold">[{n.audience}]</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}