'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem('nexusblog-theme') as Theme) ?? 'dark';
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nexusblog-theme', next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

export const useTheme = () => useContext(ThemeContext);

/* Inline script injected in <head> to avoid flash of wrong theme */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  try{
    var t=localStorage.getItem('nexusblog-theme')||'dark';
    document.documentElement.classList.add(t);
  }catch(e){}
})();
        `,
      }}
    />
  );
}
