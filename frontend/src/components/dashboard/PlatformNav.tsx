'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Newspaper, CreditCard, User,
  Bell, LogOut, Zap, Plus, ChevronDown,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business',
};

export function PlatformNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const plan = user?.plan ?? 'free';

  const nav = [
    { href: `/${locale}/dashboard`, icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: `/${locale}/blogs`,     icon: Newspaper,       label: 'Mes blogs' },
    { href: `/${locale}/subscription`, icon: CreditCard,   label: 'Abonnement' },
  ];

  const bottom = [
    { href: `/${locale}/notifications`, icon: Bell, label: 'Notifications', soon: true },
    { href: `/${locale}/profile`,       icon: User, label: 'Profil',         soon: true },
  ];

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="h-screen w-[240px] shrink-0 flex flex-col border-r border-slate-100 bg-white overflow-hidden">

      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">N</div>
        <span className="font-extrabold text-sm tracking-tight text-slate-900">NexusBlog</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all',
              isActive(item.href, item.exact)
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            )}>
            <item.icon className={cn('h-4 w-4 shrink-0', isActive(item.href, item.exact) ? 'text-blue-600' : 'text-slate-400')} />
            {item.label}
            {isActive(item.href, item.exact) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
          </Link>
        ))}

        <Link href={`/${locale}/blogs/new`}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all mt-1',
            isActive(`/${locale}/blogs/new`)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          )}>
          <Plus className="h-4 w-4 text-slate-400 shrink-0" />
          Nouveau blog
        </Link>

        <div className="pt-3 mt-3 border-t border-slate-100">
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Compte</p>
          {bottom.map(item => (
            <div key={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 cursor-not-allowed">
              <item.icon className="h-4 w-4 shrink-0 text-slate-200" />
              {item.label}
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wider border border-slate-200 text-slate-300 px-1.5 py-0.5 rounded">Bientôt</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 p-3 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-slate-700">{PLAN_LABELS[plan] ?? plan}</span>
          </div>
          <Link href={`/${locale}/subscription`}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full transition-colors">
            Améliorer
          </Link>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
            {user ? getInitials(user.display_name ?? user.email).slice(0, 2) : 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-slate-700 truncate leading-none group-hover:text-red-600 transition-colors">
              {user?.display_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email}</p>
          </div>
          <LogOut className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity" />
        </button>
      </div>
    </aside>
  );
}
