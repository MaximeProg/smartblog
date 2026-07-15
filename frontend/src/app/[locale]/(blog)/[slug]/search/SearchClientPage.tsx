'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { publicApi, type BlogInfo } from '@/lib/public-api';
import { Search, Clock, Tag, ArrowLeft, Loader2, Mic, MicOff } from 'lucide-react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

type SearchHit = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  category_name?: string;
  published_at?: string;
  highlight?: Record<string, string[]>;
};

type SearchResults = {
  total: number;
  hits: SearchHit[];
  query: string | null;
};

interface Props {
  blog: BlogInfo;
  slug: string;
  locale: string;
  initialQuery: string;
  initialResults: SearchResults | null;
  basePath?: string;
}

const LOCALE_LANG: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  pt: 'pt-PT',
};

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function HighlightSnippet({ hit }: { hit: SearchHit }) {
  const excerpt = hit.highlight?.excerpt?.[0] ?? hit.highlight?.content?.[0] ?? hit.excerpt ?? '';
  if (!excerpt) return null;
  return (
    <p
      className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1"
      // highlight tags come from ES <em> tags — safe since we control the index
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: excerpt.replace(/<em>/g, '<mark class="bg-yellow-100 dark:bg-yellow-900/40 text-inherit not-italic rounded px-0.5">').replace(/<\/em>/g, '</mark>') }}
    />
  );
}

export default function SearchClientPage({ blog, slug, locale, initialQuery, initialResults, basePath: baseProp }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(initialResults);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
  }, []);

  const { listening, supported, toggle } = useVoiceSearch({
    lang: LOCALE_LANG[locale] ?? 'fr-FR',
    onResult: handleVoiceResult,
  });

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await publicApi.search(slug, { q: q.trim(), size: 20 });
      setResults(data);
    } catch {
      setResults({ total: 0, hits: [], query: q });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const url = query.trim()
        ? `${pathname}?q=${encodeURIComponent(query.trim())}`
        : pathname;
      router.replace(url, { scroll: false });
      doSearch(query);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, pathname, router, doSearch]);

  // Focus input after voice result comes in
  useEffect(() => {
    if (!listening && query) {
      inputRef.current?.focus();
    }
  }, [listening, query]);

  const basePath = baseProp !== undefined ? baseProp : `/${locale}/${slug}`;

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-950"
      style={{ fontFamily: 'var(--blog-font, system-ui, sans-serif)' }}
    >
      {/* Header bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={basePath || "/"}
            className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Back to blog"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
            listening
              ? 'bg-red-50 dark:bg-red-950/30 ring-1 ring-red-300 dark:ring-red-800'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={listening ? 'Écoute en cours…' : `Rechercher sur ${blog.name}…`}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
            />
            {loading && !listening && (
              <Loader2 className="h-4 w-4 text-[var(--blog-primary)] animate-spin shrink-0" />
            )}
            {listening && (
              <span className="flex gap-0.5 items-end h-4 shrink-0">
                {[0, 120, 240].map(delay => (
                  <span
                    key={delay}
                    className="w-0.5 rounded-full bg-red-500 animate-bounce"
                    style={{ height: '70%', animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            )}
          </div>

          {/* Mic button */}
          {supported && (
            <button
              type="button"
              onClick={toggle}
              aria-label={listening ? 'Arrêter la recherche vocale' : 'Recherche vocale'}
              className={`relative shrink-0 flex items-center justify-center h-9 w-9 rounded-full transition-colors ${
                listening
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {listening && (
                <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
              )}
              {listening ? (
                <MicOff className="relative h-4 w-4" />
              ) : (
                <Mic className="relative h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {!query.trim() && !listening && (
          <div className="text-center py-20 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tapez ou parlez pour rechercher des articles</p>
            {supported && (
              <p className="text-xs mt-1 opacity-60">Utilisez le bouton micro pour une recherche vocale</p>
            )}
          </div>
        )}

        {listening && !query.trim() && (
          <div className="text-center py-20 text-gray-400">
            <div className="relative inline-flex items-center justify-center h-16 w-16 mx-auto mb-4">
              <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-red-400/20 animate-ping" style={{ animationDelay: '150ms' }} />
              <Mic className="relative h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-500">Parlez maintenant…</p>
            <p className="text-xs mt-1 opacity-60">Votre voix sera transcrite automatiquement</p>
          </div>
        )}

        {query.trim() && !loading && results && results.total === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600 dark:text-gray-300">Aucun résultat pour «{query}»</p>
            <p className="text-sm mt-1">Essayez d'autres mots-clés ou vérifiez l'orthographe.</p>
          </div>
        )}

        {results && results.total > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {results.total} résultat{results.total !== 1 ? 's' : ''} pour «{results.query ?? query}»
            </p>
            <ul className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {results.hits.map(hit => (
                <li key={hit.id}>
                  <Link
                    href={`${basePath}/${hit.slug}`}
                    className="group flex gap-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/60 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    {hit.cover_image_url && (
                      <img
                        src={hit.cover_image_url}
                        alt={hit.title}
                        className="h-16 w-24 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[var(--blog-primary)] transition-colors line-clamp-2 leading-snug">
                        {hit.title}
                      </h2>
                      <HighlightSnippet hit={hit} />
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        {hit.category_name && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {hit.category_name}
                          </span>
                        )}
                        {hit.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(hit.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
