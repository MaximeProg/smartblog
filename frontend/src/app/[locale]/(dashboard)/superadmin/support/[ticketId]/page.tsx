'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, Send, Loader2, ShieldCheck, User2, Flame,
  CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { superadminApi, type SupportMessageItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function fmtTime(iso: string | null) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent'] as const;

const STATUS_CLS: Record<string, string> = {
  open:        'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  in_progress: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  resolved:    'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  closed:      'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function AdminTicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('superAdmin.support');

  const [reply, setReply] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-ticket', ticketId],
    queryFn: () => superadminApi.getSupportTicket(ticketId).then(r => r.data),
    refetchInterval: 15000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const replyMut = useMutation({
    mutationFn: () => superadminApi.replySupportTicket(ticketId, reply.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ticket', ticketId] });
      setReply('');
    },
    onError: () => toast({ variant: 'destructive', title: t('replyError') }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { status?: string; priority?: string }) =>
      superadminApi.updateSupportTicket(ticketId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['sa-support'] });
    },
    onError: () => toast({ variant: 'destructive', title: t('updateError') }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const ticket = data?.ticket;
  const messages = (data?.messages ?? []) as SupportMessageItem[];
  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (reply.trim() && !replyMut.isPending) replyMut.mutate();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]" style={{ background: 'var(--sa-bg)' }}>

      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        <button
          onClick={() => router.push(`/${locale}/superadmin/support`)}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors mt-0.5 shrink-0"
          style={{ color: 'var(--sa-text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--sa-surface)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-64 rounded animate-pulse" style={{ background: 'var(--sa-surface)' }} />
              <div className="h-3 w-40 rounded animate-pulse" style={{ background: 'var(--sa-surface)' }} />
            </div>
          ) : ticket ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16px] font-black" style={{ color: 'var(--sa-text)' }}>{ticket.subject}</h1>
                {ticket.priority === 'urgent' && <Flame className="h-4 w-4 text-red-500 shrink-0" />}
                {ticket.priority === 'high' && <Flame className="h-4 w-4 text-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--sa-accent)' }}>{ticket.tenant_name}</span>
                {ticket.opener_email && (
                  <span className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>· {ticket.opener_email}</span>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Controls */}
        {ticket && (
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={ticket.status}
              onChange={e => updateMut.mutate({ status: e.target.value })}
              disabled={updateMut.isPending}
              className="h-8 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)', color: 'var(--sa-text)' }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{t(`status_${s}`)}</option>
              ))}
            </select>
            <select
              value={ticket.priority}
              onChange={e => updateMut.mutate({ priority: e.target.value })}
              disabled={updateMut.isPending}
              className="h-8 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)', color: 'var(--sa-text)' }}
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{t(`priority_${p}`)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--sa-text-3)' }}>
            {t('noMessages')}
          </div>
        ) : (
          messages.map((m: SupportMessageItem) => {
            const isAdmin = m.is_from_admin;
            return (
              <div key={m.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px] font-bold
                  ${isAdmin ? 'bg-blue-600' : 'bg-slate-500'}`}>
                  {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User2 className="h-4 w-4" />}
                </div>
                <div className={`max-w-[70%] space-y-1 ${isAdmin ? 'items-end flex flex-col' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed
                    ${isAdmin
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'rounded-tl-sm border'
                    }`}
                    style={!isAdmin ? { background: 'var(--sa-card)', borderColor: 'var(--sa-border)', color: 'var(--sa-text)' } : {}}
                  >
                    {/* Admin sees original (English); tenant messages show translated (English) */}
                    {isAdmin ? m.body_original : (m.body_translated || m.body_original)}
                  </div>
                  <div className={`flex items-center gap-1.5 ${isAdmin ? 'pr-1' : 'pl-1'}`}>
                    <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>
                      {isAdmin ? t('youLabel') : (m.sender_name ?? t('tenantLabel'))} · {fmtTime(m.created_at)}
                    </p>
                    {!isAdmin && m.body_translated && m.body_translated !== m.body_original && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
                        {t('translated')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t px-5 py-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isClosed ? (
          <div className="text-center text-[12px] py-2" style={{ color: 'var(--sa-text-3)' }}>
            {t('ticketClosedMsg')}
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('composerPlaceholder')}
              rows={2}
              className="flex-1 px-3 py-2.5 rounded-xl text-[13px] border focus:outline-none resize-none"
              style={{
                borderColor: 'var(--sa-border)',
                background: 'var(--sa-surface)',
                color: 'var(--sa-text)',
              }}
            />
            <button
              onClick={() => replyMut.mutate()}
              disabled={!reply.trim() || replyMut.isPending}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-colors shrink-0"
              style={{ background: 'var(--sa-accent)' }}
            >
              {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        )}
        <p className="text-[10px] mt-2" style={{ color: 'var(--sa-text-3)' }}>{t('replyTranslationNote')}</p>
      </div>
    </div>
  );
}
