'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Globe, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Copy, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { domainsApi, type CustomDomainInfo } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  pending:  { icon: Clock,          cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',  label: 'Pending'  },
  verified: { icon: CheckCircle2,   cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: 'Verified' },
  failed:   { icon: XCircle,        cls: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',            label: 'Failed'   },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      title="Copier"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function DomainsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('domains');
  const [newDomain, setNewDomain] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domains', blogId],
    queryFn: async () => { const { data } = await domainsApi.list(blogId); return data; },
  });

  const addMut = useMutation({
    mutationFn: () => domainsApi.add(blogId, newDomain.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      setNewDomain('');
      setShowAdd(false);
      toast({ title: t('addSuccess') });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: err?.response?.data?.detail ?? t('addError') }),
  });

  const verifyMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.verify(blogId, domainId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      const status = res.data.verification_status;
      if (status === 'verified') {
        toast({ title: t('verifySuccess') });
      } else {
        toast({ variant: 'destructive', title: t('verifyFailed') });
      }
    },
    onError: () => toast({ variant: 'destructive', title: t('verifyError') }),
  });

  const deleteMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.remove(blogId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      toast({ title: t('deleteSuccess') });
    },
    onError: () => toast({ variant: 'destructive', title: t('deleteError') }),
  });

  return (
    <FullPageShell
      title={t('pageTitle')}
      description={t('pageDesc')}
      action={
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> {t('addDomain')}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Add domain form */}
        {showAdd && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3">{t('addTitle')}</h3>
            <div className="flex items-center gap-2">
              <input
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newDomain.trim()) addMut.mutate(); }}
                placeholder="blog.monsite.com"
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button
                onClick={() => addMut.mutate()}
                disabled={!newDomain.trim() || addMut.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {addMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t('addButton')}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{t('addHint')}</p>
          </div>
        )}

        {/* DNS instruction banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4">
          <h3 className="text-[12px] font-bold text-blue-700 dark:text-blue-400 mb-2">{t('dnsTitle')}</h3>
          <ol className="space-y-1.5 text-[12px] text-blue-700 dark:text-blue-300">
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">1.</span>{t('dnsStep1')}</li>
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">2.</span>{t('dnsStep2')}</li>
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">3.</span>{t('dnsStep3')}</li>
          </ol>
        </div>

        {/* Domain list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-4">
              <Globe className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('emptyTitle')}</p>
            <p className="text-[12px] text-slate-400 max-w-xs">{t('emptyDesc')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {domains.map((d: CustomDomainInfo) => {
              const cfg = STATUS_CONFIG[d.verification_status];
              const StatusIcon = cfg.icon;
              return (
                <div key={d.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">{d.domain}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('addedOn', { date: new Date(d.created_at).toLocaleDateString() })}
                        {d.ssl_enabled && <span className="ml-2 text-emerald-500 font-semibold">· SSL ✓</span>}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => verifyMut.mutate(d.id)}
                      disabled={verifyMut.isPending}
                      title={t('verifyButton')}
                      className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50"
                    >
                      {verifyMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(t('deleteConfirm'))) deleteMut.mutate(d.id); }}
                      disabled={deleteMut.isPending}
                      className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* TXT verification record */}
                  {d.verification_status !== 'verified' && (
                    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('dnsRecord')}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0">Type</span>
                          <span className="text-[12px] font-mono text-slate-700 dark:text-slate-300">TXT</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0">Name</span>
                          <span className="text-[12px] font-mono text-slate-700 dark:text-slate-300 flex-1 truncate">@</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0">Value</span>
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 flex-1 break-all">{d.verification_token}</span>
                          <CopyButton text={d.verification_token} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
