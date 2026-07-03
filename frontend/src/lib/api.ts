import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import type {
  LoginResponse,
  UserInfo,
  TenantResponse,
  CreateTenantData,
  UpdateTenantData,
  SlugCheckResponse,
  ArticleListItem,
  ArticleDetail,
  ArticleListParams,
  CreateArticleData,
  UpdateArticleData,
  PaginatedResponse,
  CategoryInfo,
  CreateCategoryData,
  UpdateCategoryData,
  AnalyticsOverview,
  TeamMember,
  TeamInvitation,
  InviteTeamData,
  NewsletterSubscriber,
  PublicBlog,
  PublicArticle,
  TenantInfo,
  PageListItem,
  PageResponse,
  PageStatus,
  CreatePageData,
  UpdatePageData,
  TagInfo,
  MediaItem,
  MenuItemData,
  MenuResponse,
  LikeResponse,
  ShareResponse,
  SharePlatform,
  PublicCommentItem,
  CommentListItem,
  CommentStats,
  CommentStatus,
} from '@/types';

const API_URL =
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:8080';

// In-memory token — survives tab navigation, cleared on sign-out
let _accessToken: string | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

// Registered by auth store — called before hard redirect on 401 so localStorage is cleared
let _onLogout: (() => void) | null = null;
export function registerLogoutCallback(fn: () => void) {
  _onLogout = fn;
}

function processQueue(token: string | null) {
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) =>
          _refreshQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          })
        );
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.access_token);
        processQueue(data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        setAccessToken(null);
        processQueue(null);
        _onLogout?.(); // Clear auth store before redirect so isAuthenticated → false
        if (typeof window !== 'undefined') {
          const locale = document.documentElement.lang || 'en';
          window.location.href = `/${locale}/login`;
        }
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (firebase_id_token: string) =>
    api.post<LoginResponse>('/auth/login', { firebase_id_token }),

  logout: () => api.post<void>('/auth/logout'),

  me: () => api.get<UserInfo>('/auth/me'),

  refresh: () =>
    axios.post<{ access_token: string; expires_in: number }>(
      `${API_URL}/api/v1/auth/refresh`,
      {},
      { withCredentials: true }
    ),

  updateProfile: (data: { display_name?: string; bio?: string }) =>
    api.patch<UserInfo>('/auth/me', data),
};

// ─── Tenants ──────────────────────────────────────────────────────────────────

export const tenantsApi = {
  list: () => api.get<TenantInfo[]>('/tenants/me'),

  checkSlug: (slug: string) =>
    api.get<SlugCheckResponse>('/tenants/check-slug', { params: { slug } }),

  get: (id: string) => api.get<TenantResponse>(`/tenants/${id}`),

  create: (data: CreateTenantData) => api.post<TenantResponse>('/tenants', data),

  update: (id: string, data: UpdateTenantData) =>
    api.patch<TenantResponse>(`/tenants/${id}`, data),

  delete: (id: string) => api.delete<void>(`/tenants/${id}`),
};

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articlesApi = {
  list: (tenantId: string, params?: ArticleListParams) =>
    api.get<PaginatedResponse<ArticleListItem>>(`/tenants/${tenantId}/articles`, {
      params,
    }),

  get: (tenantId: string, articleId: string) =>
    api.get<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}`),

  create: (tenantId: string, data: CreateArticleData) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles`, data),

  update: (tenantId: string, articleId: string, data: UpdateArticleData) =>
    api.patch<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}`, data),

  publish: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/publish`),

  archive: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/archive`),

  delete: (tenantId: string, articleId: string) =>
    api.delete<void>(`/tenants/${tenantId}/articles/${articleId}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: (tenantId: string) =>
    api.get<CategoryInfo[]>(`/tenants/${tenantId}/categories`),

  create: (tenantId: string, data: CreateCategoryData) =>
    api.post<CategoryInfo>(`/tenants/${tenantId}/categories`, data),

  update: (tenantId: string, categoryId: string, data: UpdateCategoryData) =>
    api.patch<CategoryInfo>(`/tenants/${tenantId}/categories/${categoryId}`, data),

  delete: (tenantId: string, categoryId: string) =>
    api.delete<void>(`/tenants/${tenantId}/categories/${categoryId}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: (tenantId: string, days = 30) =>
    api.get<AnalyticsOverview>(`/tenants/${tenantId}/analytics/overview`, {
      params: { days },
    }),
};

// ─── Team ─────────────────────────────────────────────────────────────────────

export const teamApi = {
  list: (tenantId: string) =>
    api.get<{ members: TeamMember[]; invitations: TeamInvitation[] }>(
      `/tenants/${tenantId}/team`
    ),

  invite: (tenantId: string, data: InviteTeamData) =>
    api.post<TeamInvitation>(`/tenants/${tenantId}/team/invite`, data),

  remove: (tenantId: string, userId: string) =>
    api.delete<void>(`/tenants/${tenantId}/team/${userId}`),

  updateRole: (tenantId: string, userId: string, role: string) =>
    api.patch<TeamMember>(`/tenants/${tenantId}/team/${userId}`, { role }),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────

export const newsletterApi = {
  subscribers: (
    tenantId: string,
    params?: { page?: number; limit?: number }
  ) =>
    api.get<PaginatedResponse<NewsletterSubscriber>>(
      `/tenants/${tenantId}/newsletter/subscribers`,
      { params }
    ),
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tagsApi = {
  list: (tenantId: string) =>
    api.get<TagInfo[]>(`/tenants/${tenantId}/tags`),

  create: (tenantId: string, name: string) =>
    api.post<TagInfo>(`/tenants/${tenantId}/tags`, { name }),

  delete: (tenantId: string, tagId: string) =>
    api.delete<void>(`/tenants/${tenantId}/tags/${tagId}`),
};

// ─── Media ────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (tenantId: string, params?: { type?: string; limit?: number; cursor?: string }) =>
    api.get<PaginatedResponse<MediaItem>>(`/tenants/${tenantId}/media`, { params }),

  upload: (tenantId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<MediaItem>(`/tenants/${tenantId}/media/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (tenantId: string, mediaId: string, data: { alt_text?: string; caption?: string }) =>
    api.patch<MediaItem>(`/tenants/${tenantId}/media/${mediaId}`, data),

  delete: (tenantId: string, mediaId: string) =>
    api.delete<void>(`/tenants/${tenantId}/media/${mediaId}`),
};

// ─── Menus ────────────────────────────────────────────────────────────────────

export const menusApi = {
  list: (tenantId: string) =>
    api.get<MenuResponse[]>(`/tenants/${tenantId}/menus`),

  upsert: (tenantId: string, location: string, items: MenuItemData[]) =>
    api.put<MenuResponse>(`/tenants/${tenantId}/menus/${location}`, { items }),
};

// ─── Pages ────────────────────────────────────────────────────────────────────

export const pagesApi = {
  list: (tenantId: string, status?: PageStatus) =>
    api.get<PageListItem[]>(`/tenants/${tenantId}/pages`, {
      params: status ? { status } : undefined,
    }),

  get: (tenantId: string, pageId: string) =>
    api.get<PageResponse>(`/tenants/${tenantId}/pages/${pageId}`),

  create: (tenantId: string, data: CreatePageData) =>
    api.post<PageResponse>(`/tenants/${tenantId}/pages`, data),

  update: (tenantId: string, pageId: string, data: UpdatePageData) =>
    api.patch<PageResponse>(`/tenants/${tenantId}/pages/${pageId}`, data),

  setStatus: (tenantId: string, pageId: string, status: PageStatus) =>
    api.post<PageResponse>(`/tenants/${tenantId}/pages/${pageId}/status`, { status }),

  setHomepage: (tenantId: string, pageId: string) =>
    api.post<PageResponse>(`/tenants/${tenantId}/pages/${pageId}/homepage`),

  delete: (tenantId: string, pageId: string) =>
    api.delete<void>(`/tenants/${tenantId}/pages/${pageId}`),
};

// ─── Modération (commentaires au niveau tenant) ────────────────────────────────

export const moderationApi = {
  listComments: (
    tenantId: string,
    params?: { status?: CommentStatus; article_id?: string; search?: string; limit?: number; offset?: number }
  ) =>
    api.get<CommentListItem[]>(`/tenants/${tenantId}/moderation/comments`, { params }),

  stats: (tenantId: string) =>
    api.get<CommentStats>(`/tenants/${tenantId}/moderation/comments/stats`),

  moderate: (tenantId: string, commentId: string, status: CommentStatus) =>
    api.patch<CommentListItem>(`/tenants/${tenantId}/moderation/comments/${commentId}`, { status }),

  delete: (tenantId: string, commentId: string) =>
    api.delete<void>(`/tenants/${tenantId}/moderation/comments/${commentId}`),

  ban: (tenantId: string, data: { email?: string; ip_address?: string; reason?: string }) =>
    api.post(`/tenants/${tenantId}/moderation/bans`, data),
};

// ─── Engagement public (likes, partages, commentaires anonymes) ────────────────

export const engagementApi = {
  getLikeStatus: (articleId: string) =>
    api.get<LikeResponse>(`/public/articles/${articleId}/like`),

  toggleLike: (articleId: string) =>
    api.post<LikeResponse>(`/public/articles/${articleId}/like`),

  share: (articleId: string, platform: SharePlatform) =>
    api.post<ShareResponse>(`/public/articles/${articleId}/share`, { platform }),

  listComments: (articleId: string, params?: { limit?: number; offset?: number }) =>
    api.get<PublicCommentItem[]>(`/public/articles/${articleId}/comments`, { params }),

  postComment: (
    articleId: string,
    data: { content: string; parent_id?: string; author_name: string; author_email: string; author_website?: string }
  ) =>
    api.post<PublicCommentItem>(`/public/articles/${articleId}/comments`, data),
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const publicApi = {
  getBlog: (slug: string) => api.get<PublicBlog>(`/public/${slug}`),

  getArticles: (
    slug: string,
    params?: { page?: number; limit?: number; category?: string }
  ) =>
    api.get<PaginatedResponse<PublicArticle>>(`/public/${slug}/articles`, {
      params,
    }),

  getArticle: (slug: string, articleSlug: string) =>
    api.get<PublicArticle>(`/public/${slug}/articles/${articleSlug}`),

  subscribe: (slug: string, email: string, firstName?: string) =>
    api.post(`/public/${slug}/subscribe`, { email, first_name: firstName }),
};
