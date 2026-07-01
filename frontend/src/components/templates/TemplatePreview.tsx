'use client';

import { useState, useContext, createContext, type ReactNode } from 'react';
import { type BlogTemplateConfig, type TemplateContent, DEFAULT_TEMPLATE_CONTENT } from '@/lib/templates';

export interface TemplatePreviewProps {
  templateId: string;
  config: BlogTemplateConfig;
  content?: TemplateContent;
  editMode?: boolean;
  selectedSection?: string | null;
  onSelectSection?: (id: string) => void;
}

interface EditCtx { editMode: boolean; selected: string | null; onSelect: (id: string) => void; }
const EditContext = createContext<EditCtx>({ editMode: false, selected: null, onSelect: () => {} });

const IMGS = [
  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
  'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)',
  'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)',
  'linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)',
];

const ARTS = [
  { t: 'How to Build a Successful Blog in 2026',        c: 'Strategy', r: '8 min',  d: 'Jun 28', img: 0 },
  { t: 'The Art of Writing Compelling Headlines',        c: 'Writing',  r: '5 min',  d: 'Jun 25', img: 1 },
  { t: 'SEO Strategies That Actually Work Today',        c: 'SEO',      r: '12 min', d: 'Jun 22', img: 2 },
  { t: 'Building Your Email List from Scratch',          c: 'Growth',   r: '7 min',  d: 'Jun 20', img: 3 },
  { t: 'Monetizing Your Blog: A Complete Guide',         c: 'Business', r: '15 min', d: 'Jun 18', img: 4 },
  { t: 'Content Calendar: Plan Like a Pro',              c: 'Planning', r: '6 min',  d: 'Jun 15', img: 5 },
  { t: 'Social Media Strategies for Bloggers',           c: 'Social',   r: '9 min',  d: 'Jun 12', img: 6 },
  { t: 'Photography Tips for Blog Content Creation',     c: 'Design',   r: '11 min', d: 'Jun 10', img: 7 },
];

const EXCERPTS = [
  'Discover the proven strategies that top bloggers use to grow their audience from zero to thousands of subscribers in just a few months.',
  'Master the psychological principles behind headlines that stop readers in their tracks and compel them to click.',
  'Deep dive into modern SEO techniques that go beyond keywords to deliver sustainable organic traffic growth.',
  'Build a loyal subscriber base with these battle-tested tactics used by the world\'s most successful content creators.',
  'Explore multiple revenue streams that can turn your passion project into a full-time income in less than a year.',
  'Stay consistent and never run out of ideas with a systematic approach to planning and batching your content.',
];

export function TemplatePreview({
  templateId, config, content,
  editMode = false, selectedSection, onSelectSection,
}: TemplatePreviewProps) {
  const p = config.primaryColor;
  const c = { ...DEFAULT_TEMPLATE_CONTENT, ...content };
  const tpl = (() => {
    switch (templateId) {
      case 'minimal':   return <MinimalTpl p={p} c={c} />;
      case 'magazine':  return <MagazineTpl p={p} c={c} />;
      case 'business':  return <BusinessTpl p={p} c={c} />;
      case 'news':      return <NewsTpl p={p} c={c} />;
      case 'tech':      return <TechTpl p={p} c={c} />;
      case 'portfolio': return <PortfolioTpl p={p} c={c} />;
      default:          return <MinimalTpl p={p} c={c} />;
    }
  })();
  return (
    <EditContext.Provider value={{ editMode, selected: selectedSection ?? null, onSelect: onSelectSection ?? (() => {}) }}>
      {tpl}
    </EditContext.Provider>
  );
}

type TplProps = { p: string; c: TemplateContent };

function EditableSection({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { editMode, selected, onSelect } = useContext(EditContext);
  const [hovered, setHovered] = useState(false);
  if (!editMode) return <>{children}</>;
  const isSelected = selected === id;
  const showBadge = isSelected || hovered;
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        outline: isSelected ? '2px solid #2563eb' : hovered ? '2px dashed #93c5fd' : '2px solid transparent',
        outlineOffset: -2,
        cursor: 'pointer',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showBadge && (
        <div style={{
          position: 'absolute', top: 6, left: 6, zIndex: 100,
          background: isSelected ? '#2563eb' : '#60a5fa',
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '3px 10px', borderRadius: 4, pointerEvents: 'none',
          letterSpacing: 0.3, whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── MINIMAL ──────────────────────────────────────────────────────────────────
function MinimalTpl({ p, c }: TplProps) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Georgia, serif', color: '#111', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <header style={{ padding: '28px 120px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #efefef' }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1 }}>{c.blogName}</span>
          <nav style={{ display: 'flex', gap: 36, fontFamily: 'system-ui' }}>
            {['Articles', 'About', 'Portfolio', 'Newsletter', 'Contact'].map(n => (
              <span key={n} style={{ fontSize: 14, color: '#555' }}>{n}</span>
            ))}
          </nav>
        </header>
      </EditableSection>

      <EditableSection id="hero" label="Section Hero">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 32px 52px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: p, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'system-ui', marginBottom: 20 }}>
            {ARTS[0].c} · {ARTS[0].d}, 2026
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1.5, marginBottom: 24, color: '#000' }}>
            {c.heroHeadline}
          </h1>
          <p style={{ fontSize: 20, color: '#555', lineHeight: 1.75, marginBottom: 32 }}>{c.heroSubheadline}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'system-ui' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: IMGS[0], flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sarah Johnson</div>
              <div style={{ fontSize: 13, color: '#999' }}>{ARTS[0].r} read</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '12px 28px', background: '#111', color: '#fff', borderRadius: 4, fontSize: 14, fontWeight: 500, letterSpacing: 0.3 }}>{c.heroCta} →</div>
          </div>
        </div>
        <div style={{ height: 1, background: '#efefef', maxWidth: 760, margin: '0 auto 60px', width: '100%' }} />
      </EditableSection>

      <EditableSection id="latest" label="Articles récents">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'system-ui', color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 40 }}>{c.latestSectionTitle}</div>
          {ARTS.slice(1, 5).map((a, i) => (
            <div key={i} style={{ paddingBottom: 44, marginBottom: 44, borderBottom: '1px solid #efefef' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, fontFamily: 'system-ui' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: p, textTransform: 'uppercase', letterSpacing: 1 }}>{a.c}</span>
                <span style={{ color: '#ddd' }}>·</span>
                <span style={{ fontSize: 12, color: '#aaa' }}>{a.d}, 2026 · {a.r} read</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 14 }}>{a.t}</h2>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 18 }}>{EXCERPTS[i + 1]}</p>
              <span style={{ fontSize: 14, color: p, fontFamily: 'system-ui', fontWeight: 500 }}>Read more →</span>
            </div>
          ))}
        </div>
      </EditableSection>

      <EditableSection id="newsletter" label="Newsletter">
        <div style={{ background: '#fafafa', borderTop: '1px solid #efefef', padding: '72px 32px', textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: p, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'system-ui', marginBottom: 16 }}>Newsletter</div>
          <h3 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, marginBottom: 14 }}>{c.newsletterTitle}</h3>
          <p style={{ fontSize: 16, color: '#777', marginBottom: 32, fontFamily: 'system-ui' }}>{c.newsletterDescription}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 440, margin: '0 auto' }}>
            <div style={{ flex: 1, height: 48, background: '#fff', border: '1.5px solid #ddd', borderRadius: 4, fontSize: 14, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', paddingLeft: 16, color: '#bbb' }}>Your email address</div>
            <div style={{ padding: '0 24px', height: 48, background: '#111', borderRadius: 4, display: 'flex', alignItems: 'center', color: '#fff', fontSize: 14, fontFamily: 'system-ui', fontWeight: 500 }}>{c.newsletterCta}</div>
          </div>
          <p style={{ fontSize: 12, color: '#bbb', marginTop: 14, fontFamily: 'system-ui' }}>No spam, ever. Unsubscribe in one click.</p>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ borderTop: '1px solid #efefef', padding: '36px 120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'system-ui' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{c.blogName}</span>
          <span style={{ fontSize: 13, color: '#bbb' }}>© 2026 {c.blogName}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'RSS Feed'].map(l => <span key={l} style={{ fontSize: 13, color: '#888' }}>{l}</span>)}
          </div>
        </footer>
      </EditableSection>

    </div>
  );
}

// ─── MAGAZINE ─────────────────────────────────────────────────────────────────
function MagazineTpl({ p, c }: TplProps) {
  const cats = ['World', 'Technology', 'Culture', 'Business', 'Science', 'Opinion'];
  return (
    <div style={{ background: '#fff', fontFamily: 'system-ui', color: '#111', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <div style={{ background: p, padding: '10px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {cats.map(cat => <span key={cat} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat}</span>)}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Tuesday, June 28, 2026</span>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 48px 20px', borderBottom: '3px solid #111' }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -3, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{c.blogName.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 8, letterSpacing: 2 }}>INDEPENDENT JOURNALISM · EST. 2026</div>
        </div>
        <div style={{ borderBottom: '1px solid #ddd', padding: '0 48px', display: 'flex', gap: 0 }}>
          {cats.map((cat, i) => (
            <div key={cat} style={{ padding: '14px 22px', fontSize: 13, fontWeight: 600, color: i === 0 ? p : '#333', borderBottom: i === 0 ? `2px solid ${p}` : '2px solid transparent', textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat}</div>
          ))}
          <div style={{ marginLeft: 'auto', padding: '14px 0', fontSize: 13, color: '#999' }}>🔍 Search</div>
        </div>
      </EditableSection>

      <EditableSection id="hero" label="Section Hero">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 0, borderBottom: '1px solid #ddd', margin: '0 48px' }}>
          <div style={{ padding: '32px 32px 32px 0', borderRight: '1px solid #ddd' }}>
            <div style={{ height: 340, background: IMGS[0], borderRadius: 4, marginBottom: 20 }} />
            <div style={{ display: 'inline-block', background: p, color: '#fff', padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>FEATURED</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.8, fontFamily: 'Georgia, serif', marginBottom: 14 }}>{ARTS[0].t}</h1>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{EXCERPTS[0]}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#888' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: IMGS[1] }} />
              <span>By <strong style={{ color: '#333' }}>Sarah Johnson</strong> · {ARTS[0].d} · {ARTS[0].r} read</span>
            </div>
          </div>
          <div style={{ padding: '32px 0 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#999', borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 4 }}>Also Today</div>
            {ARTS.slice(1, 5).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 80, height: 64, background: IMGS[(i + 1) % IMGS.length], borderRadius: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: p, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{a.c}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{a.t}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{a.d} · {a.r} read</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="latest" label="Articles récents">
        <div style={{ padding: '40px 48px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: '#999', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 32 }}>{c.latestSectionTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {ARTS.slice(2, 5).map((a, i) => (
              <div key={i}>
                <div style={{ height: 180, background: IMGS[(i + 2) % IMGS.length], borderRadius: 4, marginBottom: 16 }} />
                <div style={{ fontSize: 10, color: p, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{a.c}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, fontFamily: 'Georgia, serif', marginBottom: 10 }}>{a.t}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>{EXCERPTS[i + 2].substring(0, 90)}...</p>
                <div style={{ fontSize: 12, color: '#aaa' }}>{a.d} · {a.r} read</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fafafa', borderTop: '1px solid #eee', padding: '40px 48px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: '#999', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 32 }}>Opinion</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {ARTS.slice(5, 7).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: IMGS[(i + 5) % IMGS.length], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, fontFamily: 'Georgia, serif', marginBottom: 10 }}>{a.t}</div>
                  <div style={{ fontSize: 13, color: '#777', lineHeight: 1.6 }}>{EXCERPTS[i % EXCERPTS.length].substring(0, 80)}...</div>
                  <div style={{ fontSize: 12, color: p, marginTop: 10, fontWeight: 600 }}>Read Opinion →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="newsletter" label="Newsletter">
        <div style={{ background: p, padding: '56px 48px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12, fontFamily: 'Georgia, serif' }}>{c.newsletterTitle}</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>{c.newsletterDescription}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 440, margin: '0 auto' }}>
            <div style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 16, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Your email</div>
            <div style={{ padding: '0 24px', height: 48, background: '#fff', color: p, borderRadius: 4, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700 }}>{c.newsletterCta}</div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ background: '#111', padding: '48px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: 16 }}>{c.blogName.toUpperCase()}</div>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>Committed to independent journalism and honest reporting since 2026.</p>
            <div style={{ display: 'flex', gap: 14 }}>
              {['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].map(s => <div key={s} style={{ width: 32, height: 32, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#aaa' }}>{s[0]}</div>)}
            </div>
          </div>
          {[['Sections', 'World', 'Tech', 'Culture', 'Business'], ['About', 'Team', 'Contact', 'Advertise', 'Careers'], ['Legal', 'Privacy', 'Terms', 'Cookies', 'RSS']].map(([title, ...links]) => (
            <div key={title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>{title}</div>
              {links.map(l => <div key={l} style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>{l}</div>)}
            </div>
          ))}
        </footer>
      </EditableSection>

    </div>
  );
}

// ─── BUSINESS ─────────────────────────────────────────────────────────────────
function BusinessTpl({ p, c }: TplProps) {
  return (
    <div style={{ background: '#f8fafc', fontFamily: 'system-ui', color: '#0f172a', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 60px', display: 'flex', alignItems: 'center', height: 68, gap: 48, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: p }} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{c.blogName}</span>
          </div>
          <nav style={{ display: 'flex', gap: 32, flex: 1 }}>
            {['Blog', 'Categories', 'Authors', 'Resources', 'Case Studies'].map(n => (
              <span key={n} style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{n}</span>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ padding: '8px 20px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#475569', fontWeight: 500 }}>Sign In</div>
            <div style={{ padding: '8px 20px', background: p, borderRadius: 6, fontSize: 13, color: '#fff', fontWeight: 600 }}>Get Started</div>
          </div>
        </header>
      </EditableSection>

      <EditableSection id="hero" label="Section Hero">
        <div style={{ background: `linear-gradient(135deg, ${p} 0%, #1e293b 100%)`, padding: '80px 100px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -80, right: 160, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ maxWidth: 640, position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>New articles every week</span>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>{c.heroHeadline}</h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>{c.heroSubheadline}</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ padding: '14px 32px', background: '#fff', color: p, borderRadius: 8, fontSize: 15, fontWeight: 700 }}>{c.heroCta}</div>
              <div style={{ padding: '14px 32px', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600 }}>Watch Demo</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0 60px' }}>
          {[['240+', 'Articles Published'], ['18K+', 'Monthly Readers'], ['42', 'Expert Authors'], ['4.9★', 'Reader Rating']].map(([val, label]) => (
            <div key={label} style={{ padding: '28px 0', borderRight: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: p, letterSpacing: -0.8 }}>{val}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </EditableSection>

      <EditableSection id="featured" label="Articles vedettes">
        <div style={{ padding: '56px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 36 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, marginBottom: 6 }}>{c.featuredSectionTitle}</h2>
              <p style={{ fontSize: 14, color: '#64748b' }}>Hand-picked by our editorial team</p>
            </div>
            <span style={{ fontSize: 14, color: p, fontWeight: 600 }}>View all →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
            {ARTS.slice(0, 3).map((a, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ height: 200, background: IMGS[i] }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ background: p + '18', color: p, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>{a.c}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{a.r} read</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, letterSpacing: -0.3, marginBottom: 12 }}>{a.t}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, marginBottom: 20 }}>{EXCERPTS[i].substring(0, 100)}...</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: IMGS[(i + 3) % IMGS.length] }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Sarah J.</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.d}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: p, fontWeight: 600 }}>Read →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="latest" label="Articles récents">
        <div style={{ padding: '0 60px 56px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{c.latestSectionTitle}</h2>
              <span style={{ fontSize: 14, color: p, fontWeight: 600 }}>View all →</span>
            </div>
            {ARTS.slice(3).map((a, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #f1f5f9', display: 'flex', gap: 20, padding: 20, marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 100, height: 80, background: IMGS[(i + 3) % IMGS.length], borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span style={{ background: p + '14', color: p, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{a.c}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{a.r} read</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>{a.t}</h3>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>By Sarah Johnson · {a.d}, 2026</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Popular Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Strategy', 'SEO', 'Growth', 'Writing', 'Social Media', 'Business', 'Design', 'Marketing', 'Analytics'].map(t => (
                  <span key={t} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#475569', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ background: p, borderRadius: 12, padding: 28, color: '#fff' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{c.newsletterTitle}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.6 }}>{c.newsletterDescription}</p>
              <div style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 6, height: 42, display: 'flex', alignItems: 'center', paddingLeft: 14, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Your email</div>
              <div style={{ background: '#fff', color: p, borderRadius: 6, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>Subscribe Free</div>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ background: '#0f172a', padding: '56px 60px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: p }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{c.blogName}</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>Expert insights for modern business professionals. Trusted by thousands worldwide.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Tw', 'Li', 'Fb', 'Yt'].map(s => <div key={s} style={{ width: 36, height: 36, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#64748b', fontWeight: 700 }}>{s}</div>)}
              </div>
            </div>
            {[['Product', 'Blog', 'Newsletter', 'Authors', 'Advertise'], ['Company', 'About', 'Careers', 'Press', 'Contact'], ['Legal', 'Privacy', 'Terms', 'Cookies', 'Sitemap']].map(([title, ...links]) => (
              <div key={title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>{title}</div>
                {links.map(l => <div key={l} style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1 }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
            <span>© 2026 {c.blogName}. All rights reserved.</span>
            <span>Made with ❤️ for content creators</span>
          </div>
        </footer>
      </EditableSection>

    </div>
  );
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
function NewsTpl({ p, c }: TplProps) {
  return (
    <div style={{ background: '#f5f5f0', fontFamily: '"Times New Roman", Georgia, serif', color: '#111', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <div style={{ background: p, display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ background: '#111', color: '#fff', padding: '9px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Breaking</div>
          <div style={{ padding: '9px 20px', fontSize: 12, color: '#fff', fontFamily: 'system-ui' }}>Global summit reaches landmark agreement on digital rights · Tech stocks surge following Fed announcement · Local elections result in major shake-up</div>
        </div>
        <div style={{ background: '#fff', borderBottom: '3px solid #111', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontFamily: 'system-ui', color: '#666' }}>Tuesday, June 28, 2026</div>
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: -4, textAlign: 'center', lineHeight: 1 }}>{c.blogName.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 16, fontFamily: 'system-ui' }}>
            <div style={{ border: '1.5px solid #111', padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>Subscribe</div>
            <div style={{ background: p, color: '#fff', padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>Login</div>
          </div>
        </div>
        <div style={{ background: '#111', padding: '0 48px', display: 'flex' }}>
          {['Front Page', 'World', 'Politics', 'Business', 'Technology', 'Sports', 'Opinion', 'Culture', 'Science'].map((nav, i) => (
            <div key={nav} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: i === 0 ? p : 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: i === 0 ? `2px solid ${p}` : '2px solid transparent', fontFamily: 'system-ui' }}>{nav}</div>
          ))}
        </div>
      </EditableSection>

      <EditableSection id="hero" label="Contenu principal">
        <div style={{ padding: '28px 48px', display: 'grid', gridTemplateColumns: '5fr 2fr', gap: 32 }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, paddingBottom: 28, borderBottom: '2px solid #111', marginBottom: 28 }}>
              <div>
                <div style={{ height: 280, background: IMGS[0], marginBottom: 16, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)', padding: '20px 16px' }}>
                    <span style={{ background: p, color: '#fff', padding: '2px 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'system-ui' }}>{ARTS[0].c}</span>
                  </div>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 12 }}>{ARTS[0].t}</h1>
                <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 12 }}>{EXCERPTS[0]}</p>
                <div style={{ fontSize: 12, color: '#888', fontFamily: 'system-ui' }}>By <strong>Sarah Johnson</strong> · {ARTS[0].d}, 2026 · {ARTS[0].r} read</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderLeft: '1px solid #ddd', paddingLeft: 24 }}>
                {ARTS.slice(1, 4).map((a, i) => (
                  <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < 2 ? '1px solid #eee' : 'none' }}>
                    <div style={{ fontSize: 10, color: p, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: 'system-ui' }}>{a.c}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>{a.t}</h3>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{EXCERPTS[i + 1].substring(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, paddingBottom: 28, borderBottom: '1px solid #ddd', marginBottom: 28 }}>
              {ARTS.slice(4).map((a, i) => (
                <div key={i}>
                  <div style={{ height: 120, background: IMGS[(i + 4) % IMGS.length], marginBottom: 10 }} />
                  <div style={{ fontSize: 10, color: p, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'system-ui' }}>{a.c}</div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{a.t}</h4>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'system-ui' }}>{a.d} · {a.r}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#999', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 20, fontFamily: 'system-ui' }}>Opinion</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {ARTS.slice(0, 2).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: IMGS[(i + 6) % IMGS.length], flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25, marginBottom: 6 }}>{a.t}</div>
                      <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5, fontFamily: 'system-ui' }}>{EXCERPTS[i].substring(0, 70)}...</div>
                      <div style={{ fontSize: 11, color: p, marginTop: 8, fontFamily: 'system-ui', fontWeight: 600 }}>Read the full column →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #ddd', paddingLeft: 24 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#999', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 16, fontFamily: 'system-ui' }}>Most Read</div>
              {ARTS.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #eee' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#eee', lineHeight: 1, minWidth: 28 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{a.t}</div>
                </div>
              ))}
            </div>
            <div style={{ background: p, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Subscribe Today</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 1.5, fontFamily: 'system-ui' }}>Get unlimited access to all our content for just $9.99/month.</p>
              <div style={{ background: '#fff', color: p, textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 700, fontFamily: 'system-ui' }}>Start Free Trial</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#999', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 16, fontFamily: 'system-ui' }}>Also in Tech</div>
              {ARTS.slice(2, 5).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #eee' }}>
                  <div style={{ width: 68, height: 52, background: IMGS[(i + 2) % IMGS.length], flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{a.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ background: '#111', padding: '36px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'system-ui' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{c.blogName.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['About', 'Advertising', 'Terms', 'Privacy', 'Contact', 'RSS'].map(l => <span key={l} style={{ fontSize: 12, color: '#888' }}>{l}</span>)}
          </div>
          <span style={{ fontSize: 12, color: '#555' }}>© 2026 The Daily Post</span>
        </footer>
      </EditableSection>

    </div>
  );
}

// ─── TECH ─────────────────────────────────────────────────────────────────────
function TechTpl({ p, c }: TplProps) {
  const dimBg = '#09090b';
  const cardBg = '#18181b';
  const border = '#27272a';
  const muted = '#71717a';
  return (
    <div style={{ background: dimBg, fontFamily: '"JetBrains Mono", "Fira Code", monospace', color: '#fafafa', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <header style={{ background: '#0c0c0e', borderBottom: `1px solid ${border}`, padding: '0 60px', display: 'flex', alignItems: 'center', height: 64, gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>&gt;</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{c.blogName}</span>
          </div>
          <nav style={{ display: 'flex', gap: 28, flex: 1 }}>
            {['Articles', 'Tutorials', 'Open Source', 'Tools', 'Newsletter'].map(n => (
              <span key={n} style={{ fontSize: 13, color: muted, fontWeight: 500 }}>{n}</span>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: muted }}>GH</div>
            <div style={{ padding: '7px 18px', background: p, borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff' }}>Subscribe</div>
          </div>
        </header>
      </EditableSection>

      <EditableSection id="hero" label="Section Hero">
        <div style={{ padding: '72px 60px 56px', borderBottom: `1px solid ${border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: p + '20', border: `1px solid ${p}40`, borderRadius: 6, padding: '6px 14px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: p }} />
              <span style={{ fontSize: 12, color: p, fontWeight: 600 }}>Latest Post · Just published</span>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20, color: '#fff' }}>{c.heroHeadline}</h1>
            <p style={{ fontSize: 16, color: muted, lineHeight: 1.75, marginBottom: 32, fontFamily: 'system-ui' }}>{c.heroSubheadline}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
              {['JavaScript', 'Node.js', 'Performance'].map(t => (
                <span key={t} style={{ background: border, border: `1px solid #3f3f46`, color: '#a1a1aa', padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>#{t}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ padding: '12px 28px', background: p, borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff' }}>Read Article →</div>
              <div style={{ padding: '12px 28px', border: `1.5px solid ${border}`, borderRadius: 6, fontSize: 14, color: muted }}>Browse All</div>
            </div>
          </div>
          <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
            <div style={{ background: '#0c0c0e', padding: '12px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
              </div>
              <span style={{ fontSize: 12, color: muted, marginLeft: 8 }}>article.md</span>
            </div>
            <div style={{ padding: '24px 28px', fontSize: 13, lineHeight: 1.8, color: '#a1a1aa' }}>
              <span style={{ color: '#60a5fa' }}>const</span> <span style={{ color: '#fafafa' }}>blog</span> <span style={{ color: '#f472b6' }}>= </span><span style={{ color: '#34d399' }}>&#123;</span><br />
              <span style={{ paddingLeft: 24, color: '#60a5fa' }}>title</span><span style={{ color: muted }}>: </span><span style={{ color: '#fbbf24' }}>"{ARTS[0].t.substring(0, 30)}..."</span>,<br />
              <span style={{ paddingLeft: 24, color: '#60a5fa' }}>author</span><span style={{ color: muted }}>: </span><span style={{ color: '#fbbf24' }}>"Sarah Johnson"</span>,<br />
              <span style={{ paddingLeft: 24, color: '#60a5fa' }}>tags</span><span style={{ color: muted }}>: </span><span style={{ color: '#34d399' }}>[</span><span style={{ color: '#fbbf24' }}>"javascript"</span><span style={{ color: muted }}>, </span><span style={{ color: '#fbbf24' }}>"api"</span><span style={{ color: '#34d399' }}>]</span>,<br />
              <span style={{ paddingLeft: 24, color: '#60a5fa' }}>readTime</span><span style={{ color: muted }}>: </span><span style={{ color: '#c4b5fd' }}>8</span>,<br />
              <span style={{ paddingLeft: 24, color: '#60a5fa' }}>views</span><span style={{ color: muted }}>: </span><span style={{ color: '#c4b5fd' }}>12_487</span>,<br />
              <span style={{ color: '#34d399' }}>&#125;</span>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="latest" label="Articles récents">
        <div style={{ padding: '56px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}><span style={{ color: p }}>_</span>{c.latestSectionTitle}</h2>
            <span style={{ fontSize: 13, color: p, fontWeight: 600 }}>view all →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {ARTS.slice(1, 4).map((a, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: 180, background: IMGS[(i + 1) % IMGS.length] }} />
                <div style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <span style={{ background: p + '20', color: p, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>{a.c}</span>
                    <span style={{ fontSize: 11, color: muted }}>{a.r} read · {a.d}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 12, color: '#f4f4f5' }}>{a.t}</h3>
                  <p style={{ fontSize: 13, color: muted, lineHeight: 1.65, marginBottom: 20, fontFamily: 'system-ui' }}>{EXCERPTS[i + 1].substring(0, 90)}...</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: IMGS[(i + 4) % IMGS.length] }} />
                      <span style={{ fontSize: 12, color: '#a1a1aa' }}>sarah.js</span>
                    </div>
                    <span style={{ fontSize: 12, color: p, fontWeight: 600 }}>read →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 60px 56px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 32 }}><span style={{ color: p }}>_</span>tutorials</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {ARTS.slice(4).map((a, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, background: p + '20', border: `1px solid ${p}40`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {['⚡', '🔧', '🚀', '📦'][i % 4]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ background: border, color: '#a1a1aa', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>{a.c.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: muted }}>{a.r}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>{a.t}</h3>
                  <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, fontFamily: 'system-ui' }}>{EXCERPTS[i % EXCERPTS.length].substring(0, 80)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="newsletter" label="Newsletter">
        <div style={{ background: cardBg, border: `1px solid ${border}`, margin: '0 60px 60px', borderRadius: 16, padding: '48px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: p, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Newsletter</div>
            <h3 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginBottom: 16, lineHeight: 1.2 }}>{c.newsletterTitle}<br /><span style={{ color: p }}>{c.tagline}</span></h3>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, fontFamily: 'system-ui' }}>No fluff. Just the most important articles, tutorials and open-source discoveries delivered weekly.</p>
          </div>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: dimBg, border: `1.5px solid ${border}`, borderRadius: 8, height: 48, display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 13, color: muted }}>your@email.com</div>
              <div style={{ background: p, borderRadius: 8, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>Subscribe — it&apos;s free</div>
            </div>
            <p style={{ fontSize: 11, color: '#52525b', marginTop: 12, textAlign: 'center', fontFamily: 'system-ui' }}>3,200+ developers. Unsubscribe anytime.</p>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ background: '#0c0c0e', borderTop: `1px solid ${border}`, padding: '40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'system-ui' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: p }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>{c.blogName}</span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Articles', 'Tutorials', 'GitHub', 'RSS', 'Contact'].map(l => <span key={l} style={{ fontSize: 13, color: muted }}>{l}</span>)}
          </div>
          <span style={{ fontSize: 12, color: '#3f3f46' }}>© 2026 {c.blogName}</span>
        </footer>
      </EditableSection>

    </div>
  );
}

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
function PortfolioTpl({ p, c }: TplProps) {
  const workItems = [
    { h: 260, img: 0, label: 'Brand Identity' },
    { h: 200, img: 1, label: 'UI Design' },
    { h: 220, img: 2, label: 'Photography' },
    { h: 190, img: 3, label: 'Web Design' },
    { h: 240, img: 4, label: 'Illustration' },
    { h: 210, img: 5, label: 'Motion' },
  ];
  return (
    <div style={{ background: '#fff', fontFamily: 'system-ui', color: '#111', width: 1200 }}>

      <EditableSection id="header" label="En-tête">
        <header style={{ padding: '28px 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: p }}>{c.blogName.toUpperCase()}</span>
          <nav style={{ display: 'flex', gap: 40 }}>
            {['Work', 'Writing', 'About', 'Contact'].map(n => <span key={n} style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>{n}</span>)}
          </nav>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: IMGS[0] }} />
        </header>
      </EditableSection>

      <EditableSection id="hero" label="Section Hero">
        <div style={{ height: 500, background: `linear-gradient(160deg, ${p}18 0%, ${p}05 50%, #f8f8f8 100%)`, display: 'flex', alignItems: 'center', padding: '0 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 80, top: 60, width: 380, height: 380, background: IMGS[0], borderRadius: 24, transform: 'rotate(6deg)', opacity: 0.9 }} />
          <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>Creative Writer & Designer</div>
            <h1 style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2.5, marginBottom: 24, color: '#0a0a0a' }}>{c.heroHeadline}</h1>
            <p style={{ fontSize: 18, color: '#555', lineHeight: 1.7, marginBottom: 36 }}>{c.heroSubheadline}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ padding: '14px 32px', background: p, color: '#fff', borderRadius: 40, fontSize: 15, fontWeight: 600 }}>{c.heroCta} →</div>
              <div style={{ padding: '14px 32px', border: `1.5px solid #ddd`, borderRadius: 40, fontSize: 15, color: '#555' }}>View Portfolio</div>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="featured" label="Portfolio">
        <div style={{ padding: '72px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Selected Work</h2>
            <span style={{ fontSize: 14, color: p, fontWeight: 600 }}>View all projects →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {workItems.map((item, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, height: item.h, cursor: 'pointer' }}>
                <div style={{ width: '100%', height: '100%', background: IMGS[item.img % IMGS.length] }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{ARTS[i % ARTS.length].t.substring(0, 35)}...</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="about" label="À propos">
        <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '72px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: p, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 20 }}>About Me</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 24 }}>Hi, I&apos;m Alex<br />Chen ✌️</h2>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 20 }}>I&apos;m a designer, writer and creative director based in Paris. I&apos;ve spent the last 8 years creating compelling content and visual narratives for brands around the world.</p>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 32 }}>This blog is where I share my thoughts on creativity, design, and the ever-changing landscape of visual communication.</p>
            <div style={{ display: 'flex', gap: 40 }}>
              {[['8+', 'Years Exp.'], ['120+', 'Projects'], ['40K', 'Readers']].map(([val, lab]) => (
                <div key={lab}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: p, letterSpacing: -1 }}>{val}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{lab}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ height: 440, background: IMGS[2], borderRadius: 24 }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Latest Essay</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{ARTS[0].t.substring(0, 30)}...</div>
              <div style={{ fontSize: 11, color: p, marginTop: 6, fontWeight: 600 }}>Read now →</div>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="latest" label="Articles récents">
        <div style={{ padding: '72px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>{c.latestSectionTitle}</h2>
            <span style={{ fontSize: 14, color: p, fontWeight: 600 }}>All articles →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36 }}>
            {ARTS.slice(0, 3).map((a, i) => (
              <div key={i}>
                <div style={{ height: 200, background: IMGS[i], borderRadius: 16, marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: p + '15', color: p, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>{a.c}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{a.r} read</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.4, marginBottom: 12 }}>{a.t}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>{EXCERPTS[i].substring(0, 90)}...</p>
                <div style={{ fontSize: 13, color: p, fontWeight: 600 }}>Read essay →</div>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="contact" label="Contact">
        <div style={{ background: `linear-gradient(135deg, ${p} 0%, #1e293b 100%)`, padding: '80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: -1.5, marginBottom: 16 }}>Let&apos;s work together</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 40 }}>Have a project in mind? I&apos;d love to hear about it.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ padding: '16px 40px', background: '#fff', color: p, borderRadius: 40, fontSize: 16, fontWeight: 700 }}>Get in touch →</div>
            <div style={{ padding: '16px 40px', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 40, fontSize: 16, fontWeight: 600 }}>View Portfolio</div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="footer" label="Pied de page">
        <footer style={{ padding: '32px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: p }}>{c.blogName.toUpperCase()}</span>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Twitter', 'Instagram', 'Dribbble', 'LinkedIn'].map(s => <span key={s} style={{ fontSize: 13, color: '#888' }}>{s}</span>)}
          </div>
          <span style={{ fontSize: 13, color: '#bbb' }}>© 2026 Alex Chen</span>
        </footer>
      </EditableSection>

    </div>
  );
}
