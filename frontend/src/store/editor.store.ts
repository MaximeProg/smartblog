import { create } from 'zustand';
import type { TemplateSchema } from '@/templates/types';
import { getSchema } from '@/templates/registry';
import { deepSet } from '@/templates/utils';
import { tenantsApi } from '@/lib/api';
import type { TenantResponse } from '@/types';

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

interface EditorState {
  tenantId: string | null;
  tenantSlug: string | null;
  schema: TemplateSchema | null;

  activePage: string;
  selectedSectionId: string | null;
  selectedElementId: string | null;

  liveConfig: LiveConfig;

  dirty: boolean;
  saving: boolean;
  refreshCounter: number;

  init: (tenantId: string, tenant: TenantResponse) => void;
  setActivePage: (pageId: string) => void;
  selectSection: (sectionId: string | null) => void;
  selectElement: (elementId: string | null, sectionId: string | null) => void;
  updateField: (path: string, value: unknown) => void;
  save: () => Promise<void>;
}

const DEFAULT_CONFIG: LiveConfig = {
  blog: {
    name: '',
    description: null,
    logo_url: null,
    favicon_url: null,
    cover_image_url: null,
    primary_color: '#3b82f6',
    font_family: 'Inter',
    social_links: {},
  },
  template_config: {},
};

export const useEditorStore = create<EditorState>((set, get) => ({
  tenantId: null,
  tenantSlug: null,
  schema: null,
  activePage: 'home',
  selectedSectionId: null,
  selectedElementId: null,
  liveConfig: DEFAULT_CONFIG,
  dirty: false,
  saving: false,
  refreshCounter: 0,

  init: (tenantId, tenant) => {
    const schema = getSchema(tenant.theme);
    const liveConfig: LiveConfig = {
      blog: {
        name: tenant.name,
        description: tenant.description,
        logo_url: tenant.logo_url,
        favicon_url: tenant.favicon_url,
        cover_image_url: tenant.cover_image_url,
        primary_color: tenant.primary_color,
        font_family: tenant.font_family ?? 'Inter',
        social_links: tenant.social_links ?? {},
        seo_title_template: tenant.seo_title_template,
        seo_meta_description: tenant.seo_meta_description,
      },
      template_config: (tenant.template_config ?? {}) as Record<string, unknown>,
    };
    set({
      tenantId,
      tenantSlug: tenant.slug,
      schema,
      liveConfig,
      dirty: false,
      activePage: 'home',
      selectedSectionId: null,
      selectedElementId: null,
    });
  },

  setActivePage: (pageId) => set({ activePage: pageId, selectedSectionId: null, selectedElementId: null }),

  selectSection: (sectionId) => set({ selectedSectionId: sectionId, selectedElementId: null }),

  selectElement: (elementId, sectionId) => set({ selectedElementId: elementId, selectedSectionId: sectionId }),

  updateField: (path, value) => {
    set((s) => ({
      liveConfig: deepSet(s.liveConfig, path, value) as LiveConfig,
      dirty: true,
    }));
  },

  save: async () => {
    const { tenantId, liveConfig } = get();
    if (!tenantId) return;
    set({ saving: true });
    try {
      const { blog, template_config } = liveConfig;
      await tenantsApi.update(tenantId, {
        name: blog.name,
        description: blog.description ?? undefined,
        logo_url: blog.logo_url ?? undefined,
        favicon_url: blog.favicon_url ?? undefined,
        cover_image_url: blog.cover_image_url,
        primary_color: blog.primary_color,
        font_family: blog.font_family,
        social_links: blog.social_links,
        seo_title_template: blog.seo_title_template ?? undefined,
        seo_meta_description: blog.seo_meta_description ?? undefined,
        template_config: template_config as Record<string, unknown>,
      });
      set((s) => ({
        dirty: false,
        saving: false,
        refreshCounter: s.refreshCounter + 1,
      }));
    } catch {
      set({ saving: false });
      throw new Error('Échec de la sauvegarde');
    }
  },
}));
