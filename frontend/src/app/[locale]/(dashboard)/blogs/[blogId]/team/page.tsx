'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { UserPlus, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { teamApi, tenantsApi } from '@/lib/api';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getInitials, formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'author', 'viewer']),
  message: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  tenant_admin: 'default',
  editor: 'secondary',
  author: 'secondary',
  viewer: 'outline',
};

export default function TeamPage() {
  const t = useTranslations('team');
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['team', blogId],
    queryFn: () => teamApi.list(blogId).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'author' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => teamApi.invite(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', blogId] });
      toast({ variant: 'success', title: t('invite.success') });
      setInviteOpen(false);
      reset();
    },
    onError: () => toast({ variant: 'destructive', title: t('invite.error') }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamApi.remove(blogId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', blogId] });
      toast({ title: 'Member removed' });
    },
  });

  const members = data?.members ?? [];

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[{ label: tenant?.name ?? '…' }, { label: t('title') }]}
      actions={
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          {t('inviteButton')}
        </Button>
      }
    >
      <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('title')}</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 py-16 text-center bg-white dark:bg-zinc-900">
              <p className="text-sm text-slate-400 dark:text-zinc-500">{t('noMembers')}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {members.map((member, i) => (
                <div key={member.user_id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${i > 0 ? 'border-t border-slate-50 dark:border-zinc-800' : ''}`}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-violet-500 text-white font-bold">
                      {getInitials(member.display_name ?? member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{member.display_name ?? '—'}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{member.email}</p>
                  </div>
                  <Badge variant={ROLE_VARIANT[member.role]} className="capitalize text-[10px] shrink-0">
                    {t(`roles.${member.role}`)}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 hidden md:block shrink-0">
                    {formatDate(member.joined_at, locale)}
                  </span>
                  {member.role !== 'tenant_admin' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-300 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => removeMutation.mutate(member.user_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('invite.title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t('invite.emailLabel')}</Label>
              <Input placeholder={t('invite.emailPlaceholder')} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('invite.roleLabel')}</Label>
              <Select value={watch('role')} onValueChange={(v) => setValue('role', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">{t('roles.editor')}</SelectItem>
                  <SelectItem value="author">{t('roles.author')}</SelectItem>
                  <SelectItem value="viewer">{t('roles.viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {inviteMutation.isPending ? t('invite.sending') : t('invite.sendButton')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
