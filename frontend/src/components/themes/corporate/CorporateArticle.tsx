'use client';

import { useState, useEffect, useMemo, useCallback, type CSSProperties, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock, Calendar, ChevronRight, Hash,
  ArrowLeft, BookOpen, TrendingUp, Heart, Eye,
  Twitter, Linkedin, Link2, Check, MessageCircle,
  ThumbsUp, Reply, ChevronDown, ChevronUp,
  List, Send,
} from 'lucide-react';

import type { ArticleProps } from '../ThemeRenderer';
import type { MockComment } from './mock-data';
import {
  CorporateHeader, CorporateFooter, NewsletterSection,
  CardMedium, fmtDate, fmtDateShort, grad,
} from './shared';

// ─── Extended props ────────────────────────────────────────────────────────────

interface CorporateArticleProps extends ArticleProps {
  comments?: MockComment[];
}

// ─── TOC ──────────────────────────────────────────────────────────────────────

interface TocItem { id: string; text: string; level: number }

function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML special chars first (avoid XSS from raw <> in content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr>')
    // Blockquote
    .replace(/^&gt;\s*(.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists (convert consecutive items)
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Images before links (order matters)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:1em 0" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">$1</a>')
    // Bold + italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.9em">$1</code>');

  // Wrap <li> sequences in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(\s*<li>[\s\S]*?<\/li>)*/g, m => `<ul style="padding-left:1.5em;margin:1em 0">${m}</ul>`);

  // Wrap plain text paragraphs (lines not already wrapped in block tags)
  const blockTags = /^<(h[1-6]|ul|ol|li|blockquote|hr|img|pre|div)/;
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (blockTags.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

function processContent(source: string): { processed: string; toc: TocItem[] } {
  // Detect if content is Markdown (no HTML tags) or already HTML
  const isMarkdown = !/<[a-z][\s\S]*>/i.test(source);
  const html = isMarkdown ? markdownToHtml(source) : source;

  let i = 0;
  const toc: TocItem[] = [];
  const processed = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, lvl, attrs, inner) => {
    const id = `section-${i++}`;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    toc.push({ id, text, level: parseInt(lvl) });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
  return { processed, toc };
}

// ─── Comment card ─────────────────────────────────────────────────────────────

function CommentCard({
  comment, primaryColor, depth = 0,
}: {
  comment: MockComment;
  primaryColor: string;
  depth?: number;
}) {
  const [likes, setLikes] = useState(comment.likes);
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(depth === 0);
  const [replyName, setReplyName] = useState('');
  const [replyText, setReplyText] = useState('');
  const [localReplies, setLocalReplies] = useState<MockComment[]>(comment.replies ?? []);
  const [replyDone, setReplyDone] = useState(false);

  const submitReply = (e: FormEvent) => {
    e.preventDefault();
    if (!replyName.trim() || !replyText.trim()) return;
    const r: MockComment = {
      id: `r-${Date.now()}`,
      author: replyName,
      initials: replyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: primaryColor,
      content: replyText,
      published_at: new Date().toISOString(),
      likes: 0,
    };
    setLocalReplies(prev => [...prev, r]);
    setReplyName('');
    setReplyText('');
    setShowReply(false);
    setReplyDone(true);
    setShowReplies(true);
  };

  return (
    <div className={depth > 0 ? 'ml-10 pl-5 border-l-2 border-slate-100' : ''}>
      <div className="flex gap-4 py-5">
        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow"
          style={{ backgroundColor: comment.avatarColor }}
        >
          {comment.initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{comment.author}</span>
            <span className="text-xs text-slate-400">{fmtDate(comment.published_at)}</span>
          </div>

          {/* Content */}
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLiked(l => !l); setLikes(c => liked ? c - 1 : c + 1); }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked ? 'text-[var(--cp)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {likes > 0 && <span>{likes}</span>}
              <span>Utile</span>
            </button>
            {depth === 0 && (
              <button
                onClick={() => setShowReply(r => !r)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Reply className="h-3.5 w-3.5" />
                Répondre
              </button>
            )}
            {depth === 0 && localReplies.length > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors ml-auto"
              >
                {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {localReplies.length} réponse{localReplies.length > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReply && (
            <form onSubmit={submitReply} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                value={replyName} onChange={e => setReplyName(e.target.value)}
                placeholder="Votre nom"
                className="w-full mb-2 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:border-[var(--cp)]"
                style={{ '--tw-ring-color': `${primaryColor}40` } as CSSProperties}
              />
              <textarea
                value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Votre réponse…"
                rows={3}
                className="w-full mb-3 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--cp)]"
                style={{ '--tw-ring-color': `${primaryColor}40` } as CSSProperties}
              />
              <div className="flex gap-2">
                <button type="submit"
                  className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}>
                  <Send className="h-3.5 w-3.5" /> Envoyer
                </button>
                <button type="button" onClick={() => setShowReply(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          )}
          {replyDone && (
            <p className="mt-3 text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Réponse publiée
            </p>
          )}
        </div>
      </div>

      {/* Replies */}
      {depth === 0 && showReplies && localReplies.map(r => (
        <CommentCard key={r.id} comment={r} primaryColor={primaryColor} depth={1} />
      ))}
    </div>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────

function CommentsSection({ comments, primaryColor }: { comments: MockComment[]; primaryColor: string }) {
  const [all, setAll] = useState(comments);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const c: MockComment = {
      id: `c-${Date.now()}`,
      author: name,
      initials: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: primaryColor,
      content: text,
      published_at: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    setAll(prev => [c, ...prev]);
    setName(''); setEmail(''); setText('');
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  };

  const ring = { '--tw-ring-color': `${primaryColor}40` } as CSSProperties;

  return (
    <section className="mt-14 pt-10 border-t border-slate-100" id="comments">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
        <h2 className="text-lg font-black text-slate-900">
          Commentaires <span className="text-slate-400 font-normal text-base">({all.length})</span>
        </h2>
      </div>

      {/* Form */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Laisser un commentaire</h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nom <span className="text-red-400">*</span></label>
              <input
                value={name} onChange={e => setName(e.target.value)} required
                placeholder="Jean Dupont"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2"
                style={ring}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email <span className="text-slate-300">(non publié)</span></label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jean@exemple.fr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2"
                style={ring}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Commentaire <span className="text-red-400">*</span></label>
            <textarea
              value={text} onChange={e => setText(e.target.value)} required rows={4}
              placeholder="Partagez votre avis, votre expérience ou posez une question…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2"
              style={ring}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">Votre email ne sera jamais affiché ni partagé.</p>
            <button
              type="submit"
              className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shrink-0"
              style={{ backgroundColor: primaryColor }}>
              <Send className="h-4 w-4" /> Publier
            </button>
          </div>
        </form>
        {done && (
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
            <Check className="h-4 w-4" /> Commentaire publié avec succès !
          </div>
        )}
      </div>

      {/* List */}
      {all.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-medium">Soyez le premier à commenter cet article.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {all.map(c => (
            <CommentCard key={c.id} comment={c} primaryColor={primaryColor} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CorporateArticle({
  blog, article, relatedArticles, getArticleHref, comments = [], basePath: baseProp, previewSlug,
}: CorporateArticleProps) {
  const primaryColor = blog.primary_color || '#2563eb';
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = baseProp ?? (getArticleHref || blog.slug === 'demo' ? '/en/template' : `/${locale}/${blog.slug}`);
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!article.cover_image_url && !imgErr;
  const gradient = grad(article.id);

  // Reading progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const pct = scrollHeight - clientHeight > 0
        ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
        : 100;
      setProgress(pct);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // TOC
  const { processed: processedContent, toc } = useMemo(() => {
    if (!article.content) return { processed: '', toc: [] as TocItem[] };
    return processContent(article.content);
  }, [article.content]);

  // Scrollspy
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0% -65% 0%', threshold: 0 },
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const toggleLike = () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  // Share
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const shareTwitter = () => {
    if (typeof window !== 'undefined')
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };
  const shareLinkedin = () => {
    if (typeof window !== 'undefined')
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.title)}`, '_blank');
  };

  const aHref = useCallback(
    (slug: string) => {
      if (getArticleHref) return getArticleHref(slug);
      if (basePath) {
        const pq = previewSlug ? `?preview=${previewSlug}` : '';
        return `${basePath}/${slug}${pq}`;
      }
      return `../${slug}`;
    },
    [getArticleHref, basePath, previewSlug],
  );

  const cpStyle = {
    '--cp': primaryColor,
    fontFamily: blog.font_family
      ? `'${blog.font_family}', system-ui, sans-serif`
      : 'system-ui, -apple-system, sans-serif',
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>

      {/* Reading progress */}
      <div
        className="fixed top-0 left-0 z-[100] h-0.5 bg-[var(--cp)] transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <CorporateHeader
        blog={blog}
        categories={[]}
        primaryColor={primaryColor}
        minimal
        basePath={basePath}
        previewSlug={previewSlug}
      />

      {/* ── BREADCRUMB ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto scrollbar-none">
          <Link href=".." className="shrink-0 hover:text-slate-700 transition-colors">Accueil</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {article.category_name && article.category_slug && (
            <>
              <Link href={`..?category=${article.category_slug}`} className="shrink-0 hover:text-slate-700 transition-colors capitalize">
                {article.category_name}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          <span className="text-slate-600 font-medium truncate">{article.title}</span>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN LAYOUT ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-12 lg:gap-16">

        {/* ── LEFT: ARTICLE ───────────────────────────────────────────────────── */}
        <article>
          <header className="mb-8">
            {/* Category + Premium */}
            <div className="flex items-center gap-2 mb-5">
              {article.category_name && (
                <Link
                  href={`..?category=${article.category_slug}`}
                  className="inline-block text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl text-white"
                  style={{ backgroundColor: primaryColor }}>
                  {article.category_name}
                </Link>
              )}
              {article.is_paid && (
                <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-amber-400 text-amber-900">Premium</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-slate-900 mb-5 tracking-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-slate-500 leading-relaxed mb-7 font-light border-l-4 pl-5" style={{ borderColor: primaryColor }}>
                {article.excerpt}
              </p>
            )}

            {/* Meta bar */}
            <div className="flex items-center gap-4 py-4 border-y border-slate-100 flex-wrap">
              {article.author_name && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
                    style={{ backgroundColor: primaryColor }}>
                    {article.author_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">Auteur</p>
                    <p className="font-bold text-slate-800 text-sm leading-none">{article.author_name}</p>
                  </div>
                </div>
              )}

              <div className="h-7 w-px bg-slate-100 hidden sm:block" />

              {article.published_at && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {fmtDate(article.published_at)}
                </div>
              )}
              {article.reading_time_minutes && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4 shrink-0" />
                  {article.reading_time_minutes} min
                </div>
              )}
              {article.views_count !== undefined && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Eye className="h-4 w-4 shrink-0" />
                  {article.views_count.toLocaleString('fr-FR')} vues
                </div>
              )}

              {/* Likes */}
              <button
                onClick={toggleLike}
                className={`ml-auto flex items-center gap-2 h-9 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                  liked
                    ? 'text-white border-[var(--cp)]'
                    : 'text-slate-500 border-slate-200 hover:border-[var(--cp)] hover:text-[var(--cp)]'
                }`}
                style={liked ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-white' : ''}`} />
                <span>{likeCount.toLocaleString('fr-FR')}</span>
              </button>
            </div>
          </header>

          {/* Cover image */}
          <div className="relative rounded-3xl overflow-hidden mb-10 aspect-[16/9] bg-slate-100 shadow-xl">
            {hasImg ? (
              <Image
                src={article.cover_image_url!}
                alt={article.title}
                fill className="object-cover"
                priority
                onError={() => setImgErr(true)}
                sizes="(max-width:900px) 100vw, 800px"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            )}
          </div>

          {/* Mobile TOC */}
          {toc.length > 0 && (
            <MobileToc toc={toc} activeId={activeId} primaryColor={primaryColor} />
          )}

          {/* Content */}
          {processedContent && (
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-5
                prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-md
                prose-code:text-sm prose-code:rounded-lg prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-slate-100 prose-code:text-slate-700 prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                prose-pre:bg-slate-950 prose-pre:rounded-2xl prose-pre:shadow-xl prose-pre:text-sm
                prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:not-italic prose-blockquote:text-slate-500 prose-blockquote:font-light prose-blockquote:text-lg prose-blockquote:bg-slate-50 prose-blockquote:py-3 prose-blockquote:rounded-r-xl
                prose-ul:text-slate-600 prose-ol:text-slate-600
                prose-li:marker:text-[var(--cp)] prose-li:mb-1.5
                prose-strong:text-slate-800 prose-strong:font-bold
                prose-hr:border-slate-100"
              style={{ '--tw-prose-links': primaryColor } as CSSProperties}
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          )}

          {/* Share */}
          <div className="flex items-center gap-3 mt-12 pt-8 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">Partager</span>
            <button onClick={shareTwitter}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all bg-white">
              <Twitter className="h-4 w-4" /> Twitter
            </button>
            <button onClick={shareLinkedin}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all bg-white">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </button>
            <button onClick={copyLink}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-all bg-white ${
                copied
                  ? 'border-emerald-300 text-emerald-600 bg-emerald-50'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
              }`}>
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
              <Eye className="h-4 w-4" />
              {(article.views_count ?? 0).toLocaleString('fr-FR')} vues
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              <Hash className="h-4 w-4 text-slate-400 shrink-0" />
              {article.tags.map(t => (
                <Link key={t} href={`..?q=${encodeURIComponent(t)}`}
                  className="text-sm px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-[var(--cp)] hover:text-[var(--cp)] transition-colors bg-slate-50">
                  {t}
                </Link>
              ))}
            </div>
          )}

          {/* Author bio */}
          {article.author_name && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex gap-5 items-start bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow"
                  style={{ backgroundColor: primaryColor }}>
                  {article.author_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">À propos de l'auteur</p>
                  <h3 className="font-black text-slate-900 text-xl mb-2">{article.author_name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Auteur et expert contribuant régulièrement à <strong className="text-slate-700">{blog.name}</strong>.
                    Passionné par son domaine, il partage analyses approfondies, expériences terrain et perspectives d'avenir pour aider les professionnels à prendre les meilleures décisions.
                  </p>
                  <Link href=".."
                    className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-[var(--cp)] hover:text-[var(--cp)] transition-all bg-white">
                    <BookOpen className="h-3.5 w-3.5" />
                    Voir tous ses articles
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentsSection comments={comments} primaryColor={primaryColor} />

          {/* Back link */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <Link href=".."
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--cp)] transition-colors group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
          </div>
        </article>

        {/* ── RIGHT: STICKY SIDEBAR ───────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">

            {/* Table of contents */}
            {toc.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <List className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Dans cet article</h3>
                </div>
                <nav className="space-y-0.5">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 text-sm rounded-lg px-2 transition-all duration-150 leading-snug ${
                        item.level === 3 ? 'ml-3 text-xs' : ''
                      } ${
                        activeId === item.id
                          ? 'font-bold text-[var(--cp)] bg-[var(--cp)]/5'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Popular / related in sidebar */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Articles similaires</h3>
                </div>
                <div className="space-y-0">
                  {relatedArticles.slice(0, 4).map((a, i) => (
                    <Link key={a.id} href={aHref(a.slug)}
                      className="group flex gap-3 py-3 border-b border-slate-100 last:border-0">
                      <span className="text-xl font-black text-slate-100 w-6 shrink-0 leading-none mt-0.5 select-none">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {a.category_name && (
                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>{a.category_name}</span>
                        )}
                        <p className="text-xs font-bold text-slate-700 group-hover:text-[var(--cp)] leading-snug line-clamp-2 mt-0.5 transition-colors">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{a.reading_time_minutes} min · {fmtDateShort(a.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter mini */}
            <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 mb-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-black text-base mb-1.5 leading-tight">Rejoignez la newsletter</h3>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Chaque semaine, nos meilleures analyses dans votre boîte mail.
              </p>
              <a href="#newsletter"
                className="flex items-center justify-center gap-2 h-9 w-full rounded-xl bg-white text-xs font-bold hover:bg-white/90 transition-colors"
                style={{ color: primaryColor }}>
                S'abonner gratuitement
              </a>
            </div>

            {/* Like CTA */}
            <button
              onClick={toggleLike}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl border-2 text-sm font-bold transition-all duration-200 ${
                liked
                  ? 'text-white border-[var(--cp)]'
                  : 'border-slate-200 text-slate-500 hover:border-[var(--cp)] hover:text-[var(--cp)]'
              }`}
              style={liked ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-white' : ''}`} />
              {liked ? 'Vous aimez cet article !' : `J'aime cet article (${likeCount})`}
            </button>
          </div>
        </aside>
      </div>

      {/* ── RELATED ARTICLES ──────────────────────────────────────────────────── */}
      {relatedArticles.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-100 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Vous aimerez aussi</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map(a => (
                <CardMedium key={a.id} article={a} href={aHref(a.slug)} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href=".."
                className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl border-2 hover:bg-[var(--cp)] hover:text-white transition-all duration-200"
                style={{ borderColor: primaryColor, color: primaryColor }}>
                <BookOpen className="h-4 w-4" />
                Voir tous les articles
              </Link>
            </div>
          </div>
        </section>
      )}

      <NewsletterSection blog={blog} primaryColor={primaryColor} />
      <CorporateFooter blog={blog} categories={[]} primaryColor={primaryColor} basePath={basePath} previewSlug={previewSlug} />
    </div>
  );
}

// ─── Mobile TOC ───────────────────────────────────────────────────────────────

function MobileToc({ toc, activeId, primaryColor }: { toc: TocItem[]; activeId: string; primaryColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden mb-8 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700"
      >
        <div className="flex items-center gap-2">
          <List className="h-4 w-4" style={{ color: primaryColor }} />
          Sommaire
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <nav className="px-5 pb-4 space-y-0.5">
          {toc.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              className={`block py-1.5 text-sm rounded-lg px-2 transition-all ${
                item.level === 3 ? 'ml-3 text-xs' : ''
              } ${
                activeId === item.id
                  ? 'font-bold text-[var(--cp)] bg-[var(--cp)]/5'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              style={{ '--cp': primaryColor } as CSSProperties}
            >
              {item.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
