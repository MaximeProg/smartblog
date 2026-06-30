'use client';
import { useState, useCallback, type CSSProperties, type ReactNode, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Menu, X, Moon, Sun, ChevronRight, Clock, Tag,
  Mail, Facebook, Twitter, Instagram, Youtube, Linkedin, Rss, ArrowRight,
  TrendingUp, BookOpen, Hash,
} from 'lucide-react';
import type { HomeProps } from '../ThemeRenderer';
import type { PublicArticle, PublicCategory } from '@/lib/public-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function allTags(articles: PublicArticle[]) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const a of articles) {
    for (const t of a.tags ?? []) {
      if (!seen.has(t)) { seen.add(t); tags.push(t); }
    }
  }
  return tags.slice(0, 20);
}

/* ─── Article Card ─── */
function ArticleCard({
  article, href, size = 'md', layout = 'vertical',
}: {
  article: PublicArticle;
  href: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
}) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = article.cover_image_url && !imgErr;

  if (layout === 'horizontal') {
    return (
      <Link href={href} className="flex gap-3 group">
        <div className="relative shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {hasImg
            ? <Image src={article.cover_image_url!} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} sizes="80px" />
            : <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="h-5 w-5 text-gray-300 dark:text-gray-600" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          {article.category_name && (
            <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 block" style={{ color: 'var(--blog-primary)' }}>
              {article.category_name}
            </span>
          )}
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:underline underline-offset-2 leading-snug">
            {article.title}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{fmtDateShort(article.published_at)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col">
      <div className={`relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 ${
        size === 'lg' ? 'aspect-[16/9]' : size === 'md' ? 'aspect-[3/2]' : 'aspect-[4/3]'
      }`}>
        {hasImg
          ? <Image src={article.cover_image_url!} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} sizes="(max-width:768px) 100vw, 50vw" />
          : <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            </div>}
        {article.is_paid && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
            Premium
          </span>
        )}
        {article.category_name && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {article.category_name}
          </span>
        )}
      </div>
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className={`font-bold text-gray-900 dark:text-white group-hover:underline underline-offset-2 line-clamp-2 leading-snug ${
          size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
        }`}>
          {article.title}
        </h3>
        {size !== 'sm' && article.excerpt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
          {article.author_name && <span>{article.author_name}</span>}
          {article.author_name && <span>·</span>}
          {article.published_at && <span>{fmtDateShort(article.published_at)}</span>}
          {article.reading_time_minutes && (
            <><span>·</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.reading_time_minutes} min</span></>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Sidebar ─── */
function BlogSidebar({
  articles, categories, slug, getArticleHref, primaryColor,
}: {
  articles: PublicArticle[];
  categories: PublicCategory[];
  slug: string;
  getArticleHref: (s: string) => string;
  primaryColor: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const popular = [...articles].sort((a, b) => b.views_count - a.views_count).slice(0, 5);
  const recent = [...articles].sort((a, b) =>
    new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
  ).slice(0, 4);
  const tags = allTags(articles);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${slug}/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubStatus(res.ok ? 'ok' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  return (
    <aside className="space-y-8">
      {/* Search */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Recherche</h3>
        <form onSubmit={handleSearch} className="relative">
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm px-3 pr-9 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--blog-primary)]/40"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" /> Catégories
          </h3>
          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat.id}>
                <Link href={`?category=${cat.slug}`}
                  className="flex items-center justify-between py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white group transition-colors">
                  <span className="group-hover:underline underline-offset-2">{cat.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    {cat.articles_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Populaires
          </h3>
          <div className="space-y-4">
            {popular.map((a, i) => (
              <div key={a.id} className="flex gap-3 items-start">
                <span className="text-2xl font-black text-gray-100 dark:text-gray-800 leading-none shrink-0 w-5 select-none">
                  {i + 1}
                </span>
                <ArticleCard article={a} href={getArticleHref(a.slug)} layout="horizontal" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter sidebar */}
      <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: primaryColor }}>
        <h3 className="font-bold text-base mb-1">Newsletter</h3>
        <p className="text-white/80 text-sm mb-4">Recevez les meilleurs articles dans votre boîte mail.</p>
        {subStatus === 'ok' ? (
          <div className="text-sm font-medium flex items-center gap-1.5">✓ Abonnement confirmé !</div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full h-9 rounded-lg px-3 text-sm bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white"
            />
            <button type="submit" disabled={subStatus === 'loading'}
              className="w-full h-9 rounded-lg bg-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ color: primaryColor }}>
              {subStatus === 'loading' ? 'Envoi…' : "S'abonner"}
            </button>
            {subStatus === 'error' && <p className="text-white/70 text-xs">Erreur — réessayez.</p>}
          </form>
        )}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Récents</h3>
          <div className="space-y-4">
            {recent.map(a => (
              <ArticleCard key={a.id} article={a} href={getArticleHref(a.slug)} layout="horizontal" />
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <Link key={t} href={`?tag=${encodeURIComponent(t)}`}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white hover:border-[var(--blog-primary)] transition-colors"
                style={{ ['--hover-bg' as string]: primaryColor }}>
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─── Main Component ─── */
export default function MinimalHome({
  blog, articles, categories, currentCategory, searchQuery, getArticleHref: _getArticleHref,
}: HomeProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerQ, setHeaderQ] = useState(searchQuery ?? '');
  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const getArticleHref = useCallback(
    (slug: string) => _getArticleHref ? _getArticleHref(slug) : `./${slug}`,
    [_getArticleHref],
  );

  const primaryColor = blog.primary_color || '#2563eb';
  const isFiltered = !!(searchQuery || currentCategory);
  const featured = !isFiltered ? articles.slice(0, 3) : [];
  const latest = !isFiltered ? articles.slice(3) : articles;
  const displayArticles = isFiltered ? articles : latest;

  const socialIcons: Record<string, ReactNode> = {
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
  };

  const handleHeaderSearch = (e: FormEvent) => {
    e.preventDefault();
    if (headerQ.trim()) router.push(`?q=${encodeURIComponent(headerQ.trim())}`);
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
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {blog.logo_url
              ? <Image src={blog.logo_url} alt={blog.name} width={32} height={32} className="rounded-md object-contain" />
              : <div className="h-8 w-8 rounded-md text-white text-sm font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
                  {blog.name[0]?.toUpperCase()}
                </div>}
            <span className="font-bold text-base text-gray-900 dark:text-white hidden sm:block truncate max-w-[160px]">{blog.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 mx-4 overflow-x-auto">
            <Link href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${!currentCategory && !searchQuery ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              style={!currentCategory && !searchQuery ? { backgroundColor: primaryColor } : {}}>
              Tous
            </Link>
            {categories.slice(0, 6).map(cat => (
              <Link key={cat.id} href={`?category=${cat.slug}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${currentCategory === cat.slug ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                style={currentCategory === cat.slug ? { backgroundColor: primaryColor } : {}}>
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            {searchOpen ? (
              <form onSubmit={handleHeaderSearch} className="flex items-center gap-2">
                <input autoFocus value={headerQ} onChange={e => setHeaderQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-8 w-44 sm:w-56 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}60` } as CSSProperties}
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
            <button onClick={() => setMenuOpen(m => !m)} className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 flex flex-wrap gap-2">
            <Link href="/" onClick={() => setMenuOpen(false)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={!currentCategory ? { backgroundColor: primaryColor, color: 'white' } : { color: '#6b7280' }}>
              Tous
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`?category=${cat.slug}`} onClick={() => setMenuOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={currentCategory === cat.slug ? { backgroundColor: primaryColor, color: 'white' } : { color: '#6b7280' }}>
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      {!isFiltered && (
        blog.cover_image_url ? (
          <section className="relative h-[400px] sm:h-[500px] overflow-hidden">
            <Image src={blog.cover_image_url} alt={blog.name} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/75" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              {blog.logo_url && (
                <Image src={blog.logo_url} alt={blog.name} width={72} height={72} className="rounded-2xl mb-4 shadow-xl" />
              )}
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight tracking-tight drop-shadow">
                {blog.name}
              </h1>
              {blog.description && (
                <p className="text-lg text-white/80 max-w-xl leading-relaxed mb-6">{blog.description}</p>
              )}
              <a href="#articles" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                Voir les articles <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        ) : (
          <section className="relative py-16 px-4 flex flex-col items-center text-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primaryColor}18 0%, ${primaryColor}06 100%)` }}>
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: `radial-gradient(circle, ${primaryColor} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
            {blog.logo_url && (
              <Image src={blog.logo_url} alt={blog.name} width={80} height={80} className="rounded-2xl shadow-md mb-4 relative" />
            )}
            <h1 className="relative text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
              {blog.name}
            </h1>
            {blog.description && (
              <p className="relative text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed mb-6">{blog.description}</p>
            )}
            <a href="#articles" className="relative inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}>
              Explorer les articles <ArrowRight className="h-4 w-4" />
            </a>
          </section>
        )
      )}

      {/* Filter header */}
      {isFiltered && (
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div>
              {searchQuery
                ? <><p className="text-sm text-gray-400">Résultats pour</p><h2 className="text-xl font-bold">&ldquo;{searchQuery}&rdquo;</h2></>
                : <><p className="text-sm text-gray-400">Catégorie</p><h2 className="text-xl font-bold">{categories.find(c => c.slug === currentCategory)?.name ?? currentCategory}</h2></>}
              <p className="text-sm text-gray-400 mt-1">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/" className="text-sm flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="h-3.5 w-3.5" /> Effacer
            </Link>
          </div>
        </div>
      )}

      {/* ─── FEATURED ─── */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">À la une</h2>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured[0] && (
              <div className="md:row-span-2">
                <ArticleCard article={featured[0]} href={getArticleHref(featured[0].slug)} size="lg" />
              </div>
            )}
            {featured.slice(1).map(a => (
              <ArticleCard key={a.id} article={a} href={getArticleHref(a.slug)} size="md" />
            ))}
          </div>
        </section>
      )}

      {/* ─── MAIN + SIDEBAR ─── */}
      <section id="articles" className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article list */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 shrink-0">
                {isFiltered ? 'Résultats' : 'Derniers articles'}
              </h2>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-xs text-gray-400 shrink-0">{displayArticles.length}</span>
            </div>

            {displayArticles.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                <p className="font-medium text-gray-400">Aucun article trouvé</p>
                {isFiltered && (
                  <Link href="/" className="text-sm mt-2 block hover:underline" style={{ color: primaryColor }}>
                    Voir tous les articles
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {displayArticles.map(a => (
                  <ArticleCard key={a.id} article={a} href={getArticleHref(a.slug)} size="md" />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <BlogSidebar
            articles={articles}
            categories={categories}
            slug={blog.slug}
            getArticleHref={getArticleHref}
            primaryColor={primaryColor}
          />
        </div>
      </section>

      {/* ─── NEWSLETTER SECTION ─── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-5" style={{ backgroundColor: `${primaryColor}20` }}>
            <Mail className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
            Restez informé·e
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-7 text-base">
            Recevez les meilleurs articles de{' '}
            <strong className="text-gray-700 dark:text-gray-300">{blog.name}</strong>{' '}
            directement dans votre boîte mail.
          </p>
          {newsStatus === 'ok' ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: primaryColor }}>
              <span>✓</span> Vous êtes abonné·e !
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email" required value={newsEmail} onChange={e => setNewsEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 px-4 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primaryColor}60` } as CSSProperties}
              />
              <button type="submit" disabled={newsStatus === 'loading'}
                className="h-12 px-6 rounded-xl text-white text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}>
                {newsStatus === 'loading' ? 'Envoi…' : "S'abonner"}
              </button>
            </form>
          )}
          {newsStatus === 'error' && <p className="text-sm text-red-500 mt-2">Une erreur est survenue — réessayez.</p>}
          <p className="text-xs text-gray-400 mt-3">Pas de spam. Désinscription en un clic.</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                {blog.logo_url
                  ? <Image src={blog.logo_url} alt={blog.name} width={28} height={28} className="rounded-md" />
                  : <div className="h-7 w-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>{blog.name[0]?.toUpperCase()}</div>}
                <span className="font-bold text-gray-900 dark:text-white">{blog.name}</span>
              </Link>
              {blog.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">{blog.description}</p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-105"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                    {socialIcons[platform] ?? <span className="text-[10px] font-bold">{platform[0].toUpperCase()}</span>}
                  </a>
                ))}
                <a href="/rss.xml" title="RSS" className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors">
                  <Rss className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Catégories</h4>
                <ul className="space-y-2">
                  {categories.slice(0, 6).map(cat => (
                    <li key={cat.id}>
                      <Link href={`?category=${cat.slug}`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 group transition-colors">
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" style={{ color: primaryColor }} />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent */}
            {articles.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Récents</h4>
                <ul className="space-y-3">
                  {articles.slice(0, 4).map(a => (
                    <li key={a.id}>
                      <Link href={getArticleHref(a.slug)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white leading-snug line-clamp-2 group transition-colors">
                        <span className="group-hover:underline underline-offset-2">{a.title}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{fmtDate(a.published_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Links */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Liens</h4>
              <ul className="space-y-2">
                {[['/', 'Accueil'], ['/about', 'À propos'], ['/contact', 'Contact'], ['/privacy', 'Confidentialité'], ['/rss.xml', 'RSS']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 group transition-colors">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" style={{ color: primaryColor }} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>© {new Date().getFullYear()} {blog.name}. Tous droits réservés.</span>
            <span>
              Propulsé par{' '}
              <a href="https://nexusblog.io" target="_blank" rel="noopener noreferrer"
                className="font-semibold hover:underline" style={{ color: primaryColor }}>
                NexusBlog
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
