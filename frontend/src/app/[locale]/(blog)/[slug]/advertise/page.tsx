import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { AdvertiseForm } from './AdvertiseForm';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return { title: `Advertise on ${blog.name}`, description: `Reach the audience of ${blog.name} with targeted advertising.` };
  } catch {
    return { title: 'Advertise' };
  }
}

export default async function AdvertisePage({ params }: { params: Params }) {
  const { slug } = await params;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
      style={{ '--blog-primary': blog.primary_color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          {blog.logo_url ? (
            <img src={blog.logo_url} alt={blog.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: blog.primary_color }}
            >
              {blog.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <a href={`/${slug}`} className="text-[15px] font-bold text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity">
            {blog.name}
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-[11px] font-bold mb-5 text-white"
            style={{ backgroundColor: blog.primary_color }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Advertise
          </div>
          <h1 className="text-[32px] font-black text-slate-900 dark:text-slate-100 leading-tight mb-3">
            Reach the <span style={{ color: blog.primary_color }}>{blog.name}</span> audience
          </h1>
          {blog.description && (
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              {blog.description}
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { step: '1', title: 'Submit your ad', desc: 'Fill in the form below with your ad details and target URL.' },
            { step: '2', title: 'Manual review', desc: 'The blog owner reviews your submission and approves or rejects it.' },
            { step: '3', title: 'Go live', desc: "Once approved, your ad goes live and starts reaching readers." },
          ].map(s => (
            <div key={s.step} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 text-center">
              <div
                className="h-8 w-8 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-[13px] font-black"
                style={{ backgroundColor: blog.primary_color }}
              >
                {s.step}
              </div>
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-1">{s.title}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <AdvertiseForm tenantId={blog.id} blogName={blog.name} primaryColor={blog.primary_color} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6 text-center">
        <p className="text-[12px] text-slate-400 dark:text-slate-500">
          Powered by{' '}
          <a href="/" className="font-semibold hover:underline" style={{ color: blog.primary_color }}>
            NexusBlog
          </a>
        </p>
      </div>
    </div>
  );
}
