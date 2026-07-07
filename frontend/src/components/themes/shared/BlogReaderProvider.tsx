'use client';
import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { Moon, Sun, Type, BookOpen, X, AlignJustify, Minus, Plus } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type FontSize = 'sm' | 'md' | 'lg' | 'xl';
type FontFamily = 'sans' | 'serif' | 'mono';

interface ReaderState {
  dark: boolean;
  fontSize: FontSize;
  fontFamily: FontFamily;
  readerMode: boolean;
}

interface ReaderCtx extends ReaderState {
  toggleDark: () => void;
  setFontSize: (v: FontSize) => void;
  setFontFamily: (v: FontFamily) => void;
  toggleReaderMode: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const Ctx = createContext<ReaderCtx | null>(null);
export const useReaderCtx = () => useContext(Ctx);

// ── CSS mappings ───────────────────────────────────────────────────────────────

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '0.9rem',
  md: '1.0625rem',
  lg: '1.1875rem',
  xl: '1.3125rem',
};

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  sans: 'var(--blog-font, system-ui, sans-serif)',
  serif: "Georgia, 'Times New Roman', serif",
  mono: "Menlo, Consolas, 'Courier New', monospace",
};

const SIZE_LABELS: Record<FontSize, string> = { sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
const FAMILY_LABELS: Record<FontFamily, string> = { sans: 'Sans', serif: 'Serif', mono: 'Mono' };
const FAMILY_PREVIEW: Record<FontFamily, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'Consolas, monospace',
};

const STORAGE = {
  dark: 'blog-dark',
  fontSize: 'blog-font-size',
  fontFamily: 'blog-font-family',
  readerMode: 'blog-reader-mode',
};

// ── Provider ───────────────────────────────────────────────────────────────────

export function BlogReaderProvider({
  children,
  primaryColor = '#18181b',
}: {
  children: ReactNode;
  primaryColor?: string;
}) {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>('md');
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('sans');
  const [readerMode, setReaderMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedDark = localStorage.getItem(STORAGE.dark);
    if (storedDark === null) {
      setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setDark(storedDark === 'true');
    }
    setFontSizeState((localStorage.getItem(STORAGE.fontSize) as FontSize) || 'md');
    setFontFamilyState((localStorage.getItem(STORAGE.fontFamily) as FontFamily) || 'sans');
    setReaderMode(localStorage.getItem(STORAGE.readerMode) === 'true');
    setMounted(true);
  }, []);

  const toggleDark = useCallback(() => {
    setDark(d => {
      const next = !d;
      localStorage.setItem(STORAGE.dark, String(next));
      return next;
    });
  }, []);

  const setFontSize = useCallback((v: FontSize) => {
    setFontSizeState(v);
    localStorage.setItem(STORAGE.fontSize, v);
  }, []);

  const setFontFamily = useCallback((v: FontFamily) => {
    setFontFamilyState(v);
    localStorage.setItem(STORAGE.fontFamily, v);
  }, []);

  const toggleReaderMode = useCallback(() => {
    setReaderMode(r => {
      const next = !r;
      localStorage.setItem(STORAGE.readerMode, String(next));
      return next;
    });
  }, []);

  const cls = [
    dark ? 'blog-dark' : '',
    readerMode ? 'blog-reader-mode' : '',
  ].filter(Boolean).join(' ');

  const cssVars = {
    '--reader-fs': FONT_SIZE_MAP[fontSize],
    '--reader-ff': FONT_FAMILY_MAP[fontFamily],
  } as React.CSSProperties;

  return (
    <Ctx.Provider value={{ dark, fontSize, fontFamily, readerMode, toggleDark, setFontSize, setFontFamily, toggleReaderMode }}>
      <div className={cls} style={cssVars}>
        {children}

        {/* Floating trigger — only after hydration */}
        {mounted && (
          <>
            <button
              onClick={() => setPanelOpen(o => !o)}
              title="Reader settings"
              className="fixed bottom-6 right-6 z-[200] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              <Type className="h-4 w-4" />
            </button>

            {panelOpen && (
              <div
                className="fixed bottom-20 right-6 z-[200] w-64 rounded-2xl shadow-2xl border overflow-hidden"
                style={{
                  backgroundColor: dark ? '#18181b' : '#fff',
                  borderColor: dark ? '#27272a' : '#e4e4e7',
                  color: dark ? '#fafafa' : '#18181b',
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider"
                  style={{ borderColor: dark ? '#27272a' : '#e4e4e7' }}
                >
                  <span>Reading</span>
                  <button onClick={() => setPanelOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-4 py-4 space-y-5">
                  {/* Dark mode */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dark mode</span>
                    <button
                      onClick={toggleDark}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: dark ? primaryColor : '#d4d4d8' }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: dark ? 'translateX(24px)' : 'translateX(4px)' }}
                      />
                    </button>
                  </div>

                  {/* Reader mode */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Focus mode</span>
                    <button
                      onClick={toggleReaderMode}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: readerMode ? primaryColor : '#d4d4d8' }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: readerMode ? 'translateX(24px)' : 'translateX(4px)' }}
                      />
                    </button>
                  </div>

                  {/* Font size */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-2">Text size</p>
                    <div className="flex gap-1.5">
                      {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setFontSize(s)}
                          className="flex-1 h-8 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            backgroundColor: fontSize === s ? primaryColor : 'transparent',
                            color: fontSize === s ? '#fff' : (dark ? '#a1a1aa' : '#71717a'),
                            borderColor: fontSize === s ? primaryColor : (dark ? '#3f3f46' : '#d4d4d8'),
                          }}
                        >
                          {SIZE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font family */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-2">Font</p>
                    <div className="flex flex-col gap-1.5">
                      {(['sans', 'serif', 'mono'] as FontFamily[]).map(f => (
                        <button
                          key={f}
                          onClick={() => setFontFamily(f)}
                          className="h-9 rounded-lg px-3 text-sm border transition-all text-left"
                          style={{
                            fontFamily: FAMILY_PREVIEW[f],
                            backgroundColor: fontFamily === f ? primaryColor : 'transparent',
                            color: fontFamily === f ? '#fff' : (dark ? '#a1a1aa' : '#71717a'),
                            borderColor: fontFamily === f ? primaryColor : (dark ? '#3f3f46' : '#d4d4d8'),
                          }}
                        >
                          {FAMILY_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}
