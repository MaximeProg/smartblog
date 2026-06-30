'use client';
import { useState, useEffect, useCallback, type CSSProperties, type ReactNode, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, Moon, Sun, Clock, Eye, Heart, Search, ChevronRight,
  Share2, Twitter, Facebook, Linkedin, Copy, Check, ArrowLeft,
  List, ChevronDown, ChevronUp, MessageSquare, Send, Rss,
  Youtube, Instagram,
  BookOpen, Tag,
} from 'lucide-react';
import { ReadingProgress } from '../shared/ReadingProgress';
import { AudioPlayer } from '../shared/AudioPlayer';
import type { ArticleProps } from '../ThemeRenderer';
import type { PublicArticle } from '@/lib/public-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateShort(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ─── Share Button ─── */
function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-600 transition-colors">
        <Twitter className="h-3.5 w-3.5" /> Twitter
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
        <Facebook className="h-3.5 w-3.5" /> Facebook
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors">
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </a>
      <button onClick={copy}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copié !' : 'Copier le lien'}
      </button>
    </div>
  );
}

/* ─── Table of Contents ─── */
function TableOfContents() {
  interface Heading { id: string; text: string; level: number }
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const article = document.querySelector('.article-content');
    if (!article) return;
    const els = Array.from(article.querySelectorAll('h2, h3, h4')) as HTMLElement[];
    const parsed = els.map((el, i) => {
      if (!el.id) el.id = `h-${i}`;
      return { id: el.id, text: el.textContent ?? '', level: parseInt(el.tagName[1]) };
    });
    setHeadings(parsed);

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-10% 0% -70% 0%' },
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 2) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <List className="h-3.5 w-3.5" /> Sommaire
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>
      {open && (
        <nav className="px-4 pb-4 space-y-0.5 max-h-72 overflow-y-auto">
          {headings.map(h => (
            <button key={h.id} onClick={() => scrollTo(h.id)}
              className={`w-full text-left text-sm py-1 rounded transition-colors ${h.level >= 3 ? 'pl-4' : ''} ${h.level >= 4 ? 'pl-7' : ''} ${
                activeId === h.id
                  ? 'font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              style={activeId === h.id ? { color: 'var(--blog-primary)' } : {}}>
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

/* ─── Related Article Card ─── */
function RelatedCard({ article, href }: { article: PublicArticle; href: string }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
        {article.cover_image_url && !imgErr
          ? <Image src={article.cover_image_url} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} sizes="(max-width:768px) 100vw, 33vw" />
          : <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-600" /></div>}
        {article.category_name && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {article.category_name}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm group-hover:underline underline-offset-2 leading-snug">
        {article.title}
      </h3>
      <p className="text-xs text-gray-400 mt-1">{fmtDateShort(article.published_at)}</p>
    </Link>
  );
}

/* ─── Comments ─── */
function Comments({ slug, articleSlug }: { slug: string; articleSlug: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${slug}/articles/${articleSlug}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) { setName(''); setEmail(''); setMessage(''); }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <h3 className="font-bold text-gray-900 dark:text-white">Commentaires</h3>
      </div>

      {status === 'ok' ? (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          ✓ Votre commentaire a été soumis et sera publié après modération.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nom *</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--blog-primary)]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com (privé)"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--blog-primary)]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Message *</label>
            <textarea required value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Partagez votre avis…"
              rows={4}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--blog-primary)]/40"
            />
          </div>
          {status === 'error' && (
            <p className="text-sm text-red-500">Une erreur est survenue — réessayez.</p>
          )}
          <button type="submit" disabled={status === 'loading'}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--blog-primary)' }}>
            <Send className="h-3.5 w-3.5" />
            {status === 'loading' ? 'Envoi…' : 'Publier le commentaire'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function MinimalArticle({
  blog, article, relatedArticles, getArticleHref: _getArticleHref,
}: ArticleProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerQ, setHeaderQ] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [imgErr, setImgErr] = useState(false);

  const getArticleHref = useCallback(
    (slug: string) => _getArticleHref ? _getArticleHref(slug) : `./${slug}`,
    [_getArticleHref],
  );

  const primaryColor = blog.primary_color || '#2563eb';
  const articleUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://${blog.slug}.nexusblog.io/${article.slug}`;

  const socialIcons: Record<string, ReactNode> = {
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
  };

  const handleHeaderSearch = (e: FormEvent) => {
    e.preventDefault();
    if (headerQ.trim()) router.push(`/?q=${encodeURIComponent(headerQ.trim())}`);
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`${API_URL}/api/v1/public/${blog.slug}/articles/${article.slug}/like`, { method: 'POST' });
    } catch {
      // non-critical
    }
  };

  const handleNewsletterSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    setNewsStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsEmail }),
      });
      setNewsStatus(res.ok ? 'ok' : 'error');
    } catch {
      setNewsStatus('error');
    }
  };

  return (
    <div
      className={`min-h-screen ${isDark ? 'dark' : ''} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      style={{ '--blog-primary': primaryColor, fontFamily: blog.font_family || 'inherit' } as CSSProperties}
    >
      <ReadingProgress />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {blog.logo_url
              ? <Image src={blog.logo_url} alt={blog.name} width={28} height={28} className="rounded-md object-contain" />
              : <div className="h-7 w-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
                  {blog.name[0]?.toUpperCase()}
                </div>}
            <span className="font-bold text-sm text-gray-900 dark:text-white hidden sm:block">{blog.name}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm text-gray-400 mx-2">
            <ChevronRight className="h-3.5 w-3.5" />
            {article.category_name && (
              <>
                <Link href={`/?category=${article.category_slug}`} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  {article.category_name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
            <span className="text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[200px]">{article.title}</span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {searchOpen ? (
              <form onSubmit={handleHeaderSearch} className="flex items-center gap-2">
                <input autoFocus value={headerQ} onChange={e => setHeaderQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-8 w-40 sm:w-52 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 bg-gray-50 dark:bg-gray-800 focus:outline-none"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Search className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setIsDark(d => !d)} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── ARTICLE ─── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Accueil</Link>
          {article.category_name && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/?category=${article.category_slug}`} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {article.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-500 dark:text-gray-400 line-clamp-1">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12">
          {/* Content column */}
          <div>
            {/* Article header */}
            <header className="mb-8">
              {article.category_name && (
                <Link href={`/?category=${article.category_slug}`}
                  className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 hover:opacity-70 transition-opacity"
                  style={{ color: primaryColor }}>
                  {article.category_name}
                </Link>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-4">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 py-4 border-y border-gray-100 dark:border-gray-800">
                {article.author_name && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: primaryColor }}>
                      {article.author_name[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{article.author_name}</span>
                  </div>
                )}
                {article.published_at && (
                  <><span>·</span><span>{fmtDate(article.published_at)}</span></>
                )}
                {article.reading_time_minutes && (
                  <><span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.reading_time_minutes} min</span></>
                )}
                {article.views_count > 0 && (
                  <><span>·</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count.toLocaleString()}</span></>
                )}
                {article.is_paid && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </div>

              {/* Share & Like */}
              <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                <ShareButtons url={articleUrl} title={article.title} />
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all ${liked ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-200 hover:text-red-500'}`}
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
                  {likeCount} j&apos;aime{likeCount !== 1 ? 's' : ''}
                </button>
              </div>
            </header>

            {/* Cover image */}
            {article.cover_image_url && !imgErr && (
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                <Image
                  src={article.cover_image_url} alt={article.title} fill priority
                  className="object-cover"
                  sizes="(max-width:1280px) 100vw, 860px"
                  onError={() => setImgErr(true)}
                />
              </div>
            )}

            {/* TOC (mobile) */}
            <div className="xl:hidden mb-8">
              <TableOfContents />
            </div>

            {/* Audio player */}
            {article.audio_url && (
              <AudioPlayer url={article.audio_url} title={article.title} />
            )}

            {/* Content */}
            <div
              className="article-content prose prose-gray dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300
                prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-md
                prose-blockquote:border-l-4 prose-blockquote:italic prose-blockquote:text-gray-500
                prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:rounded-xl prose-pre:text-sm"
              style={{ '--tw-prose-links': primaryColor } as CSSProperties}
              dangerouslySetInnerHTML={{ __html: article.content ?? '<p>Contenu non disponible.</p>' }}
            />

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                {article.tags.map(t => (
                  <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-current hover:text-current transition-colors"
                    style={{ ['--hover-color' as string]: primaryColor }}>
                    <Tag className="h-3 w-3" /> #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom share */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Partager cet article</p>
              </div>
              <ShareButtons url={articleUrl} title={article.title} />
            </div>

            {/* Author box */}
            {article.author_name && (
              <div className="mt-10 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0" style={{ backgroundColor: primaryColor }}>
                  {article.author_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Auteur</p>
                  <p className="font-bold text-gray-900 dark:text-white">{article.author_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Retrouvez tous les articles de{' '}
                    <Link href={`/?author=${encodeURIComponent(article.author_name)}`}
                      className="font-medium hover:underline" style={{ color: primaryColor }}>
                      {article.author_name}
                    </Link>{' '}
                    sur {blog.name}.
                  </p>
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 shrink-0">À lire aussi</h2>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedArticles.slice(0, 3).map(a => (
                    <RelatedCard key={a.id} article={a} href={getArticleHref(a.slug)} />
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="mt-12 p-8 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}>
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                <svg className="h-5 w-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Vous avez aimé cet article ?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Abonnez-vous à la newsletter de <strong>{blog.name}</strong> pour ne rien manquer.
              </p>
              {newsStatus === 'ok' ? (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
                  ✓ Abonnement confirmé !
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                  <input type="email" required value={newsEmail} onChange={e => setNewsEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 px-3 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}60` } as CSSProperties}
                  />
                  <button type="submit" disabled={newsStatus === 'loading'}
                    className="h-10 px-4 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
                    style={{ backgroundColor: primaryColor }}>
                    {newsStatus === 'loading' ? '…' : "S'abonner"}
                  </button>
                </form>
              )}
            </div>

            {/* Comments */}
            <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
              <Comments slug={blog.slug} articleSlug={article.slug} />
            </div>
          </div>

          {/* TOC Sidebar (desktop) */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              <TableOfContents />

              {/* Stats */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stats</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>{(article.views_count || 0).toLocaleString()} vues</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Heart className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>{likeCount.toLocaleString()} j&apos;aime{likeCount !== 1 ? 's' : ''}</span>
                </div>
                {article.reading_time_minutes && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                    <span>{article.reading_time_minutes} min de lecture</span>
                  </div>
                )}
              </div>

              {/* Quick share */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Partager</p>
                <div className="space-y-2">
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 h-8 px-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors w-full">
                    <Twitter className="h-3.5 w-3.5" /> Twitter
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 h-8 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors w-full">
                    <Facebook className="h-3.5 w-3.5" /> Facebook
                  </a>
                </div>
              </div>

              {/* Back */}
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Retour au blog
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              {blog.logo_url
                ? <Image src={blog.logo_url} alt={blog.name} width={24} height={24} className="rounded-md" />
                : <div className="h-6 w-6 rounded-md text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: primaryColor }}>{blog.name[0]?.toUpperCase()}</div>}
              <span className="font-bold text-sm text-gray-800 dark:text-white">{blog.name}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                  {socialIcons[platform] ?? <span className="text-[10px] font-bold">{platform[0].toUpperCase()}</span>}
                </a>
              ))}
              <a href="/rss.xml" title="RSS" className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors">
                <Rss className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span>© {new Date().getFullYear()} {blog.name}</span>
              <a href="https://nexusblog.io" target="_blank" rel="noopener noreferrer"
                className="hover:underline font-medium" style={{ color: primaryColor }}>NexusBlog</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
