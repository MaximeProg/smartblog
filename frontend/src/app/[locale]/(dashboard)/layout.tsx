'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated, isHydrated, updateUser } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [isHydrated, isAuthenticated, locale, router]);

  // Le dashboard/superadmin est un layout "app" plein écran : le scroll doit
  // rester confiné aux conteneurs internes (overflow-y-auto). Sans ça, si un
  // enfant flex dépasse d'un pixel (ex. min-h-0 manquant quelque part), le
  // document lui-même devient aussi scrollable — deux barres de défilement
  // et un espace vide qui se recalcule différemment de l'intérieur.
  useEffect(() => {
    const { documentElement: html, body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Le plan de l'utilisateur (User.plan) n'est mis à jour côté serveur qu'au
  // moment du paiement, mais le store persisté ne le relit jamais tout seul
  // — sans ça, un upgrade reste invisible dans l'app jusqu'à la déconnexion.
  // On le rafraîchit une fois à chaque (re)chargement du dashboard, ce qui
  // couvre aussi le retour depuis la page de paiement externe.
  useEffect(() => {
    if (!isAuthenticated) return;
    authApi.me().then(({ data }) => updateUser(data)).catch(() => {});
  }, [isAuthenticated, updateUser]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
