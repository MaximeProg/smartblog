'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';

import { tenantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { slugify, cn } from '@/lib/utils';
import { canCreateBlog, getPlanConfig } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { TenantInfo } from '@/types';

const THEMES = [
  {
    id: 'minimal',
    bg: 'bg-white border-gray-900',
    dots: ['bg-gray-900', 'bg-gray-400', 'bg-gray-200'],
  },
  {
    id: 'magazine',
    bg: 'bg-white border-red-600',
    dots: ['bg-red-600', 'bg-gray-800', 'bg-gray-200'],
  },
  {
    id: 'business',
    bg: 'bg-white border-blue-700',
    dots: ['bg-blue-700', 'bg-blue-300', 'bg-gray-100'],
  },
  {
    id: 'news',
    bg: 'bg-gray-900 border-gray-700',
    dots: ['bg-white', 'bg-gray-400', 'bg-gray-700'],
  },
  {
    id: 'tech',
    bg: 'bg-gray-950 border-violet-500',
    dots: ['bg-violet-500', 'bg-gray-400', 'bg-gray-800'],
  },
  {
    id: 'portfolio',
    bg: 'bg-white border-rose-500',
    dots: ['bg-rose-500', 'bg-gray-200', 'bg-gray-100'],
  },
] as const;

type ThemeId = (typeof THEMES)[number]['id'];

const schema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().min(4).max(50).regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewBlogPage() {
  const t = useTranslations('blogs.create');
  const tApp = useTranslations('appearance');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user, tenants, addTenant, setCurrentTenant } = useAuthStore();

  const plan = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);
  const atLimit = !canCreateBlog(plan, tenants.length);

  const [step, setStep]           = useState<1 | 2>(1);
  const [selectedTheme, setTheme] = useState<ThemeId>('minimal');

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const nameValue = watch('name', '');
  const slugValue = watch('slug', '');

  useEffect(() => {
    if (nameValue) setValue('slug', slugify(nameValue), { shouldValidate: true });
  }, [nameValue, setValue]);

  const { data: slugCheck, isFetching: checkingSlug } = useQuery({
    queryKey: ['slug-check', slugValue],
    queryFn: () => tenantsApi.checkSlug(slugValue).then((r) => r.data),
    enabled: slugValue.length >= 4 && !errors.slug,
    staleTime: 5000,
  });

  const slugAvailable = slugCheck?.available;
  const showSlugStatus = slugValue.length >= 4 && !errors.slug;

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => tenantsApi.create({ ...data, theme: selectedTheme }),
    onSuccess: ({ data }) => {
      const tenantInfo: TenantInfo = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        role: 'tenant_admin',
      };
      addTenant(tenantInfo);
      setCurrentTenant(data.id);
      toast({ variant: 'success', title: `Blog "${data.name}" created successfully!` });
      router.push(`/${locale}/blogs/${data.id}/overview`);
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to create blog. Please try again.' }),
  });

  const goToStep2 = async () => {
    const ok = await trigger(['name', 'slug', 'description']);
    if (ok && slugAvailable !== false) setStep(2);
  };

  if (atLimit) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-lg">{t('limitTitle')}</CardTitle>
            <CardDescription>
              {t('limitDesc', {
                plan: planConfig.label,
                max: planConfig.maxBlogs === 1 ? '1 blog' : `${planConfig.maxBlogs} blogs`,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild><Link href={`/${locale}/subscription`}>{t('limitViewPlans')}</Link></Button>
            <Button variant="outline" asChild><Link href={`/${locale}/dashboard`}>{t('limitBack')}</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow">
            N
          </div>
          <span className="font-extrabold text-base tracking-tight">NexusBlog</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                  : step > s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
              )}>
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                {s === 1 ? t('stepInfo') : t('stepTheme')}
              </span>
              {s < 2 && <div className={cn('flex-1 h-px', step > s ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-zinc-700')} />}
            </div>
          ))}
        </div>

        <Card className="shadow-sm border-slate-200/80 dark:border-zinc-800">
          {/* STEP 1: Blog info */}
          {step === 1 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t('createTitle')}</CardTitle>
                <CardDescription>{t('createDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t('nameLabel')}</Label>
                    <Input id="name" placeholder={t('namePlaceholder')} {...register('name')} autoFocus />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="slug">{t('slugLabel')}</Label>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-zinc-900">
                      <span className="px-3 py-2 text-sm text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 shrink-0 select-none">
                        nexusblog.io/
                      </span>
                      <input
                        id="slug"
                        {...register('slug')}
                        className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                        placeholder="my-blog"
                      />
                      {showSlugStatus && (
                        <div className="pr-3">
                          {checkingSlug
                            ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            : slugAvailable
                            ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                            : <XCircle className="h-4 w-4 text-destructive" />}
                        </div>
                      )}
                    </div>
                    {errors.slug ? (
                      <p className="text-xs text-destructive">{errors.slug.message}</p>
                    ) : showSlugStatus && !checkingSlug ? (
                      <p className={`text-xs ${slugAvailable ? 'text-emerald-600' : 'text-destructive'}`}>
                        {slugAvailable ? `✓ ${t('slugAvailableLabel')}` : `✗ ${t('slugTakenLabel')}`}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      {t('descriptionLabel')}{' '}
                      <span className="text-slate-400 font-normal text-xs">{t('descriptionOptional')}</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t('descriptionPlaceholder')}
                      rows={3}
                      {...register('description')}
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full gap-1.5"
                    onClick={goToStep2}
                    disabled={!slugValue || checkingSlug || slugAvailable === false || !!errors.name || !!errors.slug}
                  >
                    {t('nextStep')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: Theme */}
          {step === 2 && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t('themeTitle')}</CardTitle>
                <CardDescription>{t('themeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {THEMES.map((theme) => {
                    const selected = selectedTheme === theme.id;
                    const label = theme.id.charAt(0).toUpperCase() + theme.id.slice(1);
                    const desc = tApp(`themes.${theme.id}` as any);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setTheme(theme.id)}
                        className={cn(
                          'relative rounded-xl border-2 overflow-hidden text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                          selected
                            ? 'border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-950/30'
                            : 'border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-sm'
                        )}
                      >
                        <div className={`h-16 border-2 ${theme.bg} relative overflow-hidden`}>
                          <div className="absolute inset-1.5 flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {theme.dots.map((dot, i) => (
                                <div key={i} className={`h-1 ${i === 0 ? 'w-6' : i === 1 ? 'w-4' : 'w-2'} rounded-full ${dot}`} />
                              ))}
                            </div>
                            <div className={`h-1.5 w-3/4 rounded ${theme.dots[0]} opacity-70`} />
                            <div className={`h-1 w-full rounded ${theme.dots[2]} opacity-50`} />
                            <div className={`h-1 w-5/6 rounded ${theme.dots[2]} opacity-50`} />
                          </div>
                          {selected && (
                            <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1.5 bg-white dark:bg-zinc-900">
                          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 leading-none">{label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-snug">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backStep')}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 gap-1.5"
                    disabled={createMutation.isPending}
                    onClick={handleSubmit((data) => createMutation.mutate(data))}
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {createMutation.isPending ? t('creating') : t('submitButton')}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-5">
          <Link href={`/${locale}/dashboard`} className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
            ← {t('backToDashboard')}
          </Link>
        </p>
      </div>
    </div>
  );
}
