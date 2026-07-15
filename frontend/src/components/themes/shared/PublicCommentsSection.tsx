'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import { MessageCircle, Send, Check, Loader2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PublicComment {
  id: string;
  content: string;
  author: { display_name: string | null };
  parent_id: string | null;
  created_at: string;
  replies_count: number;
}

interface Props {
  blogSlug: string;
  articleSlug: string;
  primaryColor: string;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div
      className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function SmallAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div
      className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ── Inline reply form ─────────────────────────────────────────────

function ReplyForm({
  blogSlug, articleSlug, parentId, primaryColor, onDone, onCancel,
}: {
  blogSlug: string;
  articleSlug: string;
  parentId: string;
  primaryColor: string;
  onDone: (reply: PublicComment) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('publicBlog');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const ring = { '--tw-ring-color': `${primaryColor}40` } as CSSProperties;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/public-proxy/${blogSlug}/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim(), author_name: name.trim(), parent_id: parentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || 'error');
      }
      const reply: PublicComment = await res.json();
      onDone(reply);
    } catch (err: any) {
      setError(err.message || t('contactErrorMsg'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 ml-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={name} onChange={e => setName(e.target.value)} required
          placeholder={t('commentFormNamePlaceholder')}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2"
          style={ring}
        />
      </div>
      <textarea
        value={text} onChange={e => setText(e.target.value)} required rows={3}
        placeholder={t('commentFormPlaceholder')}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none focus:outline-none focus:ring-2"
        style={ring}
      />
      {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          {t('cancel') ?? 'Annuler'}
        </button>
        <button
          type="submit" disabled={submitting}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold text-white disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {t('commentSubmitButton')}
        </button>
      </div>
    </form>
  );
}

// ── Single comment with replies ───────────────────────────────────

function CommentItem({
  comment, blogSlug, articleSlug, primaryColor,
}: {
  comment: PublicComment;
  blogSlug: string;
  articleSlug: string;
  primaryColor: string;
}) {
  const t = useTranslations('publicBlog');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<PublicComment[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count);
  const [replyPending, setReplyPending] = useState(false);

  async function loadReplies() {
    if (repliesLoading) return;
    setRepliesLoading(true);
    try {
      const res = await fetch(
        `/api/public-proxy/${blogSlug}/articles/${articleSlug}/comments/${comment.id}/replies`
      );
      if (res.ok) setReplies(await res.json());
    } catch {
      // ignore
    } finally {
      setRepliesLoading(false);
    }
  }

  async function toggleReplies() {
    if (!showReplies && replies.length === 0) await loadReplies();
    setShowReplies(v => !v);
  }

  function handleReplyDone(reply: PublicComment) {
    setShowReplyForm(false);
    setReplyPending(true);
    // optimistically bump count — reply is PENDING (awaiting moderation)
    setRepliesCount(n => n + 1);
  }

  const authorName = comment.author.display_name ?? 'Anonymous';

  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-start gap-3">
        <Avatar name={authorName} color={primaryColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{authorName}</span>
            <span className="text-xs text-slate-400">{fmtDate(comment.created_at)}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.content}</p>

          {/* Action bar */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => { setShowReplyForm(v => !v); setReplyPending(false); }}
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: primaryColor }}
            >
              <CornerDownRight className="h-3 w-3" />
              {t('replyButton') ?? 'Répondre'}
            </button>

            {repliesCount > 0 && (
              <button
                type="button"
                onClick={toggleReplies}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                {showReplies
                  ? <><ChevronUp className="h-3 w-3" /> {t('hideReplies') ?? 'Masquer les réponses'}</>
                  : <><ChevronDown className="h-3 w-3" /> {repliesLoading ? '…' : `${repliesCount} ${repliesCount === 1 ? (t('reply') ?? 'réponse') : (t('replies') ?? 'réponses')}`}</>
                }
              </button>
            )}
          </div>

          {/* Pending notice after reply submitted */}
          {replyPending && !showReplyForm && (
            <div className="mt-2 ml-0 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-3 py-2 rounded-xl w-fit">
              <Check className="h-3.5 w-3.5" />
              {t('commentPending')}
            </div>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <ReplyForm
              blogSlug={blogSlug}
              articleSlug={articleSlug}
              parentId={comment.id}
              primaryColor={primaryColor}
              onDone={handleReplyDone}
              onCancel={() => setShowReplyForm(false)}
            />
          )}

          {/* Replies list */}
          {showReplies && (
            <div className="mt-3 ml-5 border-l-2 pl-4 space-y-3" style={{ borderColor: `${primaryColor}30` }}>
              {repliesLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…
                </div>
              )}
              {replies.map(r => {
                const rAuthor = r.author.display_name ?? 'Anonymous';
                return (
                  <div key={r.id} className="flex items-start gap-2.5">
                    <SmallAvatar name={rAuthor} color={primaryColor} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{rAuthor}</span>
                        <span className="text-[10px] text-slate-400">{fmtDate(r.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{r.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────

export function PublicCommentsSection({ blogSlug, articleSlug, primaryColor }: Props) {
  const t = useTranslations('publicBlog');
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public-proxy/${blogSlug}/articles/${articleSlug}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [blogSlug, articleSlug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/public-proxy/${blogSlug}/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim(), author_name: name.trim(), author_email: email.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || 'error');
      }
      setName(''); setEmail(''); setText('');
      setDone(true);
      setTimeout(() => setDone(false), 6000);
    } catch (err: any) {
      setError(err.message || t('contactErrorMsg'));
    } finally {
      setSubmitting(false);
    }
  }

  const ring = { '--tw-ring-color': `${primaryColor}40` } as CSSProperties;

  return (
    <section className="mt-14 pt-10 border-t border-slate-100 dark:border-slate-800" id="comments">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {t('comments')}
          {!loading && <span className="text-slate-400 font-normal text-base ml-2">({comments.length})</span>}
        </h2>
      </div>

      {/* New comment form */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{t('leaveComment')}</h3>

        {done ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <Check className="h-4 w-4" /> {t('commentPending')}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t('commentFormNameLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  value={name} onChange={e => setName(e.target.value)} required
                  placeholder={t('commentFormNamePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2"
                  style={ring}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t('commentFormEmailLabel')} <span className="text-slate-300 font-normal">{t('commentFormEmailNote')}</span>
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t('commentFormEmailPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2"
                  style={ring}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {t('commentLabel')} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={text} onChange={e => setText(e.target.value)} required rows={4}
                placeholder={t('commentFormPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2"
                style={ring}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">{t('commentFormEmailPrivacy')}</p>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('contactSendingButton')}</>
                  : <><Send className="h-4 w-4" /> {t('commentSubmitButton')}</>
                }
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-medium">{t('beFirstToComment')}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              blogSlug={blogSlug}
              articleSlug={articleSlug}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      )}
    </section>
  );
}
