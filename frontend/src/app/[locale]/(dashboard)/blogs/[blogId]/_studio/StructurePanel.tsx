'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  Globe, Palette, Share2, PanelTop, PanelBottom,
  Home, Info, Phone, FileText, Tag, Mail, LayoutList,
  Layout, Target, Star, Users, ArrowRight, MapPin,
  BookOpen, Heart, Layers, Tags, Images, MessageSquare,
  Megaphone, BarChart2, Search, DollarSign, Settings,
  Key, LifeBuoy, Sparkles, ChevronDown, ChevronRight,
  ExternalLink, Zap, Plus, LogOut, Languages,
  X,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useEditorStore } from '@/store/editor.store';
import { useAuthStore, useCurrentTenant } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, tenantsApi } from '@/lib/api';
import { firebaseSignOut } from '@/lib/firebase';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SectionDef } from '@/templates/types';

const PLAN_GRADIENT: Record<string, string> = {
  free:     'from-slate-400 to-slate-500',
  starter:  'from-slate-500 to-slate-600',
  pro:      'from-blue-500 to-blue-600',
  business: 'from-amber-500 to-orange-500',
};

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Palette, Share2, PanelTop, PanelBottom,
  Home, Info, Phone, FileText, Tag, Mail, LayoutList,
  Layout, Target, Star, Users, ArrowRight, MapPin,
  BookOpen, Heart, Layers,
};

function SectionIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Comp = ICON_MAP[name];
  return Comp ? <Comp className={cn('h-3.5 w-3.5 shrink-0', className)} /> : null;
}

function UserAvatar({ avatarUrl, initials }: { avatarUrl?: string | null; initials: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="avatar" className="h-6 w-6 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
      {initials}
    </div>
  );
}

function NavLabel({ label }: { label: string }) {
  return (
    <p className="px-2.5 mb-0.5 mt-3 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
      {label}
    </p>
  );
}

export function StructurePanel() {
  const params   = useParams();
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = params.locale as string;
  const blogId   = params.blogId as string;
  const base     = `/${locale}/blogs/${blogId}`;

  const queryClient  = useQueryClient();
  const { tenants, setCurrentTenant, user, clearAuth } = useAuthStore();
  const currentTenant = useCurrentTenant();
  const { mobileBlogSidebarOpen, closeBlogSidebar } = useUIStore();

  const {
    schema, activePage, selectedSectionId,
    setActivePage, selectSection, init, tenantId,
  } = useEditorStore();

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(['home']));

  // Init editor store when blogId changes
  useEffect(() => {
    if (tenantId === blogId) return;
    tenantsApi.get(blogId).then((r) => init(blogId, r.data)).catch(() => {});
  }, [blogId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isStudioRoot = pathname === `/${locale}/blogs/${blogId}`;

  const planKey  = (currentTenant?.plan ?? 'free').toLowerCase();
  const gradient = PLAN_GRADIENT[planKey] ?? PLAN_GRADIENT.free;

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch {}
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    queryClient.clear();
    closeBlogSidebar();
    router.push(`/${locale}/login`);
  };

  const goToSection = (section: SectionDef, pageId?: string) => {
    closeBlogSidebar();
    if (!isStudioRoot) router.push(`/${locale}/blogs/${blogId}`);
    if (pageId) setActivePage(pageId);
    selectSection(section.id);
  };

  const goToPage = (pageId: string, canvasPath: string) => {
    closeBlogSidebar();
    setActivePage(pageId);
    selectSection(null);
    if (!isStudioRoot) router.push(`/${locale}/blogs/${blogId}`);
    setExpandedPages((s) => {
      const next = new Set(s);
      if (next.has(pageId)) next.delete(pageId); else next.add(pageId);
      return next;
    });
  };

  const goToRoute = (href: string) => {
    closeBlogSidebar();
    selectSection(null);
    router.push(`${base}/${href}`);
  };

  const content = (
    <aside className="h-full w-[260px] flex flex-col border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">

      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-700 px-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">N</div>
          <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100 truncate">NexusBlog</span>
        </div>
        <button onClick={closeBlogSidebar} className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Blog selector */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 outline-none transition">
            <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm`}>
              {currentTenant?.name?.[0]?.toUpperCase() ?? 'N'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{currentTenant?.name ?? 'Mon blog'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">{currentTenant?.slug}.smarterbloggers.com</p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Changer de blog</div>
            {tenants.map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => { setCurrentTenant(t.id); router.push(`/${locale}/blogs/${t.id}`); }} className="gap-2 cursor-pointer">
                <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${PLAN_GRADIENT[t.plan?.toLowerCase() ?? 'free'] ?? PLAN_GRADIENT.free} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                  {t.name[0].toUpperCase()}
                </div>
                <span className="truncate text-sm flex-1">{t.name}</span>
                {t.id === currentTenant?.id && <ChevronRight className="h-3 w-3 text-blue-500 shrink-0" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/blogs/new`} className="gap-2 cursor-pointer">
                <div className="h-5 w-5 rounded-md border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3 text-slate-400" />
                </div>
                <span className="text-sm">Nouveau blog</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1.5 px-2.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

        {/* AI Builder */}
        <div className="mb-2 mt-1">
          <button
            onClick={() => goToRoute('ai-builder')}
            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[12px] font-bold shadow-sm hover:from-violet-700 hover:to-blue-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            IA Builder
          </button>
        </div>

        {/* SITE — global sections */}
        <NavLabel label="Site" />
        {schema?.global.map((section) => (
          <button
            key={section.id}
            onClick={() => goToSection(section)}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium transition mt-0.5',
              selectedSectionId === section.id && isStudioRoot
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
            )}
          >
            <SectionIcon name={section.icon} className={selectedSectionId === section.id && isStudioRoot ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'} />
            <span className="flex-1 text-left">{section.label}</span>
          </button>
        ))}

        {/* PAGES */}
        <NavLabel label="Pages" />
        {schema?.pages.map((page) => {
          const isActivePage = activePage === page.id && isStudioRoot;
          const isExpanded   = expandedPages.has(page.id);
          const PageIcon     = ICON_MAP[page.icon];

          return (
            <div key={page.id}>
              <button
                onClick={() => goToPage(page.id, page.canvasPath)}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium transition mt-0.5',
                  isActivePage
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
                )}
              >
                {PageIcon && <PageIcon className={cn('h-3.5 w-3.5 shrink-0', isActivePage ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500')} />}
                <span className="flex-1 text-left">{page.label}</span>
                {isExpanded
                  ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                  : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                }
              </button>

              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-slate-100 dark:border-slate-800 mt-0.5 space-y-0.5">
                  {page.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => goToSection(section, page.id)}
                      className={cn(
                        'w-full flex items-center gap-1.5 rounded-md px-2 py-[5px] text-[11px] font-medium transition',
                        selectedSectionId === section.id && isStudioRoot
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300',
                      )}
                    >
                      <SectionIcon name={section.icon} className="h-3 w-3" />
                      <span className="flex-1 text-left">{section.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* CONTENU */}
        <NavLabel label="Contenu" />
        {[
          { href: 'articles',   icon: FileText,      label: 'Articles' },
          { href: 'categories', icon: Tag,           label: 'Catégories' },
          { href: 'tags',       icon: Tags,          label: 'Tags' },
          { href: 'media',      icon: Images,        label: 'Médias' },
          { href: 'newsletter', icon: Mail,          label: 'Newsletter' },
          { href: 'comments',   icon: MessageSquare, label: 'Commentaires' },
          { href: 'ads',        icon: Megaphone,     label: 'Publicités' },
        ].map(({ href, icon: Icon, label }) => {
          const full = `${base}/${href}`;
          const active = pathname.startsWith(full);
          return (
            <button
              key={href}
              onClick={() => goToRoute(href)}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium transition mt-0.5',
                active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500')} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          );
        })}

        {/* CROISSANCE */}
        <NavLabel label="Croissance" />
        {[
          { href: 'analytics',  icon: BarChart2,  label: 'Analytics' },
          { href: 'seo',        icon: Search,     label: 'SEO' },
          { href: 'social',     icon: Share2,     label: 'Social' },
          { href: 'languages',  icon: Languages,  label: 'Langues' },
          { href: 'accounting', icon: DollarSign, label: 'Comptabilité' },
        ].map(({ href, icon: Icon, label }) => {
          const full = `${base}/${href}`;
          const active = pathname.startsWith(full);
          return (
            <button key={href} onClick={() => goToRoute(href)}
              className={cn('w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium transition mt-0.5',
                active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                       : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500')} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          );
        })}

        {/* RÉGLAGES */}
        <NavLabel label="Réglages" />
        {[
          { href: 'general',       icon: Settings,  label: 'Général' },
          { href: 'collaborators', icon: Users,     label: 'Collaborateurs' },
          { href: 'domains',       icon: Globe,     label: 'Domaines' },
          { href: 'api-keys',      icon: Key,       label: 'Clés API' },
          { href: 'support',       icon: LifeBuoy,  label: 'Support' },
        ].map(({ href, icon: Icon, label }) => {
          const full = `${base}/${href}`;
          const active = pathname.startsWith(full);
          return (
            <button key={href} onClick={() => goToRoute(href)}
              className={cn('w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium transition mt-0.5',
                active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                       : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500')} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          );
        })}

        {/* View blog */}
        {currentTenant?.slug && (
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
            <a
              href={`/${locale}/${currentTenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition mt-0.5"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">Voir le blog</span>
            </a>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 dark:border-slate-700 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 capitalize">{currentTenant?.plan ?? 'Free'}</span>
          </div>
          <Link href={`/${locale}/subscription`} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-700 px-2 py-0.5 rounded-full transition">
            Améliorer
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition group"
        >
          <UserAvatar avatarUrl={user?.avatar_url} initials={user ? getInitials(user.display_name ?? user.email) : 'U'} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-semibold truncate text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-none">
              {user?.display_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email}</p>
          </div>
          <LogOut className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition text-red-500" />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {mobileBlogSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden" onClick={closeBlogSidebar} />
      )}
      <div className={cn(
        'shrink-0 h-full z-50 hidden lg:flex',
        mobileBlogSidebarOpen && 'fixed inset-y-0 left-0 !flex',
      )}>
        {content}
      </div>
    </>
  );
}
