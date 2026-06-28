import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const ENDPOINTS = [
  { method: 'GET',    path: '/v1/tenants',                     desc: 'List all tenants for the authenticated user',  descFr: "Lister tous les tenants de l'utilisateur" },
  { method: 'POST',   path: '/v1/tenants',                     desc: 'Create a new tenant (blog)',                    descFr: 'Créer un nouveau tenant (blog)' },
  { method: 'GET',    path: '/v1/tenants/{id}/articles',       desc: 'List articles for a tenant',                   descFr: "Lister les articles d'un tenant" },
  { method: 'POST',   path: '/v1/tenants/{id}/articles',       desc: 'Create a new article',                         descFr: 'Créer un nouvel article' },
  { method: 'PATCH',  path: '/v1/tenants/{id}/articles/{aid}', desc: 'Update an article',                            descFr: 'Mettre à jour un article' },
  { method: 'DELETE', path: '/v1/tenants/{id}/articles/{aid}', desc: 'Delete an article',                            descFr: 'Supprimer un article' },
  { method: 'GET',    path: '/v1/tenants/{id}/categories',     desc: 'List categories for a tenant',                 descFr: "Lister les catégories d'un tenant" },
  { method: 'POST',   path: '/v1/tenants/{id}/categories',     desc: 'Create a new category',                        descFr: 'Créer une nouvelle catégorie' },
  { method: 'GET',    path: '/v1/tenants/{id}/team',           desc: 'List team members',                            descFr: "Lister les membres de l'équipe" },
  { method: 'POST',   path: '/v1/tenants/{id}/team/invite',    desc: 'Invite a team member',                         descFr: "Inviter un membre d'équipe" },
];

const methodColor: Record<string, string> = {
  GET:    'bg-emerald-500/10 text-emerald-500',
  POST:   'bg-blue-500/10 text-blue-500',
  PATCH:  'bg-amber-500/10 text-amber-500',
  DELETE: 'bg-red-500/10 text-red-500',
};

export default async function ApiReferencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? "Référence d'API" : 'API Reference'}
        subtitle={`Base URL: https://api.nexusBlog.com — REST · JSON · JWT Auth`}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
        {/* Authentication */}
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div>
            <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">01</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">{isFr ? 'Authentification' : 'Authentication'}</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              {isFr
                ? "Toutes les requêtes API doivent inclure un token JWT valide dans l'en-tête Authorization. Obtenez votre token via POST /v1/auth/token après authentification Firebase."
                : 'All API requests must include a valid JWT token in the Authorization header. Get your token via POST /v1/auth/token after Firebase authentication.'}
            </p>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm">
              <p className="text-slate-500 text-xs mb-2">{'// Request header'}</p>
              <p className="text-emerald-400">{'Authorization: Bearer <your-jwt-token>'}</p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div>
            <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">02</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-5">{isFr ? 'Endpoints disponibles' : 'Available Endpoints'}</h2>
            <div className="space-y-2">
              {ENDPOINTS.map(({ method, path, desc, descFr }) => (
                <div
                  key={path + method}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900"
                >
                  <span className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-bold font-mono min-w-[56px] text-center ${methodColor[method]}`}>
                    {method}
                  </span>
                  <code className="text-xs font-mono text-slate-700 dark:text-slate-300 flex-1">{path}</code>
                  <span className="text-xs text-slate-400 hidden sm:block">{isFr ? descFr : desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div>
            <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">03</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-5">{isFr ? 'Exemple de requête' : 'Example Request'}</h2>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm space-y-1">
              <p className="text-slate-500 text-xs">{isFr ? '# Lister les articles d\'un tenant' : '# List articles for a tenant'}</p>
              <p className="text-emerald-400">{'curl \\'}</p>
              <p className="text-emerald-400 pl-4">{'-H "Authorization: Bearer $TOKEN" \\'}</p>
              <p className="text-emerald-400 pl-4">{'https://api.nexusblog.com/v1/tenants/{id}/articles'}</p>
            </div>
          </div>
        </div>

        {/* Response codes */}
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div>
            <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">04</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-5">{isFr ? 'Codes de réponse' : 'Response Codes'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { code: '200', label: isFr ? 'Succès' : 'Success', color: 'text-emerald-500' },
                { code: '201', label: isFr ? 'Ressource créée' : 'Created', color: 'text-emerald-500' },
                { code: '400', label: isFr ? 'Requête invalide' : 'Bad Request', color: 'text-amber-500' },
                { code: '401', label: isFr ? 'Non authentifié' : 'Unauthorized', color: 'text-amber-500' },
                { code: '403', label: isFr ? 'Accès refusé' : 'Forbidden', color: 'text-red-500' },
                { code: '404', label: isFr ? 'Introuvable' : 'Not Found', color: 'text-red-500' },
                { code: '429', label: isFr ? 'Limite dépassée' : 'Rate Limited', color: 'text-orange-500' },
                { code: '500', label: isFr ? 'Erreur serveur' : 'Server Error', color: 'text-red-500' },
              ].map(({ code, label, color }) => (
                <div key={code} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className={`font-black font-mono text-sm ${color}`}>{code}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rate limiting */}
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div>
            <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">05</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">{isFr ? 'Limitation de débit' : 'Rate Limiting'}</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isFr
                ? "L'API est limitée à 1 000 requêtes/heure pour Starter, 5 000 pour Pro, et illimité pour Business. Les en-têtes X-RateLimit-Limit et X-RateLimit-Remaining indiquent votre consommation actuelle."
                : 'The API is rate limited to 1,000 req/hour for Starter, 5,000 for Pro, and unlimited for Business. X-RateLimit-Limit and X-RateLimit-Remaining headers indicate current consumption.'}
            </p>
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
