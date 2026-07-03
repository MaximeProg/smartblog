'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, User, CreditCard } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';
import { ThemeToggle } from '@/components/ThemeToggle';

const SEG_LABELS: Record<string, string> = {
  dashboard:     'Dashboard',
  blogs:         'Mes blogs',
  subscription:  'Abonnement',
  profile:       'Profil',
  notifications: 'Notifications',
  onboarding:    'Créer un blog',
};

export function TopBar() {
  const params   = useParams();
  const locale   = params.locale as string;
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const segments  = pathname.split('/').filter(Boolean);
  const lastSeg   = segments[segments.length - 1];
  const pageTitle = SEG_LABELS[lastSeg] ?? 'Dashboard';

  const initials    = user ? getInitials(user.display_name ?? user.email).slice(0, 2) : 'U';
  const displayName = user?.display_name ?? user?.email?.split('@')[0] ?? 'Utilisateur';

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  return (
    <header className="h-[57px] shrink-0 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 z-10">

      <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">{pageTitle}</h1>

      <div className="flex items-center gap-1">

        <ThemeToggle />

        <Link
          href={`/${locale}/notifications`}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 pl-2 pr-3 ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
              {initials}
            </div>
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
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/subscription`} className="gap-2.5 cursor-pointer">
                <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                Abonnement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
