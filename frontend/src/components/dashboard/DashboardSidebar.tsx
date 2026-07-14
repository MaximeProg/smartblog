'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Newspaper, User, Bell, CreditCard, Gift,
  Plus, LogOut, Zap, X, ShieldCheck,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';

function UserAvatar({ avatarUrl, initials, size = 7 }: { avatarUrl?: string | null; initials: string; size?: number }) {
  const sz = `h-${size} w-${size}`;
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={`${sz} rounded-full object-cover shrink-0 shadow-sm`}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

export function DashboardSidebar() {
  const params   = useParams();
  const locale   = params.locale as string;
  const pathname = usePathname();
  const router   = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const { mobileSidebarOpen, closeSidebar } = useUIStore();
  const t  = useTranslations('nav');
  const td = useTranslations('dashboardPage');

  const plan     = user?.plan ?? 'free';
  const initials = user ? getInitials(user.display_name ?? user.email).slice(0, 2) : 'U';

  const PLAN_LABELS: Record<string, string> = {
    free: td('planFree'), starter: td('planStarter'), pro: td('planPro'), business: td('planBusiness'),
  };

  const MAIN_NAV = [
    { seg: 'dashboard', icon: LayoutDashboard, label: t('dashboard'), exact: true },
    { seg: 'blogs',     icon: Newspaper,       label: t('myBlogs') },
  ];

  const ACCOUNT_NAV = [
    { seg: 'profile',       icon: User,       label: t('profile') },
    { seg: 'notifications', icon: Bell,       label: t('notifications') },
    { seg: 'subscription',  icon: CreditCard, label: t('subscription') },
    { seg: 'affiliate',     icon: Gift,       label: t('affiliate') },
  ];

  const isActive = (seg: string, exact = false) => {
    const full = `/${locale}/${seg}`;
    return exact ? pathname === full : pathname.startsWith(`${full}`);
  };

  const itemCls = (seg: string, exact = false) =>
    cn(
      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
      isActive(seg, exact)
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
    );

  const iconCls = (seg: string, exact = false) =>
    cn(
      'h-4 w-4 shrink-0 transition-colors',
      isActive(seg, exact)
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
    );

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    queryClient.clear();
    closeSidebar();
    router.push(`/${locale}/login`);
  };

  const handleNavClick = () => closeSidebar();

  const sidebar = (
    <aside className="h-full w-[240px] flex flex-col border-r border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">

      {/* Logo + close (mobile only) */}
      <div className="h-[57px] shrink-0 flex items-center justify-between px-5 border-b border-slate-200/70 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">N</div>
          <span className="font-extrabold text-[14px] tracking-tight text-slate-900 dark:text-slate-100">SmarterBloggers</span>
        </div>
        <button
          onClick={closeSidebar}
          className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {MAIN_NAV.map(item => (
          <Link key={item.seg} href={`/${locale}/${item.seg}`} className={itemCls(item.seg, item.exact)} onClick={handleNavClick}>
            <item.icon className={iconCls(item.seg, item.exact)} />
            <span className="flex-1">{item.label}</span>
            {isActive(item.seg, item.exact) && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
          </Link>
        ))}

        <div className="pt-4">
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
            {t('account')}
          </p>
          {ACCOUNT_NAV.map(item => (
            <Link key={item.seg} href={`/${locale}/${item.seg}`} className={itemCls(item.seg)} onClick={handleNavClick}>
              <item.icon className={iconCls(item.seg)} />
              <span className="flex-1">{item.label}</span>
              {isActive(item.seg) && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
            </Link>
          ))}
        </div>

        {/* Admin Console entry — visible seulement pour is_super_admin */}
        {user?.is_super_admin && (
          <div className="pt-5">
            <Link
              href={`/${locale}/superadmin`}
              onClick={handleNavClick}
              className="mx-0.5 flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg shadow-rose-600/20 transition-all group"
            >
              <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-white leading-none">Admin Console</p>
                <p className="text-[10px] text-rose-200 mt-0.5 leading-none">Plateforme SmarterBloggers</p>
              </div>
              <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <span className="text-[10px] font-black text-white">→</span>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200/70 dark:border-slate-700 p-3 space-y-2">
        <Link
          href={`/${locale}/blogs/new`}
          onClick={handleNavClick}
          className="flex items-center justify-center gap-2 h-9 w-full rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[12.5px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('newBlog')}
        </Link>

        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{PLAN_LABELS[plan] ?? plan}</span>
          </div>
          <Link
            href={`/${locale}/subscription`}
            onClick={handleNavClick}
            className="text-[10px] font-bold text-blue-600 border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 px-2 py-0.5 rounded-full transition-colors"
          >
            {t('upgrade')}
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group"
        >
          <UserAvatar avatarUrl={user?.avatar_url} initials={initials} size={7} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 truncate leading-none group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {user?.display_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{user?.email}</p>
          </div>
          <LogOut className="h-3.5 w-3.5 shrink-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar: always visible on desktop, overlay on mobile when open */}
      <div className={cn(
        'shrink-0 h-full z-50',
        // Desktop: static in-flow
        'hidden lg:flex',
        // Mobile: fixed overlay when open
        mobileSidebarOpen && 'fixed inset-y-0 left-0 !flex',
      )}>
        {sidebar}
      </div>
    </>
  );
}
