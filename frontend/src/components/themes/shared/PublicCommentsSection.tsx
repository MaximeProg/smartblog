'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import { MessageCircle, Send, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface PublicComment {
  id: string;
  content: string;
  author: { display_name: string | null };
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
    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

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
    fetch(`${API_BASE}/api/v1/public/${blogSlug}/articles/${articleSlug}/comments`)
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
      const res = await fetch(`${API_BASE}/api/v1/public/${blogSlug}/articles/${articleSlug}/comments`, {
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
    <section className="mt-14 pt-10 border-t border-slate-100" id="comments">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
        <h2 className="text-lg font-black text-slate-900">
          {t('comments')}
          {!loading && <span className="text-slate-400 font-normal text-base ml-2">({comments.length})</span>}
        </h2>
      </div>

      {/* Comment form */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4">{t('leaveComment')}</h3>

        {done ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2"
                style={ring}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">{t('commentFormEmailPrivacy')}</p>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}>
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
        <div className="divide-y divide-slate-100">
          {comments.map(c => (
            <div key={c.id} className="py-5 first:pt-0">
              <div className="flex items-start gap-3">
                <Avatar name={c.author.display_name ?? '?'} color={primaryColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{c.author.display_name}</span>
                    <span className="text-xs text-slate-400">{fmtDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
