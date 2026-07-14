'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Settings, Globe, Key, Plug, CheckCircle, AlertTriangle, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { superadminApi, type SAPlatformSettings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const t  = useTranslations('superAdmin');
  const ts = useTranslations('superAdmin.settings');
  const { toast } = useToast();
  const [tab, setTab] = useState('general');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-settings'],
    queryFn: () => superadminApi.getSettings().then(r => r.data as SAPlatformSettings),
  });

  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [registrations, setRegistrations] = useState<boolean | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const maintenanceValue    = maintenance    ?? data?.general.maintenance_mode    ?? false;
  const registrationsValue  = registrations  ?? data?.general.registrations_open  ?? true;

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (body: Record<string, unknown>) => superadminApi.updateSettings(body),
    onSuccess: () => { toast({ title: ts('saved') }); refetch(); },
    onError:   () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const TABS = [
    { id: 'general',      label: ts('tabs.general'),      icon: Globe },
    { id: 'integrations', label: ts('tabs.integrations'), icon: Plug },
  ];

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-500/30'}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    );
  }

  function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start justify-between gap-6 py-4" style={{ borderBottom: '1px solid var(--sa-border)' }}>
        <div>
          <p className="text-[12px] font-semibold" style={{ color: 'var(--sa-text)' }}>{label}</p>
          {hint && <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  function StatusBadge({ ok }: { ok: boolean }) {
    return ok
      ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500"><CheckCircle className="h-3 w-3" /> {ts('configured')}</span>
      : <span className="inline-flex items-center gap-1 text-[10px] text-amber-500"><AlertTriangle className="h-3 w-3" /> {ts('notConfigured')}</span>;
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ts('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ts('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ts('subtitle')}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--sa-border)' }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold transition-colors"
            style={{
              color: tab === tb.id ? 'var(--sa-text)' : 'var(--sa-text-3)',
              borderBottom: tab === tb.id ? '2px solid #6366f1' : '2px solid transparent',
            }}>
            <tb.icon className="h-3.5 w-3.5" /> {tb.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <div>
          {tab === 'general' && (
            <div className="rounded-xl border px-6" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
              <Field label={ts('field.maintenance')} hint={ts('field.maintenanceHint')}>
                <Toggle value={maintenanceValue} onChange={v => { setMaintenance(v); save({ maintenance_mode: v }); }} />
              </Field>
              <Field label={ts('field.registrations')} hint={ts('field.registrationsHint')}>
                <Toggle value={registrationsValue} onChange={v => { setRegistrations(v); save({ registrations_open: v }); }} />
              </Field>
              <Field label={ts('field.platformName')} hint={ts('field.platformNameHint')}>
                <input defaultValue={data?.general.platform_name ?? 'SmarterBloggers'}
                  onBlur={e => save({ platform_name: e.target.value })}
                  className="h-9 w-56 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
                  style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
              </Field>
              <Field label={ts('field.supportEmail')}>
                <input defaultValue={data?.general.support_email ?? ''}
                  type="email"
                  onBlur={e => save({ support_email: e.target.value })}
                  className="h-9 w-56 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
                  style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
              </Field>
              <div className="py-4">
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{ts('autoSaveNote')}</p>
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="space-y-3">
              {[
                { name: 'Stripe',     ok: data?.stripe.configured    ?? false, detail: data?.stripe.configured ? `Fee: ${data?.stripe.platform_fee_percent}%` : '' },
                { name: 'Cloudinary', ok: data?.cloudinary.configured ?? false, detail: data?.cloudinary.cloud_name ?? '' },
                { name: 'OpenAI',     ok: data?.ai.configured ?? false,        detail: data?.ai.model ?? '' },
              ].map(int => (
                <div key={int.name} className="flex items-center justify-between px-5 py-4 rounded-xl border"
                  style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--sa-text)' }}>{int.name}</p>
                    {int.detail && <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{int.detail}</p>}
                  </div>
                  <StatusBadge ok={int.ok} />
                </div>
              ))}
              <p className="text-[10px] px-1" style={{ color: 'var(--sa-text-3)' }}>{ts('envNote')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}