'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, Send, Loader2, ShieldCheck, User2, Flame,
  Paperclip, X, Download, FileText,
} from 'lucide-react';
import { superadminApi, type SupportMessageItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

function fmtTime(iso: string | null) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent'] as const;

function FileAttachment({ url, name, type, isOwn }: { url: string; name?: string | null; type?: string | null; isOwn: boolean }) {
  const mime = type || '';
  if (mime.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={name || 'image'} className="max-w-[260px] max-h-[200px] rounded-xl object-cover" style={{ border: isOwn ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--sa-border)' }} />
      </a>
    );
  }
  if (mime.startsWith('video/')) {
    return <div className="mt-2"><video controls src={url} className="max-w-[280px] rounded-xl" /></div>;
  }
  if (mime.startsWith('audio/')) {
    return <div className="mt-2"><audio controls src={url} className="w-[260px]" /></div>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-[12px] font-medium hover:opacity-80 transition-opacity max-w-[260px]"
      style={{
        background: isOwn ? 'rgba(255,255,255,0.12)' : 'var(--sa-surface)',
        border: `1px solid ${isOwn ? 'rgba(255,255,255,0.25)' : 'var(--sa-border)'}`,
        color: isOwn ? '#fff' : 'var(--sa-text)',
      }}>
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1">{name || 'Download'}</span>
      <Download className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}

function FilePicker({ file, onSelect, onRemove, disabled }: {
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  if (!file) return (
    <>
      <input ref={ref} type="file" className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ''; }}
      />
      <button type="button" onClick={() => ref.current?.click()} disabled={disabled}
        className="h-9 w-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 disabled:opacity-40"
        style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
        <Paperclip className="h-4 w-4" />
      </button>
    </>
  );

  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
      style={{ borderColor: 'var(--sa-accent)', background: 'var(--sa-accent-bg)' }}>
      {previewUrl
        ? <img src={previewUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
        : <FileText className="h-5 w-5 shrink-0" style={{ color: 'var(--sa-accent)' }} />}
      <span className="text-[12px] truncate flex-1" style={{ color: 'var(--sa-text)' }}>{file.name}</span>
      <span className="text-[10px] shrink-0" style={{ color: 'var(--sa-text-3)' }}>{(file.size / 1024).toFixed(0)}KB</span>
      <button onClick={onRemove} className="shrink-0" style={{ color: 'var(--sa-text-3)' }}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AdminTicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('superAdmin.support');

  const [reply, setReply] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-ticket', ticketId],
    queryFn: () => superadminApi.getSupportTicket(ticketId).then(r => r.data),
    refetchInterval: 15000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updateMut = useMutation({
    mutationFn: (d: { status?: string; priority?: string }) =>
      superadminApi.updateSupportTicket(ticketId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['sa-support'] });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: t('updateError'), description: getErrorMessage(err, '') }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const ticket = data?.ticket;
  const messages = (data?.messages ?? []) as SupportMessageItem[];
  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';
  const canSend = (reply.trim().length > 0 || selectedFile !== null) && !isSubmitting;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setIsSubmitting(true);
    try {
      let fileUrl: string | undefined, fileName: string | undefined, fileType: string | undefined;
      if (selectedFile) {
        const up = await superadminApi.uploadSupportFile(selectedFile);
        fileUrl = up.data.url;
        fileName = up.data.name;
        fileType = up.data.type;
      }
      await superadminApi.replySupportTicket(ticketId, reply.trim(), fileUrl, fileName, fileType);
      qc.invalidateQueries({ queryKey: ['sa-ticket', ticketId] });
      setReply('');
      setSelectedFile(null);
    } catch {
      toast({ variant: 'destructive', title: t('replyError') });
    } finally {
      setIsSubmitting(false);
    }
  }, [ticketId, reply, selectedFile, canSend, qc, toast, t]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white
                  ${isAdmin ? 'bg-[#6366f1]' : 'bg-slate-500'}`}>
                  {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User2 className="h-4 w-4" />}
                </div>
                <div className={`max-w-[70%] space-y-1 ${isAdmin ? 'items-end flex flex-col' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed
                    ${isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm border'}`}
                    style={isAdmin
                      ? { background: '#6366f1', color: '#fff' }
                      : { background: 'var(--sa-card)', borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }
                    }
                  >
                    {(isAdmin ? m.body_original : (m.body_translated || m.body_original)) && (
                      <span>{isAdmin ? m.body_original : (m.body_translated || m.body_original)}</span>
                    )}
                    {m.file_url && (
                      <FileAttachment url={m.file_url} name={m.file_name} type={m.file_type} isOwn={isAdmin} />
                    )}
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
          <>
            {selectedFile && (
              <FilePicker file={selectedFile} onSelect={setSelectedFile} onRemove={() => setSelectedFile(null)} disabled={isSubmitting} />
            )}
            <div className="flex items-end gap-2">
              <FilePicker file={null} onSelect={setSelectedFile} onRemove={() => setSelectedFile(null)} disabled={isSubmitting} />
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
                onClick={handleSend}
                disabled={!canSend}
                className="h-10 w-10 flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-colors shrink-0"
                style={{ background: 'var(--sa-accent)' }}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
        <p className="text-[10px] mt-2" style={{ color: 'var(--sa-text-3)' }}>{t('replyTranslationNote')}</p>
      </div>
    </div>
  );
}
