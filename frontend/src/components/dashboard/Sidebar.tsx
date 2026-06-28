'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, FileText, Tags, MessageSquare, Image, Megaphone,
  BarChart2, Bot, Share2, Palette, Users, Settings,
  Plus, ChevronDown, ChevronRight, Mail, Globe, LogOut,
  ExternalLink, Zap, ArrowLeft,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore, useCurrentTenant } from '@/store/auth.store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';

interface SidebarProps {
  locale: string;
  blogId: string;
}

const PLAN_GRADIENT: Record<string, string> = {
  free:     'from-slate-400 to-slate-500',
  starter:  'from-slate-500 to-slate-600',
  pro:      'from-blue-500 to-blue-600',
  business: 'from-amber-500 to-orange-500',
};

export function Sidebar({ locale, blogId }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const t        = useTranslations('blogNav');
  const { tenants, setCurrentTenant, user, clearAuth } = useAuthStore();
  const currentTenant = useCurrentTenant();

  const base = `/${locale}/blogs/${blogId}`;

  const sections = [
    {
      label: t('sectionOverview'),
      items: [
        { href: `${base}/overview`,   icon: LayoutDashboard, label: t('overview') },
      ],
    },
    {
      label: t('sectionContent'),
      items: [
        { href: `${base}/articles`,   icon: FileText,      label: t('articles') },
        { href: `${base}/categories`, icon: Tags,          label: t('categories') },
        { href: `${base}/tags`,       icon: Tags,          label: t('tags'),    soon: true },
        { href: `${base}/comments`,   icon: MessageSquare, label: t('comments'), soon: true },
        { href: `${base}/media`,      icon: Image,         label: t('media'),   soon: true },
      ],
    },
    {
      label: t('sectionGrowth'),
      items: [
        { href: `${base}/analytics`,  icon: BarChart2, label: t('analytics') },
        { href: `${base}/ai`,         icon: Bot,       label: t('ai'),         soon: true },
        { href: `${base}/ads`,        icon: Megaphone, label: t('ads'),        soon: true },
        { href: `${base}/social`,     icon: Share2,    label: t('social'),     soon: true },
        { href: `${base}/newsletter`, icon: Mail,      label: t('newsletter') },
      ],
    },
    {
      label: t('sectionBlog'),
      items: [
        { href: `${base}/appearance`, icon: Palette,  label: t('appearance') },
        { href: `${base}/team`,       icon: Users,    label: t('collaborators') },
        { href: `${base}/settings`,   icon: Settings, label: t('settings') },
      ],
    },
  ];

  const planKey = (currentTenant?.plan ?? 'free').toLowerCase();
  const gradient = PLAN_GRADIENT[planKey] ?? PLAN_GRADIENT.free;

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-slate-100 bg-white dark:bg-zinc-900 dark:border-zinc-800">

      {/* ── Logo + back ─────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5 group min-w-0">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
            N
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
            NexusBlog
          </span>
        </Link>
        <Link
          href={`/${locale}/dashboard`}
          className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t('back')}
        </Link>
      </div>

      {/* ── Blog selector ──────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-100 dark:border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 outline-none">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm`}>
              {currentTenant?.name?.[0]?.toUpperCase() ?? 'N'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                {currentTenant?.name ?? 'My blog'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">
                {currentTenant?.slug ?? '...'}.nexusblog.io
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t('switchBlog')}
            </div>
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => {
                  setCurrentTenant(tenant.id);
                  router.push(`/${locale}/blogs/${tenant.id}/overview`);
                }}
                className="gap-2.5 cursor-pointer"
              >
                <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${PLAN_GRADIENT[tenant.plan?.toLowerCase() ?? 'free'] ?? PLAN_GRADIENT.free} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {tenant.name[0].toUpperCase()}
                </div>
                <span className="truncate text-sm flex-1">{tenant.name}</span>
                {tenant.id === currentTenant?.id && (
                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/blogs/new`} className="gap-2.5 cursor-pointer">
                <div className="h-5 w-5 rounded-md border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3 text-slate-400" />
                </div>
                <span className="text-sm">{t('newBlog')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {sections.map((section) => (
          <div key={section.label} className="pb-2">
            <p className="px-2.5 mb-1 mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 select-none">
              {section.label}
            </p>
            {section.items.map(({ href, icon: Icon, label, soon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={soon ? '#' : href}
                  aria-disabled={soon}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-100 mt-0.5',
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
                  <span className="flex-1 leading-none">{label}</span>
                  {soon && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 dark:text-zinc-600 border border-slate-200 dark:border-zinc-700 rounded px-1 py-0.5">
                      {t('soon')}
                    </span>
                  )}
                  {isActive && !soon && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* View blog */}
        {currentTenant && (
          <div className="pt-1 border-t border-slate-50 dark:border-zinc-800 mt-1">
            <a
              href={`/en/${currentTenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-all mt-0.5"
            >
              <Globe className="h-[15px] w-[15px] shrink-0" />
              <span className="flex-1">{t('viewBlog')}</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          </div>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-100 dark:border-zinc-800 p-3 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {currentTenant?.plan ?? 'Free'}
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
