'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Newspaper, CreditCard, Receipt,
  Bell, Settings, UserCircle, LogOut, Zap, Plus,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPlanConfig } from '@/lib/plans';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';

interface PlatformSidebarProps {
  locale: string;
}

export function PlatformSidebar({ locale }: PlatformSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();
  const t = useTranslations('platformNav');

  const plan       = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);

  const primaryItems = [
    { href: `/${locale}/dashboard`, icon: LayoutDashboard, key: 'dashboard' },
    { href: `/${locale}/blogs`,     icon: Newspaper,       key: 'myBlogs' },
  ] as const;

  const accountItems = [
    { href: `/${locale}/subscription`,  icon: CreditCard,  key: 'subscription',  soon: false },
    { href: `/${locale}/billing`,        icon: Receipt,     key: 'billing',       soon: true },
    { href: `/${locale}/notifications`,  icon: Bell,        key: 'notifications', soon: true },
    { href: `/${locale}/profile`,        icon: UserCircle,  key: 'profile',       soon: true },
    { href: `/${locale}/settings`,       icon: Settings,    key: 'settings',      soon: true },
  ] as const;

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  const NavLink = ({
    href, icon: Icon, labelKey, soon = false,
  }: { href: string; icon: React.ElementType; labelKey: string; soon?: boolean }) => {
    const isActive = href === `/${locale}/dashboard`
      ? pathname === href
      : pathname.startsWith(href);
    return (
      <Link
        href={soon ? '#' : href}
        aria-disabled={soon}
        className={cn(
          'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-100 mt-0.5',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
            : soon
            ? 'text-slate-300 dark:text-zinc-600 cursor-default'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
        )}
      >
        <Icon className={cn(
          'h-[15px] w-[15px] shrink-0',
          isActive ? 'text-blue-600 dark:text-blue-400' : soon ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-200'
        )} />
        <span className="flex-1 leading-none">{t(labelKey as any)}</span>
        {soon && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 dark:text-zinc-600 border border-slate-200 dark:border-zinc-700 rounded px-1 py-0.5">
            {t('soon')}
          </span>
        )}
        {isActive && !soon && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
      </Link>
    );
  };

  return (
    <aside className="h-screen w-[260px] shrink-0 flex flex-col border-r border-slate-100 bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden z-30">

      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 px-4">
        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
          N
        </div>
        <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
          NexusBlog
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {/* Primary */}
        <div className="pb-3">
          {primaryItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} labelKey={item.key} />
          ))}

          {/* Create blog CTA */}
          <Link
            href={`/${locale}/blogs/new`}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-100 mt-0.5',
              pathname.startsWith(`/${locale}/blogs/new`)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
            )}
          >
            <Plus className="h-[15px] w-[15px] shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-200" />
            <span className="flex-1 leading-none">{t('createBlog')}</span>
          </Link>
        </div>

        {/* Account */}
        <div className="pb-2">
          <p className="px-2.5 mb-1 mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 select-none">
            {t('sectionAccount')}
          </p>
          {accountItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} labelKey={item.key} soon={item.soon} />
          ))}
        </div>
      </nav>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-100 dark:border-zinc-800 p-3 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              {planConfig.label}
            </span>
          </div>
          <Link
            href={`/${locale}/subscription`}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors"
          >
            {t('upgrade')}
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all group"
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px] bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold">
              {user ? getInitials(user.display_name ?? user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold truncate text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-none">
              {user?.display_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate leading-none mt-0.5">
              {user?.email}
            </p>
          </div>
          <LogOut className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
        </button>
      </div>
    </aside>
  );
}
