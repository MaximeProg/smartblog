'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Tag, RefreshCw, Plus, X, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { superadminApi, type SATemplateCategory, type SATemplateCategoryCreateBody } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

// ── Create form — outside component to avoid remount ─────────────
function CreateModal({ onClose, onSave, isPending }: { onClose: () => void; onSave: (body: SATemplateCategoryCreateBody) => void; isPending?: boolean }) {
  const tc = useTranslations('superAdmin.templateCategories');
  const t  = useTranslations('superAdmin');
  const [form, setForm] = useState<SATemplateCategoryCreateBody>({ name: '', slug: '', description: '', sort_order: 0 });

  const inputCls = "w-full h-9 px-3 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30";
  const inputStyle = { borderColor: 'var(--sa-border)', color: 'var(--sa-text)' } as React.CSSProperties;

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
          <h2 className="text-[14px] font-black" style={{ color: 'var(--sa-text)' }}>{tc('createTitle')}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--sa-surface)]" style={{ color: 'var(--sa-text-3)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--sa-text-2)' }}>{tc('fieldName')}</label>
            <input value={form.name}
              onChange={e => setForm(s => ({ ...s, name: e.target.value, slug: autoSlug(e.target.value) }))}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--sa-text-2)' }}>{tc('fieldSlug')}</label>
            <input value={form.slug}
              onChange={e => setForm(s => ({ ...s, slug: e.target.value }))}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--sa-text-2)' }}>{tc('fieldDescription')}</label>
            <input value={form.description ?? ''} onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--sa-border)' }}>
          <button onClick={onClose} disabled={isPending} className="h-9 px-4 rounded-lg border text-[13px] font-medium hover:bg-[var(--sa-surface)] disabled:opacity-40"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}>
            {t('common.cancel')}
          </button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.slug.trim() || isPending}
            className="h-9 px-5 rounded-lg text-[13px] font-bold text-white disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: '#6366f1' }}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {tc('createBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export default function TemplateCategoriesPage() {
  const t  = useTranslations('superAdmin');
  const tc = useTranslations('superAdmin.templateCategories');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-template-categories'],
    queryFn: () => superadminApi.listTemplateCategories().then(r => r.data),
  });

  const { mutate: toggleCategory, isPending: toggling } = useMutation({
    mutationFn: (id: string) => superadminApi.toggleTemplateCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-template-categories'] }); toast({ title: tc('toggled') }); },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  const { mutate: createCategory, isPending: creating } = useMutation({
    mutationFn: (body: SATemplateCategoryCreateBody) => superadminApi.createTemplateCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-template-categories'] });
      toast({ title: tc('created') });
      setShowCreate(false);
    },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  const categories = data?.categories ?? [];

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tc('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tc('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tc('subtitle', { count: categories.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-bold text-white"
            style={{ background: '#6366f1' }}>
            <Plus className="h-3.5 w-3.5" /> {tc('newCategory')}
          </button>
          <button onClick={() => refetch()} className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Tag className="h-10 w-10" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tc('emptyTitle')}</p>
            <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{tc('emptyDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sa-border)', background: 'var(--sa-surface)' }}>
                  {[tc('colName'), tc('colSlug'), tc('colTemplates'), tc('colStatus'), t('common.actions')].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: SATemplateCategory) => (
                  <tr key={cat.id} className="hover:bg-[var(--sa-surface)] transition-colors" style={{ borderBottom: '1px solid var(--sa-border)' }}>
                    <td className="px-5 py-3">
                      <p className="font-semibold" style={{ color: 'var(--sa-text)' }}>{cat.name}</p>
                      {cat.description && <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{cat.description}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{cat.slug}</td>
                    <td className="px-5 py-3 font-bold tabular-nums" style={{ color: 'var(--sa-text-2)' }}>{cat.template_count}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                        {cat.is_active ? tc('active') : tc('inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleCategory(cat.id)} disabled={toggling}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[11px] font-medium hover:bg-[var(--sa-surface)] transition-colors disabled:opacity-50"
                        style={{ borderColor: 'var(--sa-border)', color: cat.is_active ? 'var(--sa-text-3)' : '#10b981' }}>
                        {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : cat.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {cat.is_active ? tc('deactivate') : tc('activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => { if (!creating) setShowCreate(false); }}
          onSave={body => createCategory(body)}
          isPending={creating}
        />
      )}
    </div>
  );
}
