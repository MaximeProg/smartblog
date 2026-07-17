'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Languages as LanguagesIcon, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/use-auto-save';
import {
  BlogStudioShell, StudioSection, StudioSwitch,
} from '@/components/dashboard/BlogStudioShell';
import { CMS_SUPPORTED_LANGS } from '@/config/cms';

export default function LanguagesPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const isFree = (tenant?.plan ?? 'free') === 'free';
  const sourceLang = (tenant?.language ?? 'en').toLowerCase();

  const [enabled, setEnabled] = useState<string[]>([]);
  const [serverLoaded, setServerLoaded] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!isDirtyRef.current && tenant) {
      setEnabled(tenant.enabled_languages ?? []);
      setServerLoaded(true);
    }
  }, [tenant]);

  const toggle = (code: string) => {
    isDirtyRef.current = true;
    setEnabled(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const doSave = async (latest: string[]) => {
    await tenantsApi.update(blogId, { enabled_languages: latest });
    isDirtyRef.current = false;
    qc.invalidateQueries({ queryKey: ['tenant', blogId] });
  };

  const { isAutoSaving } = useAutoSave(enabled, doSave, { enabled: serverLoaded && !isFree });

  const mutation = useMutation({
    mutationFn: () => doSave(enabled),
    onSuccess: () => toast({ title: ts('languagesSavedToast') }),
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  return (
    <BlogStudioShell
      title={ts('pageLanguages')}
      description={ts('pageLanguagesDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending || isAutoSaving}
      onSave={isFree ? undefined : () => mutation.mutate()}
    >
      {isFree ? (
        <div className="mx-5 mt-5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-6 text-center">
          <Sparkles className="h-6 w-6 text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            {ts('languagesUpsellTitle')}
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {ts('languagesUpsellDesc')}
          </p>
        </div>
      ) : (
        <StudioSection id="languages" title={ts('languagesSectionTitle')} icon={<LanguagesIcon className="h-3.5 w-3.5" />} defaultOpen>
          <div className="space-y-1">
            {CMS_SUPPORTED_LANGS.filter(l => l.code !== sourceLang).map(l => (
              <StudioSwitch
                key={l.code}
                label={`${l.flag}  ${l.label}`}
                checked={enabled.includes(l.code)}
                onChange={() => toggle(l.code)}
              />
            ))}
          </div>
        </StudioSection>
      )}
    </BlogStudioShell>
  );
}
