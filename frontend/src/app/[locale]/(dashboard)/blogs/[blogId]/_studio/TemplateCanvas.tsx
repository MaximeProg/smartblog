'use client';

import { useRef, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor.store';
import { Topbar, type DeviceMode } from './Topbar';

const DEVICE_WIDTH: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '390px',
};

export function TemplateCanvas() {
  const params  = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;

  const { schema, activePage, tenantSlug, tenantId, liveConfig, refreshCounter, selectSection, selectElement, updateField } =
    useEditorStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [device,  setDevice]  = useState<DeviceMode>('desktop');

  // Canvas URL — served outside the dashboard so no layout / auth
  const iframeSrc = tenantId ? `/${locale}/canvas/${blogId}` : null;

  // ── keep a ref snapshot so the message handler never reads stale closures ──
  const snapRef = useRef({ liveConfig, tenantSlug, tenantId, schema, activePage, locale });
  snapRef.current = { liveConfig, tenantSlug, tenantId, schema, activePage, locale };

  // ── receive messages from the canvas iframe ──────────────────────────────
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const msg = e.data as {
        type?: string;
        sectionId?: string;
        elementId?: string | null;
        kind?: string | null;
        path?: string;
        value?: unknown;
      };
      if (!msg?.type) return;

      if (msg.type === 'CANVAS_READY') {
        const s = snapRef.current;
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'STUDIO_INIT',
            slug: s.tenantSlug,
            theme: s.schema?.id ?? 'editorial',
            language: s.locale,
            tenantId: s.tenantId,
            liveConfig: s.liveConfig,
            activePage: s.activePage,
          },
          '*',
        );
      } else if (msg.type === 'ELEMENT_CLICK') {
        selectElement(msg.elementId ?? null, msg.sectionId ?? null);
      } else if (msg.type === 'SECTION_CLICK' && msg.sectionId) {
        selectSection(msg.sectionId);
      } else if (msg.type === 'INLINE_EDIT' && msg.path) {
        updateField(msg.path, msg.value);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [selectSection, selectElement, updateField]);

  // ── debounced real-time config patch ────────────────────────────────────
  const patchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PATCH_LIVECONFIG', liveConfig },
        '*',
      );
    }, 150);
    return () => clearTimeout(patchTimer.current);
  }, [liveConfig]);

  // ── navigate canvas when active page changes ─────────────────────────────
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'NAVIGATE', activePage },
      '*',
    );
  }, [activePage]);

  // ── initial iframe load ──────────────────────────────────────────────────
  useEffect(() => {
    if (!iframeSrc || !iframeRef.current) return;
    iframeRef.current.src = iframeSrc;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── reload after save ────────────────────────────────────────────────────
  useEffect(() => {
    if (refreshCounter === 0 || !iframeSrc || !iframeRef.current) return;
    iframeRef.current.src = iframeSrc;
  }, [refreshCounter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar deviceMode={device} onDeviceChange={setDevice} />

      <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 flex items-start justify-center p-4">
        <div
          className={cn(
            'relative h-full shadow-xl rounded-lg overflow-hidden transition-all duration-300',
            device !== 'desktop' && 'min-h-[600px]',
          )}
          style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 z-10">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          )}

          {iframeSrc ? (
            <iframe
              ref={iframeRef}
              title="Studio Canvas"
              className="w-full h-full border-0 bg-white"
              style={{ minHeight: device !== 'desktop' ? '600px' : '100%' }}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900">
              <div className="text-center">
                <Loader2 className="h-6 w-6 text-slate-300 animate-spin mx-auto mb-2" />
                <p className="text-[13px] text-slate-400">Chargement du studio…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
