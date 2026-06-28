'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { tenantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const generalSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  language:    z.string(),
  timezone:    z.string(),
});

type GeneralForm = z.infer<typeof generalSchema>;

export default function SettingsPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const router  = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const t = useTranslations('settings');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name:        tenant.name,
        description: tenant.description ?? '',
        language:    tenant.language,
        timezone:    tenant.timezone,
      });
    }
  }, [tenant, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: GeneralForm) => tenantsApi.update(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ variant: 'success', title: t('general.saved') });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to save settings.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tenantsApi.delete(blogId),
    onSuccess: () => {
      queryClient.clear();
      clearAuth();
      router.push(`/${locale}/dashboard`);
      toast({ title: 'Blog deleted.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete blog.' }),
  });

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
    >
      <div className="max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
              <TabsTrigger value="seo">{t('tabs.seo')}</TabsTrigger>
              <TabsTrigger value="danger">{t('tabs.danger')}</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general">
              <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>{t('general.blogName')}</Label>
                  <Input {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>{t('general.description')}</Label>
                  <Textarea {...register('description')} rows={3} placeholder="Describe your blog in a few words…" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('general.language')}</Label>
                    <Select defaultValue={tenant?.language ?? 'en'} onValueChange={(v) => setValue('language', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('general.timezone')}</Label>
                    <Select defaultValue={tenant?.timezone ?? 'UTC'} onValueChange={(v) => setValue('timezone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">New York (ET)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Africa/Abidjan">Abidjan (GMT)</SelectItem>
                        <SelectItem value="Africa/Douala">Douala (WAT)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {updateMutation.isPending ? t('general.saving') : t('general.saveButton')}
                </Button>
              </form>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo">
              <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center py-16">
                <p className="text-sm text-slate-400 dark:text-zinc-500">
                  Advanced SEO settings (meta description, Open Graph, sitemap) are coming soon.
                </p>
              </div>
            </TabsContent>

            {/* Danger */}
            <TabsContent value="danger">
              <Card className="border-destructive/30 dark:border-red-900/40">
                <CardHeader>
                  <CardTitle className="text-destructive text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t('danger.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('danger.deleteBlogDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('danger.confirmDescription')}{' '}
                    <strong className="text-slate-800 dark:text-slate-100">{tenant?.name}</strong>:
                  </p>
                  <input
                    className="w-full max-w-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-destructive/30"
                    placeholder={tenant?.name ?? ''}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteConfirm !== tenant?.name || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                    className="gap-1.5"
                  >
                    {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('danger.confirmButton')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
}
