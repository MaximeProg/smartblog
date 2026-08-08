import type { BlogInfo, PublicArticle, PublicArticleFull, PublicCategory } from '@/lib/public-api';

export const MOCK_CATEGORIES: PublicCategory[] = [
  {
    id: 'cat-technology',
    name: 'Technology',
    slug: 'technology',
    description: 'The latest breakthroughs in software, hardware, and digital culture.',
    cover_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    articles_count: 3,
  },
  {
    id: 'cat-design',
    name: 'Design',
    slug: 'design',
    description: 'Where creativity meets function — UI, UX, brand, and beyond.',
    cover_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    articles_count: 2,
  },
  {
    id: 'cat-product',
    name: 'Product',
    slug: 'product',
    description: 'Building software products that people love.',
    cover_image_url: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80',
    articles_count: 1,
  },
  {
    id: 'cat-business',
    name: 'Business',
    slug: 'business',
    description: 'Strategy, growth, and leadership for the modern organization.',
    cover_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    articles_count: 1,
  },
  {
    id: 'cat-productivity',
    name: 'Productivity',
    slug: 'productivity',
    description: 'Work smarter, not harder — focus, habits, and systems.',
    cover_image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    articles_count: 1,
  },
];

export const MOCK_ARTICLES: PublicArticle[] = [
  {
    id: 'art-001',
    title: 'The Future of Artificial Intelligence in Healthcare',
    slug: 'future-ai-healthcare',
    excerpt: 'Machine learning models are transforming diagnostics, drug discovery, and patient care at an unprecedented pace. Here\'s what the next decade holds for medicine.',
    cover_image_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Sarah Chen',
    author_avatar_url: null,
    category_slug: 'technology',
    category_name: 'Technology',
    tags: ['AI', 'Healthcare', 'Machine Learning', 'Future'],
    published_at: '2026-06-28T10:00:00Z',
    reading_time_minutes: 8,
    views_count: 14280,
    likes_count: 892,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-002',
    title: 'Design Systems at Scale: Lessons from a Decade of Practice',
    slug: 'design-systems-at-scale',
    excerpt: 'Building and maintaining a design system across hundreds of engineers and dozens of products teaches you things no textbook can. Here are the hard-won lessons.',
    cover_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Priya Patel',
    author_avatar_url: null,
    category_slug: 'design',
    category_name: 'Design',
    tags: ['Design Systems', 'UX', 'Engineering', 'Scale'],
    published_at: '2026-06-25T09:00:00Z',
    reading_time_minutes: 7,
    views_count: 9840,
    likes_count: 614,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-003',
    title: 'Building Products That People Actually Love',
    slug: 'building-products-people-love',
    excerpt: 'The difference between a product that is used and one that is loved lies not in features, but in the invisible details that signal you truly understand your user.',
    cover_image_url: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Marcus Rivera',
    author_avatar_url: null,
    category_slug: 'product',
    category_name: 'Product',
    tags: ['Product', 'UX', 'Growth', 'Startups'],
    published_at: '2026-06-22T14:00:00Z',
    reading_time_minutes: 6,
    views_count: 7200,
    likes_count: 481,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-004',
    title: 'Open Source as a Growth Strategy',
    slug: 'open-source-growth-strategy',
    excerpt: 'From HashiCorp to Vercel, the most successful developer tools built their moats through open source. Here\'s the playbook behind that strategy.',
    cover_image_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
    author_name: 'David Kim',
    author_avatar_url: null,
    category_slug: 'technology',
    category_name: 'Technology',
    tags: ['Open Source', 'Startups', 'Developer Tools', 'Strategy'],
    published_at: '2026-06-19T11:00:00Z',
    reading_time_minutes: 9,
    views_count: 11500,
    likes_count: 728,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-005',
    title: 'Remote Culture: Building Teams Across Time Zones',
    slug: 'remote-culture-teams',
    excerpt: 'After five years of fully distributed work, we\'ve learned what actually makes remote teams succeed — and it has nothing to do with the tools you use.',
    cover_image_url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Aisha Johnson',
    author_avatar_url: null,
    category_slug: 'business',
    category_name: 'Business',
    tags: ['Remote Work', 'Culture', 'Teams', 'Leadership'],
    published_at: '2026-06-15T08:00:00Z',
    reading_time_minutes: 6,
    views_count: 6300,
    likes_count: 392,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-006',
    title: 'The Minimalist\'s Guide to Productive Work',
    slug: 'minimalist-guide-productive-work',
    excerpt: 'Productivity is not about doing more. It is about doing the right things with full attention. A framework for eliminating noise and protecting deep work.',
    cover_image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Emma Foster',
    author_avatar_url: null,
    category_slug: 'productivity',
    category_name: 'Productivity',
    tags: ['Productivity', 'Focus', 'Minimalism', 'Deep Work'],
    published_at: '2026-06-10T07:00:00Z',
    reading_time_minutes: 4,
    views_count: 5100,
    likes_count: 347,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-007',
    title: 'The Psychology of Color in Brand Design',
    slug: 'psychology-color-brand-design',
    excerpt: 'Color is the first thing your users feel before they understand anything else. Understanding color psychology is foundational — not optional — for brand design.',
    cover_image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    author_name: 'Lucas Chen',
    author_avatar_url: null,
    category_slug: 'design',
    category_name: 'Design',
    tags: ['Color Theory', 'Branding', 'Psychology', 'Design'],
    published_at: '2026-06-05T13:00:00Z',
    reading_time_minutes: 5,
    views_count: 4800,
    likes_count: 291,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
  {
    id: 'art-008',
    title: 'Climate Tech and the Race to Net Zero',
    slug: 'climate-tech-net-zero',
    excerpt: 'The startups betting on carbon capture, green hydrogen, and next-generation batteries are not just saving the planet — they are building this century\'s largest economic opportunity.',
    cover_image_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    author_name: 'James Walker',
    author_avatar_url: null,
    category_slug: 'technology',
    category_name: 'Technology',
    tags: ['Climate', 'Clean Tech', 'Sustainability', 'Future'],
    published_at: '2026-05-30T10:00:00Z',
    reading_time_minutes: 7,
    views_count: 8900,
    likes_count: 563,
    is_paid: false,
    price: null,
    article_type: 'article' as const,
    video_url: null,
  },
];

const MOCK_ARTICLE_CONTENT = `<p>The convergence of large language models, computer vision, and predictive analytics is doing something that would have seemed impossible a decade ago: making medicine personalized at scale.</p>

<p>In early 2026, an AI system at Massachusetts General Hospital flagged a rare cardiac arrhythmia in a 47-year-old patient's routine ECG — a pattern so subtle that three cardiologists had reviewed the same data two hours earlier without catching it. The patient was treated before any symptoms appeared. The AI had learned that pattern from 900,000 labeled ECGs.</p>

<h2>The Diagnostic Revolution</h2>

<p>Radiology was the first frontier. Deep learning models trained on millions of labeled scans can now detect early-stage lung cancer, diabetic retinopathy, and breast cancer with accuracy that matches or exceeds specialist radiologists. But the real breakthrough is speed: what once took a radiologist 20 minutes takes an AI system 2 seconds.</p>

<blockquote>"We are not replacing radiologists. We are giving every radiologist a superpower." — Dr. Elena Vasquez, Stanford Medicine</blockquote>

<p>The implications for healthcare access are profound. In regions where specialist radiologists are scarce, AI diagnostic tools can deliver expert-level analysis in hours rather than weeks — or not at all.</p>

<h2>Drug Discovery at Machine Speed</h2>

<p>The traditional drug discovery process is brutal: 12–15 years from target identification to market approval, a 90% failure rate, and billions in development costs. Machine learning is compressing that timeline dramatically.</p>

<p>AlphaFold's protein structure predictions opened a door that researchers are now sprinting through. By modeling how proteins fold and interact, AI systems can identify promising drug candidates in months instead of years. Insilico Medicine brought an AI-discovered drug through Phase I trials in 2024. Recursion Pharmaceuticals uses AI to repurpose existing FDA-approved molecules for new conditions.</p>

<h2>The Data Problem — and Its Solution</h2>

<p>Healthcare AI runs on data, and healthcare data is messy, siloed, and private. Electronic health record systems are notoriously incompatible. Patient data is protected by strict privacy regulations. For years, this was the primary barrier to progress.</p>

<p>Federated learning is changing that. Instead of centralizing patient data, federated learning trains models across distributed datasets — the model travels to the data, not the other way around. This allows hospitals to collaborate on AI development without sharing raw patient records.</p>

<h2>What the Next Decade Holds</h2>

<p>The trajectory is clear: AI will become a standard layer in clinical workflows, not a novelty. The question is no longer whether it will transform medicine, but how quickly institutions can adapt their practices, regulations, and training pipelines to integrate it safely and equitably.</p>

<p>The physicians who thrive will be those who treat AI as a collaborator — using its pattern-recognition at scale to free up their time for what machines cannot do: listen, empathize, and make nuanced judgments in complex human situations.</p>`;

export const MOCK_ARTICLE_FULL: PublicArticleFull = {
  ...MOCK_ARTICLES[0],
  content: MOCK_ARTICLE_CONTENT,
  article_type: null,
  video_url: null,
  audio_url: null,
  episode_number: null,
  season: null,
  seo_title: 'The Future of AI in Healthcare',
  seo_description: 'Machine learning models are transforming diagnostics, drug discovery, and patient care. Here\'s what the next decade holds.',
  seo_keywords: ['AI healthcare', 'machine learning medicine', 'diagnostic AI', 'drug discovery AI'],
};

export const MOCK_BLOG_EDITORIAL: BlogInfo = {
  id: 'mock-editorial',
  name: 'The Syntax',
  slug: 'the-syntax',
  description: 'Thoughtful writing on technology, design, and the craft of building great software.',
  category: 'Technology',
  logo_url: null,
  favicon_url: null,
  cover_image_url: null,
  language: 'en',
  theme: 'editorial',
  primary_color: '#18181b',
  font_family: 'Inter',
  social_links: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com', github: 'https://github.com' },
  template_config: null,
  enabled_languages: [],
  owner_affiliate_code: null,
};

export const MOCK_BLOG_MAGAZINE: BlogInfo = {
  id: 'mock-magazine',
  name: 'Pulse Weekly',
  slug: 'pulse-weekly',
  description: 'Your weekly digest of technology, innovation, and what\'s shaping the future.',
  category: 'Technology',
  logo_url: null,
  favicon_url: null,
  cover_image_url: null,
  language: 'en',
  theme: 'magazine',
  primary_color: '#e11d48',
  font_family: 'Inter',
  social_links: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' },
  template_config: null,
  enabled_languages: [],
  owner_affiliate_code: null,
};

export const MOCK_BLOG_MINIMAL: BlogInfo = {
  id: 'mock-minimal',
  name: 'Signal',
  slug: 'signal',
  description: 'Clear thinking on complex topics.',
  category: 'Technology',
  logo_url: null,
  favicon_url: null,
  cover_image_url: null,
  language: 'en',
  theme: 'minimal',
  primary_color: '#0f172a',
  font_family: 'Inter',
  social_links: { twitter: 'https://twitter.com' },
  template_config: null,
  enabled_languages: [],
  owner_affiliate_code: null,
};

export const MOCK_BLOG_CREATIVE: BlogInfo = {
  id: 'mock-creative',
  name: 'Refraction',
  slug: 'refraction',
  description: 'A visual journal exploring design, art, and digital creativity.',
  category: 'Design',
  logo_url: null,
  favicon_url: null,
  cover_image_url: null,
  language: 'en',
  theme: 'creative',
  primary_color: '#7c3aed',
  font_family: 'Inter',
  social_links: { instagram: 'https://instagram.com', twitter: 'https://twitter.com', dribbble: 'https://dribbble.com' },
  template_config: null,
  enabled_languages: [],
  owner_affiliate_code: null,
};
