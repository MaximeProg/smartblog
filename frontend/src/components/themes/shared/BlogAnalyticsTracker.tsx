'use client';

import { useEffect, useRef } from 'react';


function getOrCreateSessionId(): string {
  try {
    const stored = sessionStorage.getItem('_blog_sid');
    if (stored) return stored;
    const sid = crypto.randomUUID();
    sessionStorage.setItem('_blog_sid', sid);
    return sid;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

interface Props {
  tenantId: string;
  articleId?: string;
}

export function BlogAnalyticsTracker({ tenantId, articleId }: Props) {
  const startRef = useRef<number>(Date.now());
  const sentRef = useRef(false);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const deviceType = getDeviceType();
    const referrer = document.referrer || undefined;
    startRef.current = Date.now();
    sentRef.current = false;

    async function sendView(durationSeconds?: number, scrollDepth?: number) {
      if (sentRef.current) return;
      sentRef.current = true;
      try {
        await fetch(`/api/analytics-proxy/${tenantId}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: articleId ?? null,
            session_id: sessionId,
            referrer: referrer ?? null,
            duration_seconds: durationSeconds != null ? Math.round(durationSeconds) : null,
            scroll_depth_pct: scrollDepth != null ? Math.round(scrollDepth) : null,
            device_type: deviceType,
          }),
          keepalive: true,
        });
      } catch {
        // silently ignore tracking errors
      }
    }

    function getScrollDepth(): number {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      return total > 0 ? (scrolled / total) * 100 : 0;
    }

    function handleLeave() {
      const duration = (Date.now() - startRef.current) / 1000;
      sendView(duration, getScrollDepth());
    }

    // Send initial view after 1s (avoids counting bounces that navigate away instantly)
    const timer = setTimeout(() => {
      if (!sentRef.current) sendView();
    }, 1000);

    document.addEventListener('visibilitychange', handleLeave);
    window.addEventListener('pagehide', handleLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      handleLeave();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, articleId]);

  return null;
}
