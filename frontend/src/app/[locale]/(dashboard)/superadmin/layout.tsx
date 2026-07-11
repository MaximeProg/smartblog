'use client';

import { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, BookOpen,
  ShieldCheck, LogOut, Activity, Megaphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();

  useEffect(() => {
    if (user && !user.is_super_admin) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, router, locale]);

  if (!user?.is_super_admin) return null;

  const NAV = [
    { href: `/${locale}/superadmin`,            label: 'Vue d\'ensemble',  icon: LayoutDashboard, exact: true },
    { href: `/${locale}/superadmin/tenants`,    label: 'Blogs / Tenants',  icon: Building2 },
    { href: `/${locale}/superadmin/users`,      label: 'Utilisateurs',     icon: Users },
    { href: `/${locale}/superadmin/ads`,        label: 'Publicités',       icon: Megaphone },
    { href: `/${locale}/superadmin/accounting`, label: 'Comptabilité',     icon: BookOpen },
  ];

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── Admin Sidebar — dark theme ── */}
      <aside className="w-[240px] shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 h-full overflow-y-auto">

        {/* Header */}
        <div className="h-[60px] flex items-center gap-3 px-4 border-b border-slate-800 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/50">
            <ShieldCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-black text-white tracking-tight leading-none">Admin Console</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-mono">NexusBlog Platform</p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-900/60">
          <div className="relative shrink-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 tracking-wide">SYSTÈME OPÉRATIONNEL</span>
          <Activity className="h-3 w-3 text-emerald-500 ml-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600 select-none">
            Gestion Plateforme
          </p>
          {NAV.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                  active
                    ? 'bg-rose-600/15 text-rose-400 border border-rose-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent',
                )}
              >
                <item.icon className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-rose-500' : 'text-slate-500',
                )} />
                <span className="flex-1">{item.label}</span>
                {active && <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer — user info + exit */}
        <div className="shrink-0 border-t border-slate-800 p-3 space-y-2">
          {/* Current user badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60">
            <div className="h-6 w-6 rounded-full bg-rose-600/30 border border-rose-600/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3 w-3 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-300 truncate leading-none">
                {user.display_name ?? user.email?.split('@')[0]}
              </p>
              <p className="text-[9px] text-rose-400 font-semibold mt-0.5 leading-none uppercase tracking-wide">Super Admin</p>
            </div>
          </div>

          {/* Exit admin mode */}
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[12px] font-semibold transition-all group border border-slate-700 hover:border-slate-600"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0 rotate-180" />
            <span className="flex-1">Quitter le mode admin</span>
          </Link>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top admin bar */}
        <div className="h-[60px] shrink-0 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/15 border border-rose-600/20">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Mode Admin</span>
            </div>
            <span className="text-[12px] text-slate-500">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Connecté en tant que</span>
            <span className="text-[11px] font-bold text-rose-400">{user.email}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
}
