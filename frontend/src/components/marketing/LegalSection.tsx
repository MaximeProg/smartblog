import {
  Eye, Shield, Users, Lock, Globe2, Mail, FileText, User, Edit3,
  CreditCard, Server, XCircle, AlertTriangle, Cookie, Settings,
  BarChart2, Star, Key, Zap, CheckCircle2, Trash2, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  eye: Eye, shield: Shield, users: Users, lock: Lock, globe2: Globe2, mail: Mail,
  filetext: FileText, user: User, edit3: Edit3, creditcard: CreditCard, server: Server,
  xcircle: XCircle, alerttriangle: AlertTriangle, cookie: Cookie, settings: Settings,
  barchart2: BarChart2, star: Star, key: Key, zap: Zap, trash2: Trash2,
};

const ICON_COLORS: Record<string, string> = {
  eye: 'bg-blue-500/10 text-blue-500', shield: 'bg-violet-500/10 text-violet-500',
  users: 'bg-emerald-500/10 text-emerald-500', lock: 'bg-amber-500/10 text-amber-500',
  globe2: 'bg-cyan-500/10 text-cyan-500', mail: 'bg-pink-500/10 text-pink-500',
  filetext: 'bg-blue-500/10 text-blue-500', user: 'bg-emerald-500/10 text-emerald-500',
  edit3: 'bg-amber-500/10 text-amber-500', creditcard: 'bg-cyan-500/10 text-cyan-500',
  server: 'bg-amber-500/10 text-amber-500', xcircle: 'bg-red-500/10 text-red-500',
  alerttriangle: 'bg-orange-500/10 text-orange-500', cookie: 'bg-amber-500/10 text-amber-500',
  settings: 'bg-blue-500/10 text-blue-500', barchart2: 'bg-emerald-500/10 text-emerald-500',
  star: 'bg-violet-500/10 text-violet-500', key: 'bg-cyan-500/10 text-cyan-500', zap: 'bg-orange-500/10 text-orange-500',
  trash2: 'bg-red-500/10 text-red-500',
};

export interface LegalSectionData {
  icon: string;
  title: string;
  body: string;
  items: string[];
}

/** Rendu numéroté partagé par les 4 pages légales (privacy/terms/cookies/security)
 * — même structure visuelle, contenu piloté par le CMS. `checkBullets` bascule
 * entre la puce simple (privacy/terms/cookies) et l'icône CheckCircle2 (security). */
export function LegalSections({ sections, checkBullets = false }: { sections: LegalSectionData[]; checkBullets?: boolean }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10 md:space-y-14">
      {sections.map(({ icon, title, body, items }, i) => {
        const Icon = ICONS[icon] ?? FileText;
        const num = String(i + 1).padStart(2, '0');
        return (
          <div key={title} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 md:gap-10">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-3">
              <span className="text-3xl md:text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">{num}</span>
              <div className={`h-11 w-11 rounded-xl ${ICON_COLORS[icon] ?? ''} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">{title}</h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
              {items.length > 0 && (
                <ul className={checkBullets ? 'space-y-2.5 mt-5' : 'space-y-2.5 mt-4'}>
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      {checkBullets
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        : <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
