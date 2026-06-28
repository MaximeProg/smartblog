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
  AnalyticsOverview,
  TeamMember,
  TeamInvitation,
  InviteTeamData,
  NewsletterSubscriber,
  PublicBlog,
  PublicArticle,
  TenantInfo,
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
