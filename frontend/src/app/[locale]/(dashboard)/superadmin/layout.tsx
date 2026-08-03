'use client';

import { useEffect, useState, useRef, type ElementType } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import {
  LayoutDashboard, Users, Building2, CreditCard, FileText,
  Layers, FolderOpen, Image, Megaphone, GitBranch, BookOpen,
  Brain, Mail, Bell, Server, Settings, ScrollText, Shield,
  HeadphonesIcon, LogOut, Activity, ChevronRight, ShieldCheck,
  PanelLeft, Sun, Moon, ChevronDown, Eye, Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router    = useRouter();
  const params    = useParams();
  const locale    = params.locale as string;
  const pathname  = usePathname();
  const t         = useTranslations('superAdmin');
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark]           = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: notifCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => authApi.notificationsCount().then(r => r.data.unread ?? 0),
    refetchInterval: 60000,
    retry: false,
  });
  const bellCount = notifCount ?? 0;

  useEffect(() => {
    const html = document.documentElement;
    if (dark) html.classList.add('dark');
    else      html.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    if (user && !user.is_super_admin) router.replace(`/${locale}/dashboard`);
  }, [user, router, locale]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user?.is_super_admin) return null;

  const b = `/${locale}/superadmin`;
  const initials = getInitials(user.display_name ?? user.email ?? '').slice(0, 2).toUpperCase();
  const displayName = user.display_name ?? user.email?.split('@')[0] ?? 'Admin';

  // Sidebar nav (Administration group moved to profile dropdown)
  const GROUPS: NavGroup[] = [
    {
      label: t('nav.overview'),
      items: [
        { href: b, label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: t('nav.clients'),
      items: [
        { href: `${b}/users`,    label: t('nav.users'),    icon: Users },
        { href: `${b}/tenants`,  label: t('nav.tenants'),  icon: Building2 },
        { href: `${b}/plans`,    label: t('nav.plans'),    icon: CreditCard },
        { href: `${b}/payments`, label: t('nav.payments'), icon: FileText },
        { href: `${b}/support`,  label: t('nav.support'),  icon: HeadphonesIcon },
      ],
    },
    {
      label: t('nav.content'),
      items: [
        { href: `${b}/templates`,           label: t('nav.templates'),  icon: Layers },
        { href: `${b}/template-categories`, label: t('nav.categories'), icon: FolderOpen },
        { href: `${b}/media`,               label: t('nav.media'),      icon: Image },
        { href: `${b}/platform-pages`,      label: t('nav.platformPages'), icon: Globe },
      ],
    },
    {
      label: t('nav.monetization'),
      items: [
        { href: `${b}/ads`,        label: t('nav.ads'),        icon: Megaphone },
        { href: `${b}/affiliate`,  label: t('nav.affiliate'),  icon: GitBranch },
        { href: `${b}/accounting`, label: t('nav.accounting'), icon: BookOpen },
        { href: `${b}/domains`,    label: t('nav.domains'),    icon: Globe },
      ],
    },
    {
      label: t('nav.infrastructure'),
      items: [
        { href: `${b}/ai`,            label: t('nav.ai'),            icon: Brain },
        { href: `${b}/emails`,        label: t('nav.emails'),        icon: Mail },
        { href: `${b}/notifications`, label: t('nav.notifications'), icon: Bell },
        { href: `${b}/system`,        label: t('nav.system'),        icon: Server },
        { href: `${b}/surveillance`,  label: t('nav.surveillance'),  icon: Eye },
      ],
    },
  ];

  // Admin links shown in profile dropdown
  const ADMIN_LINKS = [
    { href: `${b}/settings`, label: t('nav.settings'), icon: Settings },
    { href: `${b}/logs`,     label: t('nav.logs'),     icon: ScrollText },
    { href: `${b}/roles`,    label: t('nav.roles'),    icon: Shield },
  ];

  function itemActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href) && item.href !== b;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--sa-bg)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'shrink-0 flex flex-col h-full transition-all duration-200 overflow-hidden border-r',
          collapsed ? 'w-[58px]' : 'w-[230px]',
        )}
        style={{ background: 'var(--sa-sidebar)', borderColor: 'var(--sa-border)' }}
      >
        {/* Brand */}
        <div
          className="h-[57px] flex items-center justify-center shrink-0 border-b"
          style={{ borderColor: 'var(--sa-border)', padding: collapsed ? '0' : '0 14px' }}
        >
          {collapsed ? (
            <div className="h-8 w-8 rounded-xl bg-[#6366f1] flex items-center justify-center shadow-md shadow-[#6366f1]/20">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-8 w-8 shrink-0 rounded-xl bg-[#6366f1] flex items-center justify-center shadow-md shadow-[#6366f1]/20">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black leading-none truncate" style={{ color: 'var(--sa-text)' }}>SmarterBloggers</p>
                <p className="text-[10px] font-bold leading-none mt-0.5 tracking-widest uppercase" style={{ color: 'var(--sa-accent)' }}>{t('common.consoleLabel')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status pill */}
        {!collapsed && (
          <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('status.operational')}</span>
            <Activity className="h-3 w-3 text-emerald-500 ml-auto" />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
          {GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] select-none"
                   style={{ color: 'var(--sa-text-3)' }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = itemActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all relative',
                        active ? '' : 'hover:bg-[var(--sa-surface)]',
                        collapsed ? 'justify-center h-9 w-full px-0' : 'px-2.5 py-2',
                      )}
                      style={{
                        background: active ? 'var(--sa-accent-bg)' : undefined,
                        color: active ? 'var(--sa-accent)' : 'var(--sa-text-3)',
                      }}
                    >
                      <item.icon className="h-4 w-4 shrink-0" style={{ color: active ? 'var(--sa-accent)' : undefined }} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {active && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" style={{ color: 'var(--sa-accent)' }} />}
                        </>
                      )}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: 'var(--sa-accent)' }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 p-2 border-t" style={{ borderColor: 'var(--sa-border)' }}>
          <Link
            href={`/${locale}/dashboard`}
            title={collapsed ? t('exitAdmin') : undefined}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--sa-surface)]',
              collapsed && 'justify-center',
            )}
            style={{ color: 'var(--sa-text-3)' }}
          >
            <LogOut className="h-4 w-4 shrink-0 rotate-180" />
            {!collapsed && <span>{t('exitAdmin')}</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <div
          className="h-[57px] shrink-0 flex items-center justify-between border-b"
          style={{ background: 'var(--sa-topbar)', borderColor: 'var(--sa-border)', padding: '0 20px' }}
        >
          {/* Left: toggle + badge + date */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--sa-surface)] shrink-0"
              style={{ color: 'var(--sa-text-3)', border: '1px solid var(--sa-border)' }}
              title={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
            >
              <PanelLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'var(--sa-accent-bg)', border: '1px solid var(--sa-accent)20' }}>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--sa-accent)' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--sa-accent)' }}>{t('adminMode')}</span>
            </div>

            <span className="text-[12px] hidden lg:block" style={{ color: 'var(--sa-text-3)' }}>
              {new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {/* Right: bell + theme toggle + profile dropdown */}
          <div className="flex items-center gap-2">
            {/* Notification bell — links to the real notification feed */}
            <Link
              href={`${b}/notifications`}
              className="relative h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--sa-surface)]"
              style={{ border: '1px solid var(--sa-border)', color: 'var(--sa-text-3)' }}
              title={t('nav.notifications')}
            >
              <Bell className="h-4 w-4" />
              {bellCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: '#ef4444' }}
                >
                  {bellCount > 99 ? '99+' : bellCount}
                </span>
              )}
            </Link>

            {/* Theme toggle */}
            <button
              onClick={() => setDark(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--sa-surface)]"
              style={{ border: '1px solid var(--sa-border)', color: 'var(--sa-text-3)' }}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-lg transition-colors hover:bg-[var(--sa-surface)]"
                style={{ border: '1px solid var(--sa-border)' }}
              >
                {/* Avatar */}
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: 'var(--sa-accent)' }}>
                  {initials}
                </div>
                <span className="text-[12px] font-semibold hidden sm:block max-w-[120px] truncate" style={{ color: 'var(--sa-text-2)' }}>
                  {displayName}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform shrink-0', profileOpen && 'rotate-180')} style={{ color: 'var(--sa-text-3)' }} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-56 rounded-xl overflow-hidden shadow-lg z-50"
                  style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)' }}
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sa-border)' }}>
                    <p className="text-[13px] font-bold truncate" style={{ color: 'var(--sa-text)' }}>{displayName}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'var(--sa-accent-bg)', color: 'var(--sa-accent)' }}>
                      {t('superAdminRole')}
                    </span>
                  </div>

                  {/* Admin links */}
                  <div className="py-1.5" style={{ borderBottom: '1px solid var(--sa-border)' }}>
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--sa-text-3)' }}>
                      {t('nav.administration')}
                    </p>
                    {ADMIN_LINKS.map(link => {
                      const isCurrentPage = pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors hover:bg-[var(--sa-surface)]"
                          style={{ color: isCurrentPage ? 'var(--sa-accent)' : 'var(--sa-text-2)' }}
                        >
                          <link.icon className="h-3.5 w-3.5 shrink-0" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Back to dashboard */}
                  <div className="py-1.5">
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors hover:bg-[var(--sa-surface)]"
                      style={{ color: 'var(--sa-text-2)' }}
                    >
                      <LogOut className="h-3.5 w-3.5 rotate-180 shrink-0" />
                      {t('exitAdmin')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ fontSize: '14px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
