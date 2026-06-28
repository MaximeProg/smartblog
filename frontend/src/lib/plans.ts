import type { PlanTier } from '@/types';

export interface PlanConfig {
  label: string;
  labelFr: string;
  maxBlogs: number;
  maxArticlesAiMonthly: number;
  storageGb: number;
  customDomain: boolean;
  hasAds: boolean;
  newsletter: boolean;
  newsletterLimit: number; // -1 = unlimited, 0 = none
  api: boolean;
  advancedSeo: boolean;
  socialAutomation: boolean;
  advancedAnalytics: boolean;
  whiteLabel: boolean;
  unlimitedCollaborators: boolean;
  prioritySupport: boolean;
  color: string;
  badgeClass: string;
}

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  free: {
    label: 'Free',
    labelFr: 'Gratuit',
    maxBlogs: 1,
    maxArticlesAiMonthly: 0,
    storageGb: 2,
    customDomain: false,
    hasAds: true,
    newsletter: false,
    newsletterLimit: 0,
    api: false,
    advancedSeo: false,
    socialAutomation: false,
    advancedAnalytics: false,
    whiteLabel: false,
    unlimitedCollaborators: false,
    prioritySupport: false,
    color: 'from-slate-500 to-slate-600',
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  starter: {
    label: 'Starter',
    labelFr: 'Starter',
    maxBlogs: 2,
    maxArticlesAiMonthly: 0,
    storageGb: 20,
    customDomain: true,
    hasAds: false,
    newsletter: true,
    newsletterLimit: 1000,
    api: false,
    advancedSeo: false,
    socialAutomation: false,
    advancedAnalytics: false,
    whiteLabel: false,
    unlimitedCollaborators: false,
    prioritySupport: false,
    color: 'from-blue-500 to-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  pro: {
    label: 'Pro',
    labelFr: 'Pro',
    maxBlogs: 5,
    maxArticlesAiMonthly: 50,
    storageGb: 50,
    customDomain: true,
    hasAds: false,
    newsletter: true,
    newsletterLimit: 10000,
    api: false,
    advancedSeo: true,
    socialAutomation: true,
    advancedAnalytics: true,
    whiteLabel: false,
    unlimitedCollaborators: false,
    prioritySupport: false,
    color: 'from-violet-500 to-violet-600',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  business: {
    label: 'Business',
    labelFr: 'Business',
    maxBlogs: -1,
    maxArticlesAiMonthly: -1,
    storageGb: 200,
    customDomain: true,
    hasAds: false,
    newsletter: true,
    newsletterLimit: -1,
    api: true,
    advancedSeo: true,
    socialAutomation: true,
    advancedAnalytics: true,
    whiteLabel: true,
    unlimitedCollaborators: true,
    prioritySupport: true,
    color: 'from-amber-500 to-orange-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
};

export function getPlanConfig(plan: PlanTier | undefined): PlanConfig {
  return PLAN_CONFIG[plan ?? 'free'] ?? PLAN_CONFIG.free;
}

export function canCreateBlog(plan: PlanTier | undefined, currentBlogCount: number): boolean {
  const config = getPlanConfig(plan);
  if (config.maxBlogs === -1) return true;
  return currentBlogCount < config.maxBlogs;
}

export function formatStorage(gb: number): string {
  return `${gb} Go`;
}
