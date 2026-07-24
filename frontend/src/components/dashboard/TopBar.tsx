'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, User, ShieldCheck, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

function UserAvatar({ avatarUrl, initials }: { avatarUrl?: string | null; initials: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="h-7 w-7 rounded-full object-cover shrink-0 shadow-sm"
      />
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

export function TopBar() {
  const params   = useParams();
  const locale   = params.locale as string;
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { openSidebar } = useUIStore();
  const t = useTranslations('nav');

  const segLabels: Record<string, string> = {
    dashboard:     t('dashboard'),
    blogs:         t('myBlogs'),
    subscription:  t('subscription'),
    profile:       t('profile'),
    notifications: t('notifications'),
    affiliate:     t('affiliate'),
    'blogs/new':   t('newBlog'),
  };

  const segments  = pathname.split('/').filter(Boolean);
  const lastTwo   = segments.slice(-2).join('/');
  const lastSeg   = segments[segments.length - 1];
  const pageTitle = segLabels[lastTwo] ?? segLabels[lastSeg] ?? t('dashboard');

  const initials    = user ? getInitials(user.display_name ?? user.email).slice(0, 2) : t('user').slice(0, 1).toUpperCase();
  const displayName = user?.display_name ?? user?.email?.split('@')[0] ?? t('user');

  const { data: notifCount } = useQuery<{ unread: number; total: number }>({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await authApi.notifications();
      let readIds: Set<string> = new Set();
      try {
        readIds = new Set(JSON.parse(localStorage.getItem('smarterbloggers:notif-read') ?? '[]') as string[]);
      } catch { /* ignore */ }
      const unread = data.filter((n: { id: string; read: boolean }) => !n.read && !readIds.has(n.id)).length;
      return { unread, total: data.length };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const unread = notifCount?.unread ?? 0;

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  return (
    <header className="h-[57px] shrink-0 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 z-10">

      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={openSidebar}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle />

        {/* Bell avec badge */}
        <Link
          href={`/${locale}/notifications`}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-sm">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 pl-2 pr-3 ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
            <UserAvatar avatarUrl={user?.avatar_url} initials={initials} />
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate hidden sm:block">
              {displayName}
            </span>
            <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2.5">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/profile`} className="gap-2.5 cursor-pointer">
                <User className="h-3.5 w-3.5 text-slate-500" />
                {t('profile')}
              </Link>
            </DropdownMenuItem>
            {user?.is_super_admin && (
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/superadmin`} className="gap-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('adminConsole')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
