'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X, Bookmark, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';
import { useAllBookmarks } from '@/hooks/useBookmark';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

interface Props {
  basePath: string;
  locale?: string;
  /** True for themes whose mobile bottom nav already has its own Search tab
   * (avoids duplicating both a floating FAB and a bottom-nav icon on mobile). */
  hideOnMobile?: boolean;
}

const LOCALE_LANG: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  pt: 'pt-PT',
};

export default function FloatingSearch({ basePath, locale = 'fr', hideOnMobile = false }: Props) {
  const t = useTranslations('publicBlog');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { bookmarks } = useAllBookmarks();

  const handleVoiceResult = useCallback((transcript: string) => {
    setQ(transcript);
  }, []);

  const { listening, supported, toggle, stop } = useVoiceSearch({
    lang: LOCALE_LANG[locale] ?? 'fr-FR',
    onResult: handleVoiceResult,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ('');
      stop();
    }
  }, [open, stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = () => {
    if (!q.trim()) return;
    router.push(`${basePath}/search?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
    setQ('');
  };

  return (
    <>
      {/* Floating search button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 items-center justify-center h-12 w-12 rounded-full shadow-lg text-white transition-transform hover:scale-105 active:scale-95 ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
        style={{ backgroundColor: 'var(--blog-primary, #6366f1)' }}
        aria-label={t('searchLabel')}
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Overlay + search modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              {/* Mic button — only shown when browser supports it */}
              {supported && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={listening ? t('stopVoiceSearch') : t('startVoiceSearch')}
                  className={`relative shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                    listening
                      ? 'text-red-500'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {listening && (
                    <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
                  )}
                  {listening ? (
                    <MicOff className="relative h-4 w-4" />
                  ) : (
                    <Mic className="relative h-4 w-4" />
                  )}
                </button>
              )}

              <Search className="h-5 w-5 text-gray-400 shrink-0" />

              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder={listening ? t('listeningPlaceholder') : t('searchArticlesPlaceholder')}
                className="flex-1 bg-transparent text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
              />

              <button
                onClick={() => setOpen(false)}
                className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Listening hint */}
            {listening && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 flex items-center gap-2">
                <span className="flex gap-0.5 items-end h-4">
                  {[0, 100, 200].map(delay => (
                    <span
                      key={delay}
                      className="w-0.5 rounded-full bg-red-500 animate-bounce"
                      style={{ height: '60%', animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {t('voiceSearchHint')}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <Link
                href={`${basePath}/bookmarks`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {t('myBookmarks')}
                {bookmarks.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold"
                    style={{ backgroundColor: 'var(--blog-primary, #6366f1)' }}
                  >
                    {bookmarks.length > 9 ? '9+' : bookmarks.length}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">{t('enterEscHint')}</span>
                <button
                  onClick={submit}
                  disabled={!q.trim()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: 'var(--blog-primary, #6366f1)' }}
                >
                  {t('searchLabel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
