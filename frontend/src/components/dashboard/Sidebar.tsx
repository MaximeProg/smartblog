'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText, Tag, Mail,
  Home, Info, Phone, BookOpen,
  PanelTop, PanelBottom,
  BarChart2, Search, ArrowLeft, ExternalLink,
  Zap, Plus, ChevronDown, ChevronRight, Settings,
  LogOut,
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

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  soon?: boolean;
}

function SidebarItem({ item, base }: { item: NavItem; base: string }) {
  const pathname = usePathname();
  const fullHref = `${base}/${item.href}`;
  const isActive = pathname.startsWith(fullHref);

  if (item.soon) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-slate-300 cursor-default mt-0.5">
        <item.icon className="h-[15px] w-[15px] shrink-0 text-slate-200" />
        <span className="flex-1 leading-none">{item.label}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 border border-slate-200 rounded px-1 py-0.5">Bientôt</span>
      </div>
    );
  }

  return (
    <Link
      href={fullHref}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-100 mt-0.5',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      <item.icon className={cn(
        'h-[15px] w-[15px] shrink-0',
        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
      )} />
      <span className="flex-1 leading-none">{item.label}</span>
      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-2.5 mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none">
      {label}
    </p>
  );
}

export function Sidebar({ locale, blogId }: SidebarProps) {
  const router = useRouter();
  const { tenants, setCurrentTenant, user, clearAuth } = useAuthStore();
  const currentTenant = useCurrentTenant();

  const base = `/${locale}/blogs/${blogId}`;

  const designItems: NavItem[] = [
    { href: 'header',  icon: PanelTop,    label: 'Header' },
    { href: 'footer',  icon: PanelBottom, label: 'Footer' },
  ];

  const pageItems: NavItem[] = [
    { href: 'home',    icon: Home,     label: "Accueil" },
    { href: 'about',   icon: Info,     label: 'À propos' },
    { href: 'contact', icon: Phone,    label: 'Contact' },
    { href: 'article', icon: BookOpen, label: 'Page Article' },
  ];

  const contentItems: NavItem[] = [
    { href: 'articles',   icon: FileText, label: 'Articles' },
    { href: 'categories', icon: Tag,      label: 'Catégories' },
    { href: 'newsletter', icon: Mail,     label: 'Newsletter' },
  ];

  const growthItems: NavItem[] = [
    { href: 'analytics', icon: BarChart2, label: 'Analytics' },
    { href: 'seo',       icon: Search,    label: 'SEO'        },
  ];

  const planKey  = (currentTenant?.plan ?? 'free').toLowerCase();
  const gradient = PLAN_GRADIENT[planKey] ?? PLAN_GRADIENT.free;

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    router.push(`/${locale}/login`);
  };

  return (
    <aside className="h-screen w-[260px] shrink-0 flex flex-col border-r border-slate-100 bg-white overflow-hidden z-30">

      {/* Logo + retour */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5 group min-w-0">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">N</div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors truncate">NexusBlog</span>
        </Link>
        <Link href={`/${locale}/dashboard`} className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Retour
        </Link>
      </div>

      {/* Blog selector */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-100">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50 outline-none">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm`}>
              {currentTenant?.name?.[0]?.toUpperCase() ?? 'N'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{currentTenant?.name ?? 'Mon blog'}</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">{currentTenant?.slug ?? '...'}.nexusblog.io</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Changer de blog</div>
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => {
                  setCurrentTenant(tenant.id);
                  router.push(`/${locale}/blogs/${tenant.id}/general`);
                }}
                className="gap-2.5 cursor-pointer"
              >
                <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${PLAN_GRADIENT[tenant.plan?.toLowerCase() ?? 'free'] ?? PLAN_GRADIENT.free} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {tenant.name[0].toUpperCase()}
                </div>
                <span className="truncate text-sm flex-1">{tenant.name}</span>
                {tenant.id === currentTenant?.id && <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/onboarding`} className="gap-2.5 cursor-pointer">
                <div className="h-5 w-5 rounded-md border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3 text-slate-400" />
                </div>
                <span className="text-sm">Nouveau blog</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

        <SidebarItem item={{ href: 'general', icon: Settings, label: 'Paramètres généraux' }} base={base} />

        <SectionLabel label="Design" />
        {designItems.map(item => <SidebarItem key={item.href} item={item} base={base} />)}

        <SectionLabel label="Pages" />
        {pageItems.map(item => <SidebarItem key={item.href} item={item} base={base} />)}

        <SectionLabel label="Contenu" />
        {contentItems.map(item => <SidebarItem key={item.href} item={item} base={base} />)}

        <SectionLabel label="Croissance" />
        {growthItems.map(item => <SidebarItem key={item.href} item={item} base={base} />)}

        {/* Voir le blog */}
        {currentTenant && (
          <div className="pt-2 mt-1 border-t border-slate-50">
            <a
              href={currentTenant?.slug ? `/${locale}/${currentTenant.slug}` : `/${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all mt-0.5"
            >
              <ExternalLink className="h-[15px] w-[15px] shrink-0" />
              <span className="flex-1">Voir le blog</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 p-3 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-slate-700 capitalize">{currentTenant?.plan ?? 'Free'}</span>
          </div>
          <Link href={`/${locale}/subscription`} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors">
            Améliorer
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="text-[9px] bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold">
              {user ? getInitials(user.display_name ?? user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold truncate text-slate-700 group-hover:text-red-600 transition-colors leading-none">
              {user?.display_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email}</p>
          </div>
          <LogOut className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
        </button>
      </div>
    </aside>
  );
}
