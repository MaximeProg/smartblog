'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '@/lib/api';
import type { UserInfo, TenantInfo } from '@/types';

interface AuthState {
  user: UserInfo | null;
  tenants: TenantInfo[];
  currentTenantId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: UserInfo, tenants: TenantInfo[], token: string) => void;
  addTenant: (tenant: TenantInfo) => void;
  syncTenants: (tenants: TenantInfo[]) => void;
  setCurrentTenant: (tenantId: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenants: [],
      currentTenantId: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, tenants, token) => {
        setAccessToken(token);
        // Cookie de session lisible par le middleware Next.js (même origine que le frontend)
        if (typeof document !== 'undefined') {
          document.cookie = 'nexusblog_session=1; path=/; samesite=lax; max-age=86400';
        }
        set({
          user,
          tenants,
          accessToken: token,
          isAuthenticated: true,
          currentTenantId: get().currentTenantId ?? tenants[0]?.id ?? null,
        });
      },

      addTenant: (tenant) =>
        set((state) => ({
          tenants: [...state.tenants, tenant],
          currentTenantId: state.currentTenantId ?? tenant.id,
        })),

      syncTenants: (tenants) =>
        set((state) => ({
          tenants,
          currentTenantId: state.currentTenantId ?? tenants[0]?.id ?? null,
        })),

      setCurrentTenant: (tenantId) => set({ currentTenantId: tenantId }),

      clearAuth: () => {
        setAccessToken(null);
        if (typeof document !== 'undefined') {
          document.cookie = 'nexusblog_session=; path=/; max-age=0';
        }
        set({
          user: null,
          tenants: [],
          currentTenantId: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'nexusblog-auth',
      partialize: (state) => ({
        user: state.user,
        tenants: state.tenants,
        currentTenantId: state.currentTenantId,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
      },
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export function useCurrentTenant() {
  return useAuthStore((s) => {
    if (!s.currentTenantId) return s.tenants[0] ?? null;
    return s.tenants.find((t) => t.id === s.currentTenantId) ?? s.tenants[0] ?? null;
  });
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
