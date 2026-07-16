import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage } from '@/lib/platform-api';

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-500',
  POST: 'bg-blue-500/10 text-blue-500',
  PATCH: 'bg-amber-500/10 text-amber-500',
  DELETE: 'bg-red-500/10 text-red-500',
};

const RESPONSE_COLOR: Record<string, string> = {
  '200': 'text-emerald-500', '201': 'text-emerald-500',
  '400': 'text-amber-500', '401': 'text-amber-500',
  '403': 'text-red-500', '404': 'text-red-500',
  '429': 'text-orange-500', '500': 'text-red-500',
};

const FALLBACK = {
  hero: { title: 'API Reference', subtitle: 'Base URL: https://api.smarterbloggers.com — REST · JSON · JWT Auth' },
  auth: {
    title: 'Authentication',
    description: 'All API requests must include a valid JWT token in the Authorization header. Get your token via POST /v1/auth/token after Firebase authentication.',
    code_comment: '// Request header',
    code: 'Authorization: Bearer <your-jwt-token>',
  },
  endpoints: {
    title: 'Available Endpoints',
    items: [
      { method: 'GET', path: '/v1/tenants', description: 'List all tenants for the authenticated user' },
      { method: 'POST', path: '/v1/tenants', description: 'Create a new tenant (blog)' },
      { method: 'GET', path: '/v1/tenants/{id}/articles', description: 'List articles for a tenant' },
      { method: 'POST', path: '/v1/tenants/{id}/articles', description: 'Create a new article' },
      { method: 'PATCH', path: '/v1/tenants/{id}/articles/{aid}', description: 'Update an article' },
      { method: 'DELETE', path: '/v1/tenants/{id}/articles/{aid}', description: 'Delete an article' },
      { method: 'GET', path: '/v1/tenants/{id}/categories', description: 'List categories for a tenant' },
      { method: 'POST', path: '/v1/tenants/{id}/categories', description: 'Create a new category' },
      { method: 'GET', path: '/v1/tenants/{id}/team', description: 'List team members' },
      { method: 'POST', path: '/v1/tenants/{id}/team/invite', description: 'Invite a team member' },
    ],
  },
  example: {
    title: 'Example Request',
    comment: '# List articles for a tenant',
    lines: ['curl \\', '-H "Authorization: Bearer $TOKEN" \\', 'https://api.smarterbloggers.com/v1/tenants/{id}/articles'],
  },
  response_codes: {
    title: 'Response Codes',
    items: [
      { code: '200', label: 'Success' }, { code: '201', label: 'Created' },
      { code: '400', label: 'Bad Request' }, { code: '401', label: 'Unauthorized' },
      { code: '403', label: 'Forbidden' }, { code: '404', label: 'Not Found' },
      { code: '429', label: 'Rate Limited' }, { code: '500', label: 'Server Error' },
    ],
  },
  rate_limiting: {
    title: 'Rate Limiting',
    description: 'The API is rate limited to 1,000 req/hour for Starter, 5,000 for Pro, and unlimited for Business. X-RateLimit-Limit and X-RateLimit-Remaining headers indicate current consumption.',
  },
};

export default async function ApiReferencePage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('docs-api', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div><span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">01</span></div>
          <div>
            <h2 className="text-xl font-bold mb-4">{c.auth.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{c.auth.description}</p>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm">
              <p className="text-slate-500 text-xs mb-2">{c.auth.code_comment}</p>
              <p className="text-emerald-400">{c.auth.code}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div><span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">02</span></div>
          <div>
            <h2 className="text-xl font-bold mb-5">{c.endpoints.title}</h2>
            <div className="space-y-2">
              {(c.endpoints.items as typeof FALLBACK.endpoints.items).map(({ method, path, description }) => (
                <div key={path + method} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-bold font-mono min-w-[56px] text-center ${METHOD_COLOR[method] ?? ''}`}>
                    {method}
                  </span>
                  <code className="text-xs font-mono text-slate-700 dark:text-slate-300 flex-1">{path}</code>
                  <span className="text-xs text-slate-400 hidden sm:block">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div><span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">03</span></div>
          <div>
            <h2 className="text-xl font-bold mb-5">{c.example.title}</h2>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm space-y-1">
              <p className="text-slate-500 text-xs">{c.example.comment}</p>
              {(c.example.lines as string[]).map((line, i) => (
                <p key={i} className={i > 0 ? 'text-emerald-400 pl-4' : 'text-emerald-400'}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div><span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">04</span></div>
          <div>
            <h2 className="text-xl font-bold mb-5">{c.response_codes.title}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {(c.response_codes.items as typeof FALLBACK.response_codes.items).map(({ code, label }) => (
                <div key={code} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className={`font-black font-mono text-sm ${RESPONSE_COLOR[code] ?? ''}`}>{code}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-10">
          <div><span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">05</span></div>
          <div>
            <h2 className="text-xl font-bold mb-4">{c.rate_limiting.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{c.rate_limiting.description}</p>
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
