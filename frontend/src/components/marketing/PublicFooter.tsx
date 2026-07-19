import Link from 'next/link';
import { PenLine, Twitter, Github, Linkedin, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getUiTranslations } from '@/lib/platform-api';

interface PublicFooterProps {
  locale: string;
  /** Langue du contenu CMS (peut différer de `locale` via ?cmsLang=) — voir
   * PublicNav pour le même mécanisme. */
  lang?: string;
}

interface FooterLabels {
  tagline: string;
  platformHeading: string; companyHeading: string; resourcesHeading: string; legalHeading: string;
  featuresLink: string; pricingLink: string; categoriesLink: string;
  aboutLink: string; careersLink: string; privacyLink: string; termsLink: string;
  stayInLoop: string; stayInLoopDesc: string; emailPlaceholder: string; subscribe: string;
  allRightsReserved: string; allSystemsOperational: string;
}

const EN_FOOTER: FooterLabels = {
  tagline: 'The next-generation blogging platform built for creators who demand excellence.',
  platformHeading: 'Platform', companyHeading: 'Company', resourcesHeading: 'Resources', legalHeading: 'Legal',
  featuresLink: 'Features', pricingLink: 'Pricing', categoriesLink: 'Categories',
  aboutLink: 'About', careersLink: 'Careers', privacyLink: 'Privacy Policy', termsLink: 'Terms of Service',
  stayInLoop: 'Stay in the loop', stayInLoopDesc: 'Get the latest updates delivered straight to your inbox.',
  emailPlaceholder: 'your@email.com', subscribe: 'Subscribe',
  allRightsReserved: 'All rights reserved.', allSystemsOperational: 'All systems operational',
};

const FR_FOOTER: FooterLabels = {
  tagline: "La plateforme de blog nouvelle génération pour les créateurs qui exigent l'excellence.",
  platformHeading: 'Platform', companyHeading: 'Entreprise', resourcesHeading: 'Ressources', legalHeading: 'Legal',
  featuresLink: 'Fonctionnalités', pricingLink: 'Tarifs', categoriesLink: 'Catégories',
  aboutLink: 'À propos', careersLink: 'Carrières', privacyLink: 'Confidentialité', termsLink: 'Conditions',
  stayInLoop: 'Restez informé', stayInLoopDesc: 'Recevez les dernières mises à jour directement dans votre boîte mail.',
  emailPlaceholder: 'votre@email.com', subscribe: "S'abonner",
  allRightsReserved: 'Tous droits réservés.', allSystemsOperational: 'Tous les systèmes sont opérationnels',
};

export async function PublicFooter({ locale, lang: langProp }: PublicFooterProps) {
  const year = new Date().getFullYear();
  const lang = (langProp ?? locale).toLowerCase();

  let l: FooterLabels = lang === 'fr' ? FR_FOOTER : EN_FOOTER;
  if (lang !== 'en' && lang !== 'fr') {
    const translated = await getUiTranslations('marketing', lang);
    if (translated?.footer) l = { ...EN_FOOTER, ...(translated.footer as Partial<FooterLabels>) };
  }

  const links = {
    platform: [
      { label: l.featuresLink, href: `/${locale}#features` },
      { label: l.pricingLink, href: `/${locale}#pricing` },
      { label: 'Blog', href: `/${locale}/blog` },
      { label: l.categoriesLink, href: `/${locale}/categories` },
      { label: 'Changelog', href: `/${locale}/changelog` },
    ],
    company: [
      { label: l.aboutLink, href: `/${locale}/about` },
      { label: l.careersLink, href: `/${locale}/careers` },
      { label: 'Press', href: `/${locale}/press` },
      { label: 'Contact', href: `/${locale}/contact` },
    ],
    legal: [
      { label: l.privacyLink, href: `/${locale}/legal/privacy` },
      { label: l.termsLink, href: `/${locale}/legal/terms` },
      { label: 'Cookies', href: `/${locale}/legal/cookies` },
      { label: 'Security', href: `/${locale}/legal/security` },
      { label: 'Data Deletion', href: `/${locale}/legal/data-deletion` },
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
              <span className="font-black text-slate-900 dark:text-white tracking-widest uppercase text-sm">SmarterBloggers</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 max-w-xs">
              {l.tagline}
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
              {l.platformHeading}
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
              {l.companyHeading}
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
              {l.resourcesHeading}
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
              {l.legalHeading}
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
              {l.stayInLoop}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {l.stayInLoopDesc}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder={l.emailPlaceholder}
              className="flex-1 md:w-60 px-3 sm:px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors min-w-0"
            />
            <button className="shrink-0 px-4 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap">
              {l.subscribe}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {year} SmarterBloggers. {l.allRightsReserved}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {l.allSystemsOperational}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
