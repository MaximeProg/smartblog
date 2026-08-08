'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BlogInfo, PublicArticle, PublicCategory, TemplateConfig } from '@/lib/public-api';
import { publicApi } from '@/lib/public-api';
import { ThemeHome, ThemeAbout, ThemeContact } from '@/components/themes/ThemeRenderer';
import { EditModeController } from '@/components/themes/shared/EditModeController';
import { SelectionOverlay } from '@/components/themes/shared/SelectionOverlay';

// ──────────────────────────────────────────────────────────────────
// postMessage types (parent ↔ canvas protocol)
// ──────────────────────────────────────────────────────────────────

interface LiveBlog {
  name: string;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  font_family: string;
  social_links: Record<string, string>;
  seo_title_template?: string | null;
  seo_meta_description?: string | null;
}

interface LiveConfig {
  blog: LiveBlog;
  template_config: Record<string, unknown>;
}

interface StudioInitMsg {
  type: 'STUDIO_INIT';
  slug: string;
  theme: string;
  language: string;
  tenantId: string;
  liveConfig: LiveConfig;
  activePage: string;
}

interface PatchMsg {
  type: 'PATCH_LIVECONFIG';
  liveConfig: LiveConfig;
}

interface NavigateMsg {
  type: 'NAVIGATE';
  activePage: string;
}

type IncomingMsg = StudioInitMsg | PatchMsg | NavigateMsg;

// ──────────────────────────────────────────────────────────────────
// Canvas page
// ──────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const [initialized, setInitialized] = useState(false);
  const [slug, setSlug] = useState('');
  const [theme, setTheme] = useState('editorial');
  const [language, setLanguage] = useState('en');
  const [tenantId, setTenantId] = useState('');
  const [liveConfig, setLiveConfig] = useState<LiveConfig | null>(null);
  const [activePage, setActivePage] = useState('home');
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Tell parent we are ready as soon as the component mounts
  useEffect(() => {
    window.parent.postMessage({ type: 'CANVAS_READY' }, '*');
  }, []);

  // Listen for messages from the parent editor
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const msg = e.data as IncomingMsg;
      if (!msg?.type) return;

      if (msg.type === 'STUDIO_INIT') {
        setSlug(msg.slug);
        setTheme(msg.theme);
        setLanguage(msg.language);
        setTenantId(msg.tenantId);
        setLiveConfig(msg.liveConfig);
        setActivePage(msg.activePage);
        setSelectedSectionId(null);
        setSelectedElementId(null);
        setInitialized(true);
        // Fetch public data for this blog
        Promise.all([
          publicApi.getArticles(msg.slug, { limit: 20 }),
          publicApi.getCategories(msg.slug),
        ])
          .then(([arts, cats]) => {
            setArticles(arts);
            setCategories(cats);
          })
          .catch(() => { /* render with empty data */ });
      } else if (msg.type === 'PATCH_LIVECONFIG') {
        setLiveConfig(msg.liveConfig);
      } else if (msg.type === 'NAVIGATE') {
        setActivePage(msg.activePage);
        setSelectedSectionId(null);
        setSelectedElementId(null);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Resolved by EditModeController via delegated click/hover — the single
  // source of truth for both section-level (PropertiesPanel) and granular
  // element-level (future toolbar) selection.
  const handleElementSelect = useCallback(
    (elementId: string | null, kind: string | null, sectionId: string | null) => {
      setSelectedElementId(elementId);
      setSelectedSectionId(sectionId);
      window.parent.postMessage({ type: 'ELEMENT_CLICK', elementId, kind, sectionId }, '*');
    },
    [],
  );

  const handleElementHover = useCallback((id: string | null) => {
    setHoveredElementId(id);
  }, []);

  // Kept for components still wired to the old section-only contract —
  // routes through the same unified selection state.
  const handleSectionClick = useCallback(
    (id: string) => handleElementSelect(id, 'section', id),
    [handleElementSelect],
  );

  const handleSectionHover = useCallback(
    (id: string | null) => handleElementHover(id),
    [handleElementHover],
  );

  // Keep preventNav stable across renders — must be declared before any early return
  const preventNav = useCallback(() => '#', []);

  if (!initialized || !liveConfig) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
        <style>{`@keyframes cs{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'cs .7s linear infinite' }} />
      </div>
    );
  }

  // Build a BlogInfo from the live config + init data
  const blog: BlogInfo = {
    id: tenantId,
    name: liveConfig.blog.name,
    slug,
    description: liveConfig.blog.description,
    category: null,
    logo_url: liveConfig.blog.logo_url,
    favicon_url: liveConfig.blog.favicon_url,
    cover_image_url: liveConfig.blog.cover_image_url,
    language,
    theme,
    primary_color: liveConfig.blog.primary_color,
    font_family: liveConfig.blog.font_family,
    social_links: liveConfig.blog.social_links,
    template_config: liveConfig.template_config as TemplateConfig,
    enabled_languages: [],
    owner_affiliate_code: null,
  };

  const editProps = {
    editMode: true as const,
    selectedSectionId,
    onSectionClick: handleSectionClick,
    onSectionHover: handleSectionHover,
  };

  const basePath = '#';

  let content;
  if (activePage === 'about') {
    content = <ThemeAbout blog={blog} categories={categories} basePath={basePath} {...editProps} />;
  } else if (activePage === 'contact') {
    content = <ThemeContact blog={blog} categories={categories} basePath={basePath} {...editProps} />;
  } else {
    content = (
      <ThemeHome
        blog={blog}
        articles={articles}
        categories={categories}
        basePath={basePath}
        getArticleHref={preventNav}
        {...editProps}
      />
    );
  }

  return (
    <>
      {content}
      <EditModeController enabled onSelect={handleElementSelect} onHover={handleElementHover} />
      <SelectionOverlay hoveredId={hoveredElementId} selectedId={selectedElementId} />
    </>
  );
}
