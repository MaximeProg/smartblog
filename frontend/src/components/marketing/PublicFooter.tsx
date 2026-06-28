import Link from 'next/link';
import { PenLine, Twitter, Github, Linkedin, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const year = new Date().getFullYear();
  const isFr = locale === 'fr';

  const links = {
    platform: [
      { label: isFr ? 'Fonctionnalités' : 'Features', href: `/${locale}#features` },
      { label: isFr ? 'Tarifs' : 'Pricing', href: `/${locale}#pricing` },
      { label: 'Blog', href: `/${locale}/blog` },
      { label: isFr ? 'Catégories' : 'Categories', href: `/${locale}/categories` },
      { label: 'Changelog', href: `/${locale}/changelog` },
    ],
    company: [
      { label: isFr ? 'À propos' : 'About', href: `/${locale}/about` },
      { label: isFr ? 'Carrières' : 'Careers', href: `/${locale}/careers` },
      { label: 'Press', href: `/${locale}/press` },
      { label: 'Contact', href: `/${locale}/contact` },
    ],
    legal: [
      { label: isFr ? 'Confidentialité' : 'Privacy Policy', href: `/${locale}/legal/privacy` },
      { label: isFr ? 'Conditions' : 'Terms of Service', href: `/${locale}/legal/terms` },
      { label: 'Cookies', href: `/${locale}/legal/cookies` },
      { label: 'Security', href: `/${locale}/legal/security` },
    ],
    resources: [
      { label: 'Documentation', href: `/${locale}/docs` },
      { label: 'API Reference', href: `/${locale}/docs/api` },
      { label: 'Guides', href: `/${locale}/guides` },
      { label: 'Status', href: `/${locale}/status` },
    ],
  };

  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10">

          {/* Brand — full width on mobile, 2 cols on md, 2 cols on lg */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                <PenLine className="h-4 w-4 text-white" />
              </div>
              <span className="font-black text-slate-900 dark:text-white tracking-widest uppercase text-sm">NexusBlog</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 max-w-xs">
              {isFr
                ? "La plateforme de blog nouvelle génération pour les créateurs qui exigent l'excellence."
                : 'The next-generation blogging platform built for creators who demand excellence.'}
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, href: siteConfig.social.twitter, label: 'Twitter' },
                { icon: Github, href: siteConfig.social.github, label: 'GitHub' },
                { icon: Linkedin, href: siteConfig.social.linkedin, label: 'LinkedIn' },
                { icon: Mail, href: `mailto:${siteConfig.contact.general}`, label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3 md:mb-4">
              Platform
            </p>
            <ul className="space-y-2.5">
              {links.platform.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3 md:mb-4">
              {isFr ? 'Entreprise' : 'Company'}
            </p>
            <ul className="space-y-2.5">
              {links.company.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3 md:mb-4">
              {isFr ? 'Ressources' : 'Resources'}
            </p>
            <ul className="space-y-2.5">
              {links.resources.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3 md:mb-4">
              Legal
            </p>
            <ul className="space-y-2.5">
              {links.legal.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {isFr ? 'Restez informé' : 'Stay in the loop'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {isFr
                ? 'Recevez les dernières mises à jour directement dans votre boîte mail.'
                : 'Get the latest updates delivered straight to your inbox.'}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
              className="flex-1 md:w-60 px-3 sm:px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors min-w-0"
            />
            <button className="shrink-0 px-4 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap">
              {isFr ? "S'abonner" : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {year} NexusBlog. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isFr ? 'Tous les systèmes sont opérationnels' : 'All systems operational'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
