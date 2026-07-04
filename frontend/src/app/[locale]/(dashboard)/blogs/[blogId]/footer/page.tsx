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

interface FooterConfig {
  description: string;
  showCategories: boolean;
  navLinks: { label: string; url: string }[];
  showSocialLinks: boolean;
  showNewsletterMini: boolean;
  newsletterMiniText: string;
  copyrightText: string;
  showPoweredBy: boolean;
}

const DEFAULT: FooterConfig = {
  description: '',
  showCategories: true,
  navLinks: [{ label: 'Accueil', url: '/' }, { label: 'À propos', url: '/about' }, { label: 'Contact', url: '/contact' }],
  showSocialLinks: true,
  showNewsletterMini: true,
  newsletterMiniText: '',
  copyrightText: '',
  showPoweredBy: true,
};

export default function FooterPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<FooterConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.footer) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.footer as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: FooterConfig) => FooterConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), footer: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('footerSavedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const addLink = () => patch(c => ({ ...c, navLinks: [...c.navLinks, { label: '', url: '/' }] }));
  const removeLink = (i: number) => patch(c => ({ ...c, navLinks: c.navLinks.filter((_, j) => j !== i) }));
  const updateLink = (i: number, f: 'label' | 'url', v: string) =>
    patch(c => ({ ...c, navLinks: c.navLinks.map((l, j) => j === i ? { ...l, [f]: v } : l) }));

  return (
    <BlogStudioShell
      title={ts('pageFooter')}
      description={ts('pageFooterDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="brand" title={ts('sectionBrand')} defaultOpen>
        <StudioField label={ts('fieldDescription')} hint={ts('fieldDescriptionFooter')}>
          <StudioInput value={cfg.description} onChange={v => patch(c => ({ ...c, description: v }))} placeholder="Votre blog — insights et analyses." multiline rows={3} />
        </StudioField>
        <StudioSwitch label={ts('switchShowSocialLinks')} description={ts('switchShowSocialFooterDesc')} checked={cfg.showSocialLinks} onChange={v => patch(c => ({ ...c, showSocialLinks: v }))} />
      </StudioSection>

      <StudioSection id="nav" title={ts('sectionFooterNav')} defaultOpen>
        <StudioSwitch label={ts('switchShowCategories')} description={ts('switchShowCategoriesFooterDesc')} checked={cfg.showCategories} onChange={v => patch(c => ({ ...c, showCategories: v }))} />
        <StudioField label={ts('fieldNavLinks')}>
          <div className="space-y-2">
            {cfg.navLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={link.label}
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  placeholder={ts('linkLabel')}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <input
                  value={link.url}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  placeholder="/page"
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <button onClick={() => removeLink(i)} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addLink} className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700">
            <Plus className="h-3.5 w-3.5" /> {ts('addLink')}
          </button>
        </StudioField>
      </StudioSection>

      <StudioSection id="newsletter" title={ts('sectionFooterNewsletter')} defaultOpen={false}>
        <StudioSwitch label={ts('switchShowNewsletterForm')} checked={cfg.showNewsletterMini} onChange={v => patch(c => ({ ...c, showNewsletterMini: v }))} />
        {cfg.showNewsletterMini && (
          <StudioField label={ts('fieldNewsletterTeaser')}>
            <StudioInput value={cfg.newsletterMiniText} onChange={v => patch(c => ({ ...c, newsletterMiniText: v }))} placeholder="Recevez nos meilleurs articles…" />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="copyright" title={ts('sectionCopyright')} defaultOpen={false}>
        <StudioField label={ts('fieldCopyright')}>
          <StudioInput value={cfg.copyrightText} onChange={v => patch(c => ({ ...c, copyrightText: v }))} placeholder="Tous droits réservés." />
        </StudioField>
        <StudioSwitch label={ts('switchPoweredBy')} checked={cfg.showPoweredBy} onChange={v => patch(c => ({ ...c, showPoweredBy: v }))} />
      </StudioSection>
    </BlogStudioShell>
  );
}
