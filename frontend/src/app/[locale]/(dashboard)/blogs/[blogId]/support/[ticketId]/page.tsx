'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, Send, Loader2, LifeBuoy, ShieldCheck, XCircle, Flame,
  Paperclip, X, Download, FileText, Film, Music, ImageIcon,
} from 'lucide-react';
import { supportApi, type SupportMessageItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { useStudioPreview } from '@/contexts/studio-preview';

function fmtTime(iso: string | null) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  in_progress: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  resolved:    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  closed:      'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
};

function FileAttachment({ url, name, type, isOwn }: { url: string; name?: string | null; type?: string | null; isOwn: boolean }) {
  const mime = type || '';
  if (mime.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={name || 'image'} className="max-w-[260px] max-h-[200px] rounded-xl object-cover border border-white/20" />
      </a>
    );
  }
  if (mime.startsWith('video/')) {
    return (
      <div className="mt-2">
        <video controls src={url} className="max-w-[280px] rounded-xl" />
      </div>
    );
  }
  if (mime.startsWith('audio/')) {
    return (
      <div className="mt-2">
        <audio controls src={url} className="w-[260px]" />
      </div>
    );
  }
  const Icon = mime === 'application/pdf' ? FileText : Download;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-[12px] font-medium hover:opacity-80 transition-opacity max-w-[260px]
        ${isOwn ? 'border-white/30 text-white bg-white/10' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800'}`}>
      <Icon className="h-4 w-4 shrink-0" />
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
  const previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  if (!file) return (
    <>
      <input ref={ref} type="file" className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ''; }}
      />
      <button type="button" onClick={() => ref.current?.click()} disabled={disabled}
        className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shrink-0 disabled:opacity-40">
        <Paperclip className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 mb-2">
      {previewUrl
        ? <img src={previewUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
        : <FileText className="h-5 w-5 text-blue-500 shrink-0" />}
      <span className="text-[12px] text-slate-700 dark:text-slate-300 truncate flex-1">{file.name}</span>
      <span className="text-[10px] text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
      <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function SupportTicketPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ticketId = params.ticketId as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('support');
  const { user } = useAuthStore();
  const { setFullWidth } = useStudioPreview();

  const [msg, setMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  const { data, isLoading } = useQuery({
    queryKey: ['support-ticket', blogId, ticketId],
    queryFn: () => supportApi.getTicket(blogId, ticketId).then(r => r.data),
    refetchInterval: 15000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const closeMut = useMutation({
    mutationFn: () => supportApi.closeTicket(blogId, ticketId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-ticket', blogId, ticketId] });
      toast({ title: t('ticketClosed') });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const ticket = data?.ticket;
  const messages = data?.messages ?? [];
  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';
  const canSend = (msg.trim().length > 0 || selectedFile !== null) && !isSubmitting;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setIsSubmitting(true);
    try {
      let fileUrl: string | undefined, fileName: string | undefined, fileType: string | undefined;
      if (selectedFile) {
        const up = await supportApi.uploadFile(blogId, selectedFile);
        fileUrl = up.data.url;
        fileName = up.data.name;
        fileType = up.data.type;
      }
      await supportApi.sendMessage(blogId, ticketId, msg.trim(), fileUrl, fileName, fileType);
      qc.invalidateQueries({ queryKey: ['support-ticket', blogId, ticketId] });
      setMsg('');
      setSelectedFile(null);
    } catch {
      toast({ variant: 'destructive', title: t('sendError') });
    } finally {
      setIsSubmitting(false);
    }
  }, [blogId, ticketId, msg, selectedFile, canSend, qc, toast, t]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={() => router.push(`/${locale}/blogs/${blogId}/support`)}
          className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <LifeBuoy className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{ticket?.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {ticket && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.open}`}>
                    {t(`status_${ticket.status}`)}
                  </span>
                )}
                {ticket?.priority === 'urgent' && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                    <Flame className="h-3 w-3" />{t('urgent')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {ticket && !isClosed && (
          <button
            onClick={() => closeMut.mutate()}
            disabled={closeMut.isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:border-red-200 hover:text-red-500 dark:hover:border-red-800 transition-colors shrink-0"
          >
            {closeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            {t('closeTicket')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-[13px]">
            {t('noMessages')}
          </div>
        ) : (
          messages.map((m: SupportMessageItem) => {
            const isAdmin = m.is_from_admin;
            return (
              <div key={m.id} className={`flex gap-3 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px] font-bold
                  ${isAdmin ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  {isAdmin ? <ShieldCheck className="h-4 w-4" /> : (user?.display_name?.[0]?.toUpperCase() ?? 'U')}
                </div>
                <div className={`max-w-[72%] space-y-1 ${isAdmin ? '' : 'items-end flex flex-col'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed
                    ${isAdmin
                      ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {(isAdmin ? (m.body_translated || m.body_original) : m.body_original) && (
                      <span>{isAdmin ? (m.body_translated || m.body_original) : m.body_original}</span>
                    )}
                    {m.file_url && (
                      <FileAttachment url={m.file_url} name={m.file_name} type={m.file_type} isOwn={!isAdmin} />
                    )}
                  </div>
                  <p className={`text-[10px] text-slate-400 dark:text-slate-500 ${isAdmin ? 'pl-1' : 'pr-1'}`}>
                    {isAdmin ? (m.sender_name ?? t('adminLabel')) : t('youLabel')} · {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
        {isClosed ? (
          <div className="text-center text-[12px] text-slate-400 dark:text-slate-500 py-2">
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
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('composerPlaceholder')}
                rows={2}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{t('translationNote')}</p>
      </div>
    </div>
  );
}
