import { ReactNode } from 'react';
import { PublicNav } from './PublicNav';
import { PublicFooter } from './PublicFooter';

interface LegalLayoutProps {
  locale: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalLayout({ locale, title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      {/* Header */}
      <div className="pt-24 pb-12 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black mb-3">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none
          prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:my-4
          prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-li:my-1
          prose-ul:my-4 prose-ul:pl-5 prose-ul:list-disc
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
