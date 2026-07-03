'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors ${className}`}
    >
      {theme === 'dark'
        ? <Sun className="h-[18px] w-[18px]" />
        : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
