'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

interface LanguageSwitcherProps {
  locale: string;
  className?: string;
  align?: 'start' | 'end';
}

export function LanguageSwitcher({ locale, className, align = 'end' }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Defer Radix UI rendering until after hydration to prevent useId() mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const triggerClass = cn(
    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none',
    'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border',
    className,
  );

  if (!mounted) {
    return (
      <div className={triggerClass} aria-hidden>
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{locale}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass}>
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[140px]">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => switchLocale(l.code)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="text-sm flex-1">{l.label}</span>
            {l.code === locale && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
