'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi, registerLogoutCallback, setAccessToken, authApi } from '@/lib/api';
import type { TenantInfo } from '@/types';
import type { PlanTier, UserRole } from '@/types';

// Register clearAuth as the logout callback once at module load — prevents
// the 401-interceptor redirect loop when the token is expired on the login page.
if (typeof window !== 'undefined') {
  registerLogoutCallback(() => useAuthStore.getState().clearAuth());
}

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];
// Refresh access token 2 min before the 15-min expiry = every 13 min
const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

interface ProvidersProps {
  children: ReactNode;
}

function AuthBootstrap() {
  const { isAuthenticated, isHydrated, syncTenants, setAuth, user, tenants, accessToken } = useAuthStore();
  const pathname = usePathname();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Proactive token refresh — fires before the 15-min access token expires
  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    if (AUTH_PAGES.some((p) => pathname.includes(p))) return;

    async function proactiveRefresh() {
      try {
        const { data } = await authApi.refresh();
        // Update in-memory token AND persist it to localStorage via the store
        setAccessToken(data.access_token);
        useAuthStore.setState({ accessToken: data.access_token });
        // Renew the session sentinel for another 7 days
        document.cookie = 'nexusblog_session=1; path=/; samesite=lax; max-age=604800';
      } catch {
        // If refresh fails the 401 interceptor will handle the next real request
      }
    }

    // Run once immediately on mount to ensure the token is fresh after a tab reopen
    proactiveRefresh();

    refreshTimerRef.current = setInterval(proactiveRefresh, REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isHydrated, isAuthenticated, pathname]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    if (AUTH_PAGES.some((p) => pathname.includes(p))) return;

    tenantsApi.list()
      .then(({ data }) => {
        const tenants: TenantInfo[] = (data as Array<{ id: string; name: string; slug: string; plan: PlanTier; role: UserRole }>).map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          plan: t.plan,
          role: t.role,
        }));
        syncTenants(tenants);
      })
      .catch(() => {
        // Silently ignored — 401 is handled by the interceptor which calls clearAuth()
      });
  }, [isHydrated, isAuthenticated, pathname, syncTenants]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const code: string = event?.reason?.code ?? '';
      if (
        code === 'auth/network-request-failed' ||
        code === 'auth/internal-error' ||
        code === 'auth/timeout'
      ) {
        event.preventDefault();
        console.warn('[Firebase] background auth error suppressed:', code);
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
