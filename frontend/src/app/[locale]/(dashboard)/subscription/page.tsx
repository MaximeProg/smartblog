'use client';

import { useParams } from 'next/navigation';
import { Check, Zap, Star, Building2, Sparkles } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    icon: Zap,
    accent: 'text-slate-600',
    ring:   'ring-slate-200',
    badge:  null,
    cta:    'Plan actuel',
    ctaCls: 'bg-slate-100 text-slate-400 cursor-default',
    features: [
      '1 blog',
      '50 articles',
      '500 abonnés newsletter',
      '1 auteur',
      '1 Go de stockage',
      'Sous-domaine nexusblog.io',
      'Template corporate inclus',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    icon: Star,
    accent: 'text-indigo-600',
    ring:   'ring-indigo-300',
    badge:  'Populaire',
    badgeCls: 'bg-indigo-600',
    cta:    'Passer à Starter',
    ctaCls: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    features: [
      '3 blogs',
      '500 articles',
      '5 000 abonnés newsletter',
      '3 auteurs',
      '5 Go de stockage',
      'Domaine personnalisé',
      'Analytics avancés',
      'Support prioritaire',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    icon: Sparkles,
    accent: 'text-blue-600',
    ring:   'ring-blue-400',
    badge:  'Recommandé',
    badgeCls: 'bg-blue-600',
    cta:    'Passer à Pro',
    ctaCls: 'bg-blue-600 hover:bg-blue-700 text-white',
    features: [
      '10 blogs',
      'Articles illimités',
      '50 000 abonnés newsletter',
      '10 auteurs',
      '50 Go de stockage',
      'Domaine personnalisé',
      'Analytics complets + SEO',
      'API access',
      'Support dédié',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    icon: Building2,
    accent: 'text-amber-600',
    ring:   'ring-amber-300',
    badge:  null,
    cta:    'Nous contacter',
    ctaCls: 'bg-amber-600 hover:bg-amber-700 text-white',
    features: [
      'Blogs illimités',
      'Articles illimités',
      'Abonnés illimités',
      'Auteurs illimités',
      'Stockage illimité',
      'Multi-domaines',
      'White-label',
      'SLA garanti',
      'Onboarding dédié',
      'Support 24/7',
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const currentPlan = user?.plan ?? 'free';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">

            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-[26px] font-black text-slate-900 mb-2">Choisissez votre plan</h2>
              <p className="text-[14px] text-slate-500 max-w-lg mx-auto">
                Démarrez gratuitement et évoluez à votre rythme. Tous les plans incluent le template corporate complet.
              </p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-4 gap-5 max-w-6xl mx-auto">
              {PLANS.map(plan => {
                const isCurrent = currentPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl border-2 transition-all flex flex-col p-6 shadow-sm ${
                      isCurrent ? 'border-blue-400 shadow-blue-50 shadow-lg' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Badge */}
                    {(plan.badge || isCurrent) && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className={`text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${isCurrent ? 'bg-slate-800' : (plan as any).badgeCls ?? 'bg-blue-600'}`}>
                          {isCurrent ? 'Votre plan' : plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon + plan name */}
                    <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4`}>
                      <plan.icon className={`h-5 w-5 ${plan.accent}`} />
                    </div>
                    <h3 className="text-[16px] font-black text-slate-900 mb-1">{plan.name}</h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-[30px] font-black text-slate-900">
                        {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                      </span>
                      {plan.price > 0 && <span className="text-[13px] text-slate-400">/mois</span>}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[12.5px] text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      className={`w-full h-10 rounded-xl text-[13px] font-bold transition-colors ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : plan.ctaCls}`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Plan actuel' : plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[12px] text-slate-400 mt-10">
              Paiement sécurisé · Annulation possible à tout moment · Pas de frais cachés
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
