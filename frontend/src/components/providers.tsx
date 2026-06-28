'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi, registerLogoutCallback } from '@/lib/api';
import type { TenantInfo } from '@/types';
import type { PlanTier, UserRole } from '@/types';

// Register clearAuth as the logout callback once at module load — prevents
// the 401-interceptor redirect loop when the token is expired on the login page.
if (typeof window !== 'undefined') {
  registerLogoutCallback(() => useAuthStore.getState().clearAuth());
}

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

interface ProvidersProps {
  children: ReactNode;
}

function AuthBootstrap() {
  const { isAuthenticated, isHydrated, syncTenants } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    // Never call the API from auth pages — avoids the 401-redirect infinite loop.
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
