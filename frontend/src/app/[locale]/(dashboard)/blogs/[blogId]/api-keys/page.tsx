'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Key, Plus, Trash2, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiKeysApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

export default function ApiKeysPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('apiKeys');

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys', blogId],
    queryFn: async () => { const { data } = await apiKeysApi.list(blogId); return data; },
  });

  const createMut = useMutation({
    mutationFn: () => apiKeysApi.create(blogId, newName.trim(), newExpiry || undefined),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['api-keys', blogId] });
      setRevealedKey({ id: data.id, key: data.key });
      setCreating(false);
      setNewName('');
      setNewExpiry('');
      toast({ title: t('keyCreated') });
    },
    onError: () => toast({ variant: 'destructive', title: t('createError') }),
  });

  const revokeMut = useMutation({
    mutationFn: (keyId: string) => apiKeysApi.revoke(blogId, keyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys', blogId] });
      setConfirmRevoke(null);
      toast({ title: t('keyRevoked') });
    },
    onError: () => toast({ variant: 'destructive', title: t('revokeError') }),
  });

  async function copyKey() {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <FullPageShell
      title={t('title')}
      description={t('description')}
      action={
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('newKey')}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Revealed key banner */}
        {revealedKey && (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-2">
            <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">{t('keyRevealBanner')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 break-all text-slate-800 dark:text-slate-200">
                {revealedKey.key}
              </code>
              <button
                onClick={copyKey}
                className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t('copied') : t('copy')}
              </button>
              <button
                onClick={() => setRevealedKey(null)}
                className="h-8 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shrink-0"
              >
                {t('done')}
              </button>
            </div>
          </div>
        )}

        {/* Create form */}
        {creating && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('createTitle')}</p>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{t('keyName')}</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t('keyNamePlaceholder')}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{t('expiresAt')} ({t('optional')})</label>
              <input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setCreating(false); setNewName(''); setNewExpiry(''); }}
                className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!newName.trim() || createMut.isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                {t('generate')}
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2].map(i => <div key={i} className="h-16 animate-pulse bg-slate-50 dark:bg-slate-800/50" />)}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
                <Key className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noKeys')}</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs">{t('noKeysDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {keys.map(k => (
                <div key={k.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{k.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{k.key_prefix}…</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400">{t('created')} {fmtDate(k.created_at)}</span>
                      {k.last_used_at && <span className="text-[10px] text-slate-400">{t('lastUsed')} {fmtDate(k.last_used_at)}</span>}
                      {k.expires_at && <span className="text-[10px] text-amber-500">{t('expires')} {fmtDate(k.expires_at)}</span>}
                    </div>
                  </div>
                  {confirmRevoke === k.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => revokeMut.mutate(k.id)}
                        disabled={revokeMut.isPending}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold disabled:opacity-50 transition-colors"
                      >
                        {revokeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {t('confirmRevoke')}
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(k.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors shrink-0"
                      title={t('revoke')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('securityNote')}</p>
      </div>
    </FullPageShell>
  );
}
