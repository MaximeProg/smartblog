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
  NewsletterCampaign,
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
  CommentBanInfo,
  NotificationItem,
  ArticleVersionResponse,
  SocialAccountInfo,
  SocialPostInfo,
  SocialPlatform,
  SocialPostStatus,
  SubscriberStatus,
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

  notifications: () => api.get<NotificationItem[]>('/auth/me/notifications'),

  notificationsCount: () =>
    api.get<{ unread: number; total: number }>('/auth/me/notifications/count'),

  savePushSubscription: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/auth/me/push-subscription', sub),

  deletePushSubscription: (endpoint: string) =>
    api.delete('/auth/me/push-subscription', { data: { endpoint } }),

  getVapidPublicKey: () =>
    api.get<{ public_key: string }>('/auth/me/push-vapid-public-key'),

  testEmail: () =>
    api.post<{ ok: boolean; sent_to: string }>('/auth/me/test-email'),

  testPush: () =>
    api.post<{ ok: boolean; subscriptions: number }>('/auth/me/test-push'),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<UserInfo>('/auth/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Two-Factor Authentication ─────────────────────────────────────────────────

export interface TwoFASetupResponse {
  otpauth_uri: string;
  qr_code_svg: string;
  backup_codes: string[];
}

export const twoFactorApi = {
  /** Génère le secret TOTP + QR code SVG (utilisateur connecté) */
  setup: () => api.post<TwoFASetupResponse>('/auth/2fa/setup'),

  /** Active le 2FA après vérification du premier code (utilisateur connecté) */
  enable: (code: string) =>
    api.post<{ message: string }>('/auth/2fa/verify', { code }),

  /** Désactive le 2FA (utilisateur connecté, code requis) */
  disable: (code: string) =>
    api.delete<{ message: string }>('/auth/2fa', { data: { code } }),

  /** Finalise la connexion quand requires_2fa = true */
  login: (firebase_id_token: string, code: string) =>
    api.post<LoginResponse>('/auth/2fa/login', { firebase_id_token, code }),
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

  unpublish: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/unpublish`),

  archive: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/archive`),

  submitReview: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/submit-review`),

  approve: (tenantId: string, articleId: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/approve`),

  reject: (tenantId: string, articleId: string, reason?: string) =>
    api.post<ArticleDetail>(`/tenants/${tenantId}/articles/${articleId}/reject`, { reason }),

  getVersions: (tenantId: string, articleId: string) =>
    api.get<ArticleVersionResponse[]>(`/tenants/${tenantId}/articles/${articleId}/versions`),

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
  listMembers: (tenantId: string) =>
    api.get<TeamMember[]>(`/tenants/${tenantId}/team`),

  listInvitations: (tenantId: string) =>
    api.get<TeamInvitation[]>(`/tenants/${tenantId}/team/invitations`),

  invite: (tenantId: string, data: InviteTeamData) =>
    api.post<TeamInvitation>(`/tenants/${tenantId}/team/invite`, data),

  cancelInvitation: (tenantId: string, invitationId: string) =>
    api.delete<void>(`/tenants/${tenantId}/team/invitations/${invitationId}`),

  remove: (tenantId: string, userId: string) =>
    api.delete<void>(`/tenants/${tenantId}/team/${userId}`),

  updateRole: (tenantId: string, userId: string, role: string) =>
    api.patch<TeamMember>(`/tenants/${tenantId}/team/${userId}`, { role }),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────

export const newsletterApi = {
  listSubscribers: (tenantId: string, params?: { status?: SubscriberStatus; q?: string; limit?: number; cursor?: string }) =>
    api.get<NewsletterSubscriber[]>(`/tenants/${tenantId}/newsletter/subscribers`, { params }),

  exportSubscribers: (tenantId: string, status?: SubscriberStatus) =>
    api.get(`/tenants/${tenantId}/newsletter/subscribers/export`, {
      params: status ? { status } : undefined,
      responseType: 'blob',
    }),

  listCampaigns: (tenantId: string) =>
    api.get<NewsletterCampaign[]>(`/tenants/${tenantId}/newsletter/campaigns`),

  createCampaign: (tenantId: string, data: {
    name: string;
    subject: string;
    preview_text?: string;
    content_html?: string;
    scheduled_at?: string;
  }) =>
    api.post<NewsletterCampaign>(`/tenants/${tenantId}/newsletter/campaigns`, data),

  sendCampaign: (tenantId: string, campaignId: string) =>
    api.post<NewsletterCampaign>(`/tenants/${tenantId}/newsletter/campaigns/${campaignId}/send`),

  testCampaign: (tenantId: string, campaignId: string, toEmail: string) =>
    api.post<void>(`/tenants/${tenantId}/newsletter/campaigns/${campaignId}/test`, { to_email: toEmail }),

  importSubscribers: (tenantId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imported: number; skipped: number; errors: number }>(
      `/tenants/${tenantId}/newsletter/subscribers/import`,
      form,
    );
  },
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tagsApi = {
  list: (tenantId: string, q?: string) =>
    api.get<TagInfo[]>(`/tenants/${tenantId}/tags`, { params: q ? { q } : undefined }),

  create: (tenantId: string, name: string) =>
    api.post<TagInfo>(`/tenants/${tenantId}/tags`, { name }),

  update: (tenantId: string, tagId: string, name: string) =>
    api.patch<TagInfo>(`/tenants/${tenantId}/tags/${tagId}`, { name }),

  merge: (tenantId: string, sourceIds: string[], targetId: string) =>
    api.post<TagInfo>(`/tenants/${tenantId}/tags/merge`, { source_ids: sourceIds, target_id: targetId }),

  delete: (tenantId: string, tagId: string) =>
    api.delete<void>(`/tenants/${tenantId}/tags/${tagId}`),
};

// ─── Media ────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (tenantId: string, params?: { type?: string; q?: string; limit?: number; cursor?: string }) => {
    const { type, ...rest } = params ?? {};
    return api.get<MediaItem[]>(`/tenants/${tenantId}/media`, {
      params: { ...rest, ...(type ? { media_type: type } : {}) },
    });
  },

  upload: (tenantId: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<MediaItem>(`/tenants/${tenantId}/media/upload`, form, {
      // undefined clears the instance-level 'application/json' default so the browser
      // can generate the correct multipart/form-data header with its own boundary
      headers: { 'Content-Type': undefined },
      timeout: 300_000, // 5 min for large video/audio uploads
      onUploadProgress: onProgress
        ? (e) => { if (e.total) onProgress(Math.round((e.loaded / e.total) * 100)); }
        : undefined,
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

  listBans: (tenantId: string) =>
    api.get<CommentBanInfo[]>(`/tenants/${tenantId}/moderation/bans`),

  deleteBan: (tenantId: string, banId: string) =>
    api.delete<void>(`/tenants/${tenantId}/moderation/bans/${banId}`),
};

// ─── Social ───────────────────────────────────────────────────────────────────

export const socialApi = {
  listAccounts: (tenantId: string) =>
    api.get<SocialAccountInfo[]>(`/tenants/${tenantId}/social/accounts`),

  disconnectAccount: (tenantId: string, accountId: string) =>
    api.delete<void>(`/tenants/${tenantId}/social/accounts/${accountId}`),

  listPosts: (tenantId: string, params?: { status?: SocialPostStatus; platform?: SocialPlatform; limit?: number }) =>
    api.get<SocialPostInfo[]>(`/tenants/${tenantId}/social/posts`, { params }),

  createPost: (tenantId: string, data: {
    social_account_id: string;
    content: string;
    article_id?: string;
    media_urls?: string[];
    scheduled_at?: string;
  }) =>
    api.post<SocialPostInfo>(`/tenants/${tenantId}/social/posts`, data),

  deletePost: (tenantId: string, postId: string) =>
    api.delete<void>(`/tenants/${tenantId}/social/posts/${postId}`),

  publishNow: (tenantId: string, postId: string) =>
    api.post<SocialPostInfo>(`/tenants/${tenantId}/social/posts/${postId}/publish`),

  getOAuthConnectUrl: (tenantId: string, platform: string) =>
    api.get<{ url: string }>(`/tenants/${tenantId}/social/oauth/${platform}/connect`),

  toggleAutoPost: (tenantId: string, accountId: string, enabled: boolean) =>
    api.patch<SocialAccountInfo>(`/tenants/${tenantId}/social/accounts/${accountId}/auto-post`, {
      auto_post_enabled: enabled,
    }),
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

// ─── Ads ─────────────────────────────────────────────────────────────────────

export interface AdResponse {
  id: string;
  advertiser_name: string;
  advertiser_email?: string | null;
  advertiser_company: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string;
  placement: string | null;
  submission_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  campaign_status: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'SUSPENDED';
  link_safety_status: 'SAFE' | 'DANGEROUS' | 'UNKNOWN' | 'SCANNING';
  rejection_reason?: string | null;
  starts_at: string | null;
  ends_at: string | null;
  total_budget?: number | null;
  impressions_count: number;
  clicks_count: number;
  created_at: string;
}

export interface SubmitAdData {
  advertiser_name: string;
  advertiser_email: string;
  advertiser_company?: string;
  title: string;
  description?: string;
  image_url?: string;
  click_url: string;
  starts_at?: string;
  ends_at?: string;
  total_budget?: number;
}

export const adsApi = {
  list: (tenantId: string, params?: { status?: string; limit?: number }) =>
    api.get<AdResponse[]>(`/tenants/${tenantId}/ads`, { params }),

  submit: (tenantId: string, data: SubmitAdData) =>
    api.post<AdResponse>(`/tenants/${tenantId}/ads/submit`, data),

  review: (tenantId: string, adId: string, decision: 'APPROVED' | 'REJECTED', rejection_reason?: string) =>
    api.post<AdResponse>(`/tenants/${tenantId}/ads/${adId}/review`, { decision, rejection_reason }),

  pause: (tenantId: string, adId: string) =>
    api.post<AdResponse>(`/tenants/${tenantId}/ads/${adId}/pause`),

  resume: (tenantId: string, adId: string) =>
    api.post<AdResponse>(`/tenants/${tenantId}/ads/${adId}/resume`),
};

// ── M23 — Affiliate API ───────────────────────────────────────────────────────

export interface AffiliateDashboard {
  affiliate_code: string;
  referral_url: string;
  balance: number;
  cashout_threshold: number;
  can_cashout: boolean;
  total_earned: number;
  total_paid_out: number;
  total_referrals: number;
  pending_commissions: number;
}

export interface AffiliateCommission {
  id: string;
  source_type: string;
  source_transaction_id: string;
  level: number;
  gross_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface CashoutRequest {
  id: string;
  gross_amount: number;
  fee: number;
  net_amount: number;
  status: string;
  payout_method: string | null;
  requested_at: string;
  processed_at: string | null;
}

export const affiliateApi = {
  getDashboard: (tenantId: string) =>
    api.get<AffiliateDashboard>(`/tenants/${tenantId}/affiliate`),

  listCommissions: (tenantId: string, params?: { status?: string; limit?: number; offset?: number }) =>
    api.get<AffiliateCommission[]>(`/tenants/${tenantId}/affiliate/commissions`, { params }),

  listCashouts: (tenantId: string) =>
    api.get<CashoutRequest[]>(`/tenants/${tenantId}/affiliate/cashouts`),

  requestCashout: (tenantId: string, payout_method: string = 'stripe') =>
    api.post<CashoutRequest>(`/tenants/${tenantId}/affiliate/cashout`, { payout_method }),
};

// ── M24 — Accounting API ──────────────────────────────────────────────────────

export interface ChartAccount {
  code: string;
  name: string;
  account_class: number;
  account_type: string;
  parent_code: string | null;
  is_active: boolean;
  is_system: boolean;
  description: string | null;
}

export interface JournalLine {
  id: string;
  line_number: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entry_number: number;
  journal_type: string;
  reference: string | null;
  description: string;
  entry_date: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
  lines: JournalLine[];
  total_debit: number;
  total_credit: number;
}

export const accountingApi = {
  listAccounts: (params?: { account_class?: number; active_only?: boolean }) =>
    api.get<ChartAccount[]>('/accounting/chart-of-accounts', { params }),

  createAccount: (data: { code: string; name: string; account_class: number; account_type: string; parent_code?: string; description?: string }) =>
    api.post<ChartAccount>('/accounting/chart-of-accounts', data),

  toggleAccount: (code: string) =>
    api.patch<{ code: string; is_active: boolean }>(`/accounting/chart-of-accounts/${code}/toggle`),

  listEntries: (params?: { status?: string; journal_type?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }) =>
    api.get<JournalEntry[]>('/accounting/entries', { params }),

  getEntry: (entryId: string) =>
    api.get<JournalEntry>(`/accounting/entries/${entryId}`),

  createEntry: (data: { journal_type: string; description: string; entry_date: string; reference?: string; lines: Array<{ account_code: string; debit: number; credit: number; description?: string }> }) =>
    api.post<JournalEntry>('/accounting/entries', data),

  approveEntry: (entryId: string) =>
    api.post<{ status: string; entry_number: number }>(`/accounting/entries/${entryId}/approve`),

  reverseEntry: (entryId: string, reason: string) =>
    api.post<JournalEntry>(`/accounting/entries/${entryId}/reverse`, null, { params: { reason } }),
};

// ── Domains API ───────────────────────────────────────────────────────────────

export interface CustomDomainInfo {
  id: string;
  domain: string;
  verification_status: 'pending' | 'verified' | 'failed';
  ssl_enabled: boolean;
  created_at: string;
  verified_at: string | null;
  verification_token: string;
}

export const domainsApi = {
  list: (tenantId: string) =>
    api.get<CustomDomainInfo[]>(`/tenants/${tenantId}/domains`),

  add: (tenantId: string, domain: string) =>
    api.post<CustomDomainInfo>(`/tenants/${tenantId}/domains`, { domain }),

  verify: (tenantId: string, domainId: string) =>
    api.post<CustomDomainInfo>(`/tenants/${tenantId}/domains/${domainId}/verify`),

  remove: (tenantId: string, domainId: string) =>
    api.delete<void>(`/tenants/${tenantId}/domains/${domainId}`),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {
  tts: (tenantId: string, data: { text: string; article_id?: string; voice_id?: string }) =>
    api.post<{ audio_url: string }>(`/tenants/${tenantId}/ai/tts`, data),
};
