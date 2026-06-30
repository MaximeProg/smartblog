'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/blogs/new`);
  }, [locale, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}
