'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioSwitch, StudioInput,
} from '@/components/dashboard/BlogStudioShell';

interface NavLink { label: string; url: string; }

interface HeaderConfig {
  topBar: {
    enabled: boolean;
    showDate: boolean;
    showSocial: boolean;
    showNewsletter: boolean;
    showRss: boolean;
  };
  subscribe: {
    enabled: boolean;
    label: string;
  };
  nav: {
    links: NavLink[];
  };
}

const DEFAULT: HeaderConfig = {
  topBar: { enabled: true, showDate: true, showSocial: true, showNewsletter: true, showRss: true },
  subscribe: { enabled: true, label: "S'abonner" },
  nav: { links: [{ label: 'Accueil', url: '/' }, { label: 'À propos', url: '/about' }, { label: 'Contact', url: '/contact' }] },
};

export default function HeaderPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<HeaderConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.header) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.header as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: HeaderConfig) => HeaderConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), header: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('headerSavedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const addLink = () => patch(c => ({ ...c, nav: { links: [...c.nav.links, { label: '', url: '/' }] } }));
  const removeLink = (i: number) => patch(c => ({ ...c, nav: { links: c.nav.links.filter((_, j) => j !== i) } }));
  const updateLink = (i: number, field: 'label' | 'url', val: string) =>
    patch(c => ({ ...c, nav: { links: c.nav.links.map((l, j) => j === i ? { ...l, [field]: val } : l) } }));

  return (
    <BlogStudioShell
      title={ts('pageHeader')}
      description={ts('pageHeaderDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="topbar" title={ts('sectionTopBar')} defaultOpen>
        <StudioSwitch label={ts('switchShowTopBar')} description={ts('switchShowTopBarDesc')} checked={cfg.topBar.enabled} onChange={v => patch(c => ({ ...c, topBar: { ...c.topBar, enabled: v } }))} />
        {cfg.topBar.enabled && (
          <>
            <StudioSwitch label={ts('switchShowDate')} checked={cfg.topBar.showDate} onChange={v => patch(c => ({ ...c, topBar: { ...c.topBar, showDate: v } }))} />
            <StudioSwitch label={ts('switchShowSocial')} checked={cfg.topBar.showSocial} onChange={v => patch(c => ({ ...c, topBar: { ...c.topBar, showSocial: v } }))} />
            <StudioSwitch label={ts('switchNewsletterLink')} checked={cfg.topBar.showNewsletter} onChange={v => patch(c => ({ ...c, topBar: { ...c.topBar, showNewsletter: v } }))} />
            <StudioSwitch label={ts('switchRssLink')} checked={cfg.topBar.showRss} onChange={v => patch(c => ({ ...c, topBar: { ...c.topBar, showRss: v } }))} />
          </>
        )}
      </StudioSection>

      <StudioSection id="nav" title={ts('sectionNav')} defaultOpen>
        <StudioField label={ts('fieldNavLinks')} hint={ts('fieldNavLinksHint')}>
          <div className="space-y-2">
            {cfg.nav.links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={link.label}
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  placeholder={ts('linkLabel')}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <input
                  value={link.url}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  placeholder="/page"
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <button onClick={() => removeLink(i)} className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addLink} className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> {ts('addLink')}
          </button>
        </StudioField>
      </StudioSection>

      <StudioSection id="subscribe" title={ts('sectionSubscribe')} defaultOpen>
        <StudioSwitch label={ts('switchShowButton')} checked={cfg.subscribe.enabled} onChange={v => patch(c => ({ ...c, subscribe: { ...c.subscribe, enabled: v } }))} />
        {cfg.subscribe.enabled && (
          <StudioField label={ts('fieldButtonText')}>
            <StudioInput value={cfg.subscribe.label} onChange={v => patch(c => ({ ...c, subscribe: { ...c.subscribe, label: v } }))} placeholder="S'abonner" />
          </StudioField>
        )}
      </StudioSection>
    </BlogStudioShell>
  );
}
