'use client';

import { useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface ViewTrackerProps {
  blogSlug: string;
  articleSlug: string;
}

export function ViewTracker({ blogSlug, articleSlug }: ViewTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`${API_BASE}/api/v1/public/${blogSlug}/articles/${articleSlug}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  }, [blogSlug, articleSlug]);

  return null;
}
