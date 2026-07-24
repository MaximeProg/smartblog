'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Shield, ShieldCheck, X, Mail,
  Clock, Globe, AlertCircle, RefreshCw, Loader2, Layers,
} from 'lucide-react';
import { superadminApi, type UserAdminView } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/use-toast';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

// ── Confirm modal ──────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, isPending, t }: {
  message: string; onConfirm: () => void; onCancel: () => void;
  isPending?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border p-5 shadow-2xl" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--sa-text)' }}>{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 h-9 rounded-xl border text-[12px] font-semibold transition-colors hover:bg-[var(--sa-surface)] disabled:opacity-50"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const t  = useTranslations('superAdmin');
  const tu = useTranslations('superAdmin.users');
  const { user: me }  = useAuthStore();
  const { toast }     = useToast();
  const qc            = useQueryClient();

  const [q, setQ]       = useState('');
  const [search, setSrch] = useState('');  // committed search (on Enter)
  const [page, setPage] = useState(1);
  const [selected, setSel] = useState<UserAdminView | null>(null);
  const [confirm, setCfm]  = useState<{ msg: string; fn: () => void; pending?: boolean } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['superadmin-users', search, page],
    queryFn:  () => superadminApi.listUsers({
      q: search || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: userTenantsData, isLoading: userTenantsLoading } = useQuery({
    queryKey: ['superadmin-user-tenants', selected?.id],
    queryFn: () => superadminApi.getUserTenants(selected!.id).then(r => r.data),
    enabled: !!selected,
  });
  const userTenants = userTenantsData?.items ?? [];

  const mutMake = useMutation({
    mutationFn: (id: string) => superadminApi.makeSuperAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-users'] });
      setSel(null);
      setCfm(null);
      toast({ title: '✓', description: tu('actions.makeSuperAdmin') });
    },
  });
  const mutRevoke = useMutation({
    mutationFn: (id: string) => superadminApi.revokeSuperAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-users'] });
      setSel(null);
      setCfm(null);
      toast({ title: '✓', description: tu('actions.revokeSuperAdmin') });
    },
  });

  const mutPending = mutMake.isPending || mutRevoke.isPending;

  function fmtDate(s: string | null) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtProvider(p: string) {
    if (p === 'google.com') return 'Google';
    if (p === 'github.com') return 'GitHub';
    return tu('providerEmail');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSrch(q);
    setPage(1);
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{t('nav.clients')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tu('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {isLoading ? t('common.loading') : tu('subtitle', { count: total })}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[12px] font-semibold transition-all hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--sa-text-3)' }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder={tu('searchPlaceholder')}
            className="h-9 pl-9 pr-4 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30 w-64"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)', background: 'var(--sa-surface)' }}
          />
        </div>
        <button type="submit"
          className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white transition-colors"
          style={{ background: '#6366f1' }}>
          {t('common.search') ?? 'Search'}
        </button>
        {search && (
          <button type="button" onClick={() => { setQ(''); setSrch(''); setPage(1); }}
            className="h-9 px-3 rounded-xl border text-[12px] font-semibold transition-colors hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Error */}
      {isError && (
        <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[12px]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {t('common.error')}
          <button onClick={() => refetch()} className="ml-auto underline">{t('common.retry')}</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        {/* Header row */}
        <div className="grid grid-cols-[1fr_70px_60px_100px_90px_120px_60px_110px] gap-3 px-5 py-2.5 border-b"
          style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
          {[tu('table.user'), tu('table.plan'), tu('table.blogs'), tu('table.provider'), tu('table.twoFA'), tu('table.joined'), tu('roleColumnHeader'), tu('table.actions')].map((h, i) => (
            <span key={i} className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.noResults')}</div>
        ) : (
          <div className="divide-y divide-[var(--sa-divider)]">
            {users.map(u => {
              const isMe = u.id === me?.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSel(u)}
                  className="grid grid-cols-[1fr_70px_60px_100px_90px_120px_60px_110px] gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[var(--sa-surface)]"
                >
                  {/* User */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-black" style={{ color: '#6366f1' }}>
                        {(u.display_name ?? u.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--sa-text)' }}>
                          {u.display_name ?? '—'}
                        </p>
                        {isMe && <span className="text-[8px] font-bold" style={{ color: '#6366f1' }}>{tu('you')}</span>}
                        {u.is_super_admin && <ShieldCheck className="h-3 w-3 shrink-0" style={{ color: '#6366f1' }} />}
                      </div>
                      <p className="text-[9px] truncate" style={{ color: 'var(--sa-text-3)' }}>{u.email}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <span className="text-[9px] font-bold self-center capitalize px-1.5 py-0.5 rounded-md w-fit"
                    style={{ background: 'var(--sa-surface)', border: '1px solid var(--sa-border)', color: 'var(--sa-text-2)' }}>
                    {u.plan}
                  </span>

                  {/* Blogs */}
                  <span className="text-[11px] font-black font-mono self-center" style={{ color: 'var(--sa-text-2)' }}>
                    {u.blog_count}
                  </span>

                  {/* Provider */}
                  <span className="text-[10px] self-center" style={{ color: 'var(--sa-text-2)' }}>
                    {fmtProvider(u.sign_in_provider)}
                  </span>

                  {/* 2FA */}
                  <span className={`text-[9px] font-bold self-center ${u.two_fa_enabled ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {u.two_fa_enabled ? tu('twoFAEnabled') : tu('twoFADisabled')}
                  </span>

                  {/* Joined */}
                  <span className="text-[9px] font-mono self-center" style={{ color: 'var(--sa-text-3)' }}>
                    {fmtDate(u.created_at)}
                  </span>

                  {/* Role badge */}
                  <div className="self-center">
                    {u.is_super_admin && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full border"
                        style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.3)' }}>
                        SA
                      </span>
                    )}
                  </div>

                  {/* Actions inline */}
                  <div className="flex items-center gap-1 self-center" onClick={e => e.stopPropagation()}>
                    {!isMe && !u.is_super_admin && (
                      <button
                        disabled={mutPending}
                        onClick={() => setCfm({
                          msg: tu('confirmMakeSuperAdmin'),
                          fn: () => mutMake.mutate(u.id),
                        })}
                        className="h-7 px-2 flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                        title={tu('actions.makeSuperAdmin')}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span className="hidden lg:inline">{tu('superAdminBadge')}</span>
                      </button>
                    )}
                    {!isMe && u.is_super_admin && (
                      <button
                        disabled={mutPending}
                        onClick={() => setCfm({
                          msg: tu('confirmRevokeSuperAdmin'),
                          fn: () => mutRevoke.mutate(u.id),
                        })}
                        className="h-7 px-2 flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 bg-amber-500/10 text-amber-500"
                        title={tu('actions.revokeSuperAdmin')}
                      >
                        <Shield className="h-3 w-3" />
                        <span className="hidden lg:inline">{tu('revokeButtonShort')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = `mailto:${u.email}`}
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--sa-surface)]"
                      style={{ color: 'var(--sa-text-3)' }}
                      title={tu('actions.sendMessage')}
                    >
                      <Mail className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => { setPage(p); }} loading={isLoading} />
      </div>

      {/* User detail drawer */}
      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 shadow-2xl border-l flex flex-col"
          style={{ background: 'var(--sa-sidebar)', borderColor: 'var(--sa-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
            <h3 className="text-[13px] font-black" style={{ color: 'var(--sa-text)' }}>{selected.display_name ?? selected.email}</h3>
            <button onClick={() => setSel(null)}
              className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-[var(--sa-surface)]"
              style={{ color: 'var(--sa-text-3)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <span className="text-[18px] font-black" style={{ color: '#6366f1' }}>
                  {(selected.display_name ?? selected.email)[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{selected.display_name ?? '—'}</p>
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{selected.email}</p>
                {selected.is_super_admin && (
                  <span className="text-[8px] font-black flex items-center gap-1 mt-0.5" style={{ color: '#6366f1' }}>
                    <ShieldCheck className="h-2.5 w-2.5" /> {tu('superAdminBadge')}
                  </span>
                )}
              </div>
            </div>

            {[
              { icon: Layers, label: tu('table.plan'),     value: selected.plan },
              { icon: Globe,  label: tu('table.provider'), value: fmtProvider(selected.sign_in_provider) },
              { icon: Shield, label: tu('table.twoFA'),    value: selected.two_fa_enabled ? tu('twoFAEnabled') : tu('twoFADisabled') },
              { icon: Clock,  label: tu('table.joined'),   value: fmtDate(selected.created_at) },
              { icon: Clock,  label: tu('table.lastLogin'),value: fmtDate(selected.last_login_at) },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 text-[11px]">
                <row.icon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
                <span style={{ color: 'var(--sa-text-3)' }}>{row.label}</span>
                <span className="ml-auto font-semibold capitalize" style={{ color: 'var(--sa-text-2)' }}>{row.value}</span>
              </div>
            ))}

            {/* Blogs owned by this user */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--sa-border)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2 mt-2" style={{ color: 'var(--sa-text-3)' }}>
                {tu('blogsSection', { count: userTenants.length })}
              </p>
              {userTenantsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
              ) : userTenants.length === 0 ? (
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{tu('noBlogs')}</p>
              ) : (
                <div className="space-y-1.5">
                  {userTenants.map(bt => (
                    <div key={bt.id} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5"
                      style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold truncate" style={{ color: 'var(--sa-text)' }}>{bt.name}</p>
                        <p className="text-[8.5px] truncate" style={{ color: 'var(--sa-text-3)' }}>{bt.slug} · {bt.role.toLowerCase()}</p>
                      </div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md capitalize shrink-0"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        {bt.plan}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: 'var(--sa-border)' }}>
            {selected.id !== me?.id && !selected.is_super_admin && (
              <button
                disabled={mutPending}
                onClick={() => setCfm({ msg: tu('confirmMakeSuperAdmin'), fn: () => mutMake.mutate(selected.id) })}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-white text-[12px] font-bold transition-colors disabled:opacity-70"
                style={{ background: '#6366f1' }}
              >
                {mutMake.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {tu('actions.makeSuperAdmin')}
              </button>
            )}
            {selected.id !== me?.id && selected.is_super_admin && (
              <button
                disabled={mutPending}
                onClick={() => setCfm({ msg: tu('confirmRevokeSuperAdmin'), fn: () => mutRevoke.mutate(selected.id) })}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold transition-colors disabled:opacity-70"
              >
                {mutRevoke.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                {tu('actions.revokeSuperAdmin')}
              </button>
            )}
            <a
              href={`mailto:${selected.email}`}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl border text-[12px] font-semibold transition-all hover:bg-[var(--sa-surface)]"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}
            >
              <Mail className="h-3.5 w-3.5" /> {tu('actions.sendMessage')}
            </a>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          isPending={mutPending}
          onConfirm={confirm.fn}
          onCancel={() => { if (!mutPending) setCfm(null); }}
          t={t}
        />
      )}
    </div>
  );
}
