'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Layout, RefreshCw, Eye, EyeOff, Star, Upload,
  X, FileArchive, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { superadminApi, type SATemplate } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

// Accent colors matching TEMPLATE_OPTIONS in blogs/new/page.tsx
const ACCENT: Record<string, string> = {
  editorial: '#18181b',
  magazine:  '#e11d48',
  creative:  '#7c3aed',
  luminary:  '#b8960c',
  corporate: '#1d4ed8',
};

// ── Upload Modal ──────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const t  = useTranslations('superAdmin');
  const tt = useTranslations('superAdmin.templates');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (f: File) => superadminApi.uploadTemplate(f).then(r => r.data),
    onSuccess: (data) => {
      toast({ title: tt('uploadSuccess', { name: data.name }) });
      onUploaded();
      onClose();
    },
    onError: (err: any) => {
      toast({ title: getErrorMessage(err, t('common.error')), variant: 'destructive' });
    },
  });

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.zip')) setFile(f);
    else toast({ title: tt('onlyZip'), variant: 'destructive' });
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
          <h2 className="text-[14px] font-black" style={{ color: 'var(--sa-text)' }}>{tt('uploadTitle')}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--sa-surface)]" style={{ color: 'var(--sa-text-3)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div className="px-5 py-5">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{
              borderColor: dragging ? '#6366f1' : file ? '#10b981' : 'var(--sa-border)',
              background: dragging ? '#6366f1/5' : 'transparent',
            }}>
            <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={handlePick} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p className="text-[13px] font-semibold text-emerald-500">{file.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>
                  {(file.size / 1024).toFixed(0)} KB — {tt('clickToChange')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileArchive className="h-10 w-10" style={{ color: 'var(--sa-text-3)' }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tt('dropZip')}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tt('dropZipHint')}</p>
                </div>
              </div>
            )}
          </div>

          {/* ZIP format note */}
          <div className="mt-3 rounded-lg px-3 py-2.5 text-[10px]" style={{ background: 'var(--sa-surface)', color: 'var(--sa-text-3)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--sa-text-2)' }}>{tt('zipFormat')}</p>
            <p className="font-mono">template.json — name, description, theme_base, config</p>
            <p className="font-mono mt-0.5">preview.png (optional) — thumbnail preview</p>
            <p className="mt-1">{tt('themeBaseNote', { themes: 'editorial · magazine · creative · luminary · corporate' })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--sa-border)' }}>
          <button onClick={onClose} className="h-9 px-4 rounded-lg border text-[13px] font-medium hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => file && upload(file)}
            disabled={!file || isPending}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg text-[13px] font-bold text-white disabled:opacity-40"
            style={{ background: '#6366f1' }}>
            {isPending
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Upload className="h-3.5 w-3.5" />}
            {isPending ? t('common.loading') : tt('uploadBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template row ──────────────────────────────────────────────────
function TemplateRow({ tpl, onToggle, toggling }: { tpl: SATemplate; onToggle: (id: string) => void; toggling?: boolean }) {
  const tt = useTranslations('superAdmin.templates');
  const accent = tpl.accent ?? ACCENT[tpl.theme] ?? '#64748b';

  return (
    <tr className="hover:bg-[var(--sa-surface)] transition-colors" style={{ borderBottom: '1px solid var(--sa-border)' }}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {tpl.thumbnail_url ? (
            <img src={tpl.thumbnail_url} alt={tpl.name}
              className="h-10 w-16 rounded object-cover shrink-0"
              style={{ border: '1px solid var(--sa-border)' }} />
          ) : (
            <div className="h-10 w-16 rounded shrink-0 flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
              <Layout className="h-4 w-4" style={{ color: accent }} />
            </div>
          )}
          <div>
            <p className="text-[12px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tpl.name}</p>
            {tpl.description && (
              <p className="text-[10px] mt-0.5 max-w-xs truncate" style={{ color: 'var(--sa-text-3)' }}>{tpl.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
          style={{ background: `${accent}15`, color: accent }}>
          {tpl.is_builtin ? tpl.theme : `${tpl.theme} (base)`}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {tpl.is_featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tpl.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
          {tpl.is_active ? tt('active') : tt('inactive')}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <button onClick={() => onToggle(tpl.id)} disabled={toggling}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[11px] font-medium hover:bg-[var(--sa-surface)] transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--sa-border)', color: tpl.is_active ? 'var(--sa-text-3)' : '#10b981' }}>
          {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : tpl.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {tpl.is_active ? tt('deactivate') : tt('activate')}
        </button>
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const t  = useTranslations('superAdmin');
  const tt = useTranslations('superAdmin.templates');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sa-templates'],
    queryFn: () => superadminApi.listTemplates().then(r => r.data),
  });

  const { mutate: toggleTemplate, isPending: toggling } = useMutation({
    mutationFn: (id: string) => superadminApi.toggleTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-templates'] }); toast({ title: tt('toggled') }); },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  const builtIn = data?.templates.filter(t => t.is_builtin)  ?? [];
  const custom  = data?.templates.filter(t => !t.is_builtin) ?? [];
  const activeCount = (data?.templates ?? []).filter(t => t.is_active).length;

  const cols = [tt('colName'), tt('colTheme'), tt('colFeatured'), tt('colStatus'), t('common.actions')];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layout className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tt('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tt('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tt('subtitle', { count: activeCount })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-bold text-white"
            style={{ background: '#6366f1' }}>
            <Upload className="h-3.5 w-3.5" /> {tt('uploadBtn')}
          </button>
          <button onClick={() => refetch()} className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-red-500 text-[12px]"
          style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)' }}>
          <AlertCircle className="h-4 w-4 shrink-0" /> {t('common.error')}
          <button onClick={() => refetch()} className="underline ml-1">{t('common.retry')}</button>
        </div>
      )}

      {/* ── Built-in themes ── */}
      <section className="mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sa-text-3)' }}>
          {tt('sectionBuiltIn')} <span className="ml-1 normal-case font-normal">({builtIn.length})</span>
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-36">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sa-border)', background: 'var(--sa-surface)' }}>
                    {cols.map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {builtIn.map(tpl => (
                    <TemplateRow key={tpl.id} tpl={tpl} onToggle={toggleTemplate} toggling={toggling} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: 'var(--sa-text-3)' }}>
          {tt('managedByCode')}
        </p>
      </section>

      {/* ── Custom templates ── */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sa-text-3)' }}>
          {tt('sectionCustom')} <span className="ml-1 normal-case font-normal">({custom.length})</span>
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
          {!isLoading && custom.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <FileArchive className="h-10 w-10" style={{ color: 'var(--sa-text-3)' }} />
              <p className="text-[13px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tt('emptyCustomTitle')}</p>
              <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{tt('emptyCustomDesc')}</p>
              <button onClick={() => setShowUpload(true)}
                className="mt-1 flex items-center gap-1.5 h-8 px-4 rounded-lg text-[11px] font-bold text-white"
                style={{ background: '#6366f1' }}>
                <Upload className="h-3 w-3" /> {tt('uploadBtn')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sa-border)', background: 'var(--sa-surface)' }}>
                    {cols.map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {custom.map(tpl => (
                    <TemplateRow key={tpl.id} tpl={tpl} onToggle={toggleTemplate} toggling={toggling} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => qc.invalidateQueries({ queryKey: ['sa-templates'] })}
        />
      )}
    </div>
  );
}
