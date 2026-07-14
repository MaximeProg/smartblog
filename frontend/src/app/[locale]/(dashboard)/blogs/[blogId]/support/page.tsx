'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useParams as useNextParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  LifeBuoy, Plus, Loader2, ChevronRight, Clock, CheckCircle2,
  AlertCircle, XCircle, MessageSquare, Flame,
} from 'lucide-react';
import { supportApi, type SupportTicketItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

const STATUS_CFG: Record<string, { cls: string; icon: React.ElementType; dotCls: string }> = {
  open:        { cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',     icon: MessageSquare, dotCls: 'bg-blue-500' },
  in_progress: { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock,          dotCls: 'bg-amber-500' },
  resolved:    { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2, dotCls: 'bg-emerald-500' },
  closed:      { cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600', icon: XCircle,       dotCls: 'bg-slate-400' },
};

const PRIORITY_CFG: Record<string, { cls: string; label: string }> = {
  low:    { cls: 'text-slate-400', label: '↓' },
  normal: { cls: 'text-slate-500', label: '–' },
  high:   { cls: 'text-amber-500', label: '↑' },
  urgent: { cls: 'text-red-500',   label: '‼' },
};

export default function SupportListPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('support');

  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', blogId, filterStatus],
    queryFn: () => supportApi.listTickets(blogId, { status: filterStatus || undefined, limit: 50 }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => supportApi.createTicket(blogId, {
      subject: subject.trim(),
      first_message: firstMessage.trim(),
      priority,
      language: navigator.language?.split('-')[0] || 'fr',
    }),
    onSuccess: ({ data: ticket }) => {
      qc.invalidateQueries({ queryKey: ['support-tickets', blogId] });
      toast({ title: t('ticketCreated') });
      setShowCreate(false);
      setSubject('');
      setFirstMessage('');
      setPriority('normal');
      router.push(`/${locale}/blogs/${blogId}/support/${ticket.id}`);
    },
    onError: () => toast({ variant: 'destructive', title: t('createError') }),
  });

  const tickets = data?.tickets ?? [];

  return (
    <FullPageShell
      title={t('title')}
      description={t('description')}
      action={
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('newTicket')}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Create ticket form */}
        {showCreate && (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-blue-500" />
              {t('newTicketTitle')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{t('subject')}</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={t('subjectPlaceholder')}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{t('message')}</label>
                <textarea
                  value={firstMessage}
                  onChange={e => setFirstMessage(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{t('priority')}</label>
                <div className="flex items-center gap-2">
                  {(['low', 'normal', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`h-8 px-3 rounded-lg text-[11px] font-semibold border transition-colors ${
                        priority === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {t(`priority_${p}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setShowCreate(false); setSubject(''); setFirstMessage(''); }}
                className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!subject.trim() || !firstMessage.trim() || createMut.isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LifeBuoy className="h-3.5 w-3.5" />}
                {t('submit')}
              </button>
            </div>
          </div>
        )}

        {/* Status filter */}
        <div className="flex items-center gap-2">
          {(['', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-7 px-3 rounded-lg text-[11px] font-semibold border transition-colors ${
                filterStatus === s
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {s ? t(`status_${s}`) : t('all')}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
                <LifeBuoy className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noTickets')}</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs">{t('noTicketsDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((ticket: SupportTicketItem) => {
                const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
                const pc = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.normal;
                const StatusIcon = sc.icon;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => router.push(`/${locale}/blogs/${blogId}/support/${ticket.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <StatusIcon className={`h-4 w-4 ${sc.cls.split(' ')[4] ?? 'text-slate-400'}`} style={{ color: 'currentColor' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{ticket.subject}</p>
                        {ticket.priority === 'urgent' && <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                      </div>
                      {ticket.last_message && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{ticket.last_message}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${sc.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dotCls}`} />
                        {t(`status_${ticket.status}`)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDate(ticket.created_at)}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FullPageShell>
  );
}
