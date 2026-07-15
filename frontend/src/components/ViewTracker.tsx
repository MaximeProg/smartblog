'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  blogSlug: string;
  articleSlug: string;
}

export function ViewTracker({ blogSlug, articleSlug }: ViewTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/public-proxy/${blogSlug}/articles/${articleSlug}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  }, [blogSlug, articleSlug]);

  return null;
}
