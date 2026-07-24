'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, Mail, Crown, Edit3, Feather, Eye, Trash2, Clock, ChevronDown } from 'lucide-react';
import { teamApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; labelKey: string; descKey: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { value: 'EDITOR',  labelKey: 'collabRoleEditor',  descKey: 'collabRoleEditorDesc',  icon: Edit3,   color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-200 dark:border-violet-700' },
  { value: 'AUTHOR',  labelKey: 'collabRoleAuthor',  descKey: 'collabRoleAuthorDesc',  icon: Feather,  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',     border: 'border-blue-200 dark:border-blue-700'   },
  { value: 'VIEWER',  labelKey: 'collabRoleViewer',  descKey: 'collabRoleViewerDesc',  icon: Eye,      color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700',     border: 'border-slate-200 dark:border-slate-600' },
];

function getInitials(name: string | null, email: string) {
  const src = name || email;
  return src.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function RoleBadge({ role, ts }: { role: UserRole; ts: (k: string) => string }) {
  const r = ROLES.find(r => r.value === role);
  if (!r) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{role}</span>;
  const Icon = r.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10px] font-bold border ${r.bg} ${r.color} ${r.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {role === 'TENANT_ADMIN' ? ts('collabRoleAdmin') : ts(r.labelKey)}
    </span>
  );
}

function MemberAvatar({ name, email, size = 'md' }: { name: string | null; email: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-[11px]';
  return (
    <div className={`${s} rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(name, email)}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, iconBorder, iconColor }: {
  label: string; value: number;
  icon: React.ElementType; iconBg: string; iconBorder: string; iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm px-5 py-5">
      <div className={`h-9 w-9 rounded-xl border ${iconBorder} ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className="text-[26px] font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

export default function CollaboratorsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('AUTHOR');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('AUTHOR');

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', blogId],
    queryFn: async () => { const { data } = await teamApi.listMembers(blogId); return data; },
  });

  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['team-invitations', blogId],
    queryFn: async () => { const { data } = await teamApi.listInvitations(blogId); return data; },
  });

  const inviteMutation = useMutation({
    mutationFn: () => teamApi.invite(blogId, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-invitations', blogId] });
      toast({ title: ts('collabInviteSuccess') });
      setInviteEmail('');
      setShowInviteForm(false);
    },
    onError: () => toast({ variant: 'destructive', title: ts('collabInviteError') }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamApi.remove(blogId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members', blogId] });
      toast({ title: ts('collabRemoved') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      teamApi.updateRole(blogId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members', blogId] });
      toast({ title: ts('collabRoleChanged') });
      setEditingUserId(null);
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const nonAdminMembers = members.filter(m => m.role !== 'TENANT_ADMIN');
  const adminMembers = members.filter(m => m.role === 'TENANT_ADMIN');
  const editorCount = members.filter(m => m.role === 'EDITOR').length;
  const authorCount = members.filter(m => m.role === 'AUTHOR').length;

  return (
    <FullPageShell
      title={ts('pageCollaborators')}
      description={ts('pageCollaboratorsDesc')}
      action={
        <button
          onClick={() => setShowInviteForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {ts('collabInviteBtn')}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label={ts('collabStatMembers')}
            value={members.length}
            icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconBorder="border-blue-100 dark:border-blue-800"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label={ts('collabStatEditors')}
            value={editorCount}
            icon={Edit3}
            iconBg="bg-violet-50 dark:bg-violet-900/30"
            iconBorder="border-violet-100 dark:border-violet-800"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label={ts('collabStatAuthors')}
            value={authorCount}
            icon={Feather}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            iconBorder="border-emerald-100 dark:border-emerald-800"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm p-5">
            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-4">{ts('collabInviteBtn')}</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{ts('collabInviteEmail')}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder={ts('placeholderCollaboratorEmail')}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
                />
              </div>
              <div className="w-40 shrink-0">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{ts('collabInviteRole')}</label>
                <div className="relative">
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 appearance-none cursor-pointer"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{ts(r.labelKey)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-semibold transition-colors"
                >
                  {ts('collabInviteSend')}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {ts('cancel')}
                </button>
              </div>
            </div>

            {/* Role descriptions */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.value} className={`flex items-start gap-2.5 p-3 rounded-xl border ${inviteRole === r.value ? `${r.bg} ${r.border}` : 'border-slate-100 dark:border-slate-800'} transition-colors cursor-pointer`} onClick={() => setInviteRole(r.value)}>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${r.bg} border ${r.border}`}>
                      <Icon className={`h-3.5 w-3.5 ${r.color}`} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold ${inviteRole === r.value ? r.color : 'text-slate-700 dark:text-slate-300'}`}>{ts(r.labelKey)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{ts(r.descKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admins */}
        {adminMembers.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ts('administrators')}</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {adminMembers.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 px-5 py-4">
                  <MemberAvatar name={m.display_name} email={m.email} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {m.display_name || m.email.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">{m.email}</p>
                  </div>
                  <RoleBadge role={m.role} ts={ts} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ts('collabMembersTitle')}</p>
          </div>

          {loadingMembers ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : nonAdminMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">{ts('collabNoMembers')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {nonAdminMembers.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <MemberAvatar name={m.display_name} email={m.email} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {m.display_name || m.email.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">{m.email}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{ts('collabJoinedAt')} {fmtDate(m.joined_at)}</p>
                  </div>

                  {/* Role editor inline */}
                  {editingUserId === m.user_id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select
                          value={editingRole}
                          onChange={e => setEditingRole(e.target.value as UserRole)}
                          className="h-8 pl-2 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{ts(r.labelKey)}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                      </div>
                      <button
                        onClick={() => updateRoleMutation.mutate({ userId: m.user_id, role: editingRole })}
                        disabled={updateRoleMutation.isPending}
                        className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingUserId(m.user_id); setEditingRole(m.role); }}
                        className="flex items-center gap-1.5"
                        title={ts('changeRole')}
                      >
                        <RoleBadge role={m.role} ts={ts} />
                      </button>
                      <button
                        onClick={() => { if (confirm(ts('collabRemove') + ' ?')) removeMutation.mutate(m.user_id); }}
                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        title={ts('collabRemove')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invitations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ts('collabInvitationsTitle')}</p>
            {invitations.length > 0 && (
              <span className="ml-auto bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-px text-[9px] font-bold">
                {invitations.length}
              </span>
            )}
          </div>

          {loadingInvitations ? (
            <div className="p-5"><div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /></div>
          ) : invitations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[12px] text-slate-400 dark:text-slate-500">{ts('collabNoInvitations')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate font-mono">{inv.email}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{ts('collabExpires')} {fmtDate(inv.expires_at)}</p>
                  </div>
                  <RoleBadge role={inv.role} ts={ts} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full ml-1">
                    {ts('pendingInvite')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </FullPageShell>
  );
}
