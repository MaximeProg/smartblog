'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_CONFIG: Record<Device, { icon: typeof Monitor; label: string; width: string }> = {
  desktop: { icon: Monitor,    label: 'Bureau',   width: '100%'  },
  tablet:  { icon: Tablet,     label: 'Tablette', width: '768px' },
  mobile:  { icon: Smartphone, label: 'Mobile',   width: '390px' },
};

interface Props {
  previewUrl:    string;
  refreshSignal: number;
}

export function StudioPreviewPanel({ previewUrl, refreshSignal }: Props) {
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const mountedUrl  = useRef<string | null>(null);
  const [device,       setDevice]       = useState<Device>('desktop');
  const [iframeHeight, setIframeHeight] = useState(900);
  const [reloadKey,    setReloadKey]    = useState(0);

  // ── Measure iframe content height accurately ───────────────────────────
  const measureHeight = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      const doc    = iframe?.contentDocument;
      if (!doc || !doc.body) return;

      // Temporarily reset height so body can collapse to natural size
      iframe!.style.height = '1px';
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        doc.documentElement.clientHeight,
      );
      iframe!.style.height = '';
      if (h > 0) setIframeHeight(Math.max(600, h));
    } catch {}
  }, []);

  // ── On load: measure immediately + after JS settles ───────────────────
  const handleLoad = useCallback(() => {
    measureHeight();
    setTimeout(measureHeight, 150);
    setTimeout(measureHeight, 600);
  }, [measureHeight]);

  // ── Soft-navigate when previewUrl changes ─────────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (mountedUrl.current === null) {
      mountedUrl.current = previewUrl;
      return;
    }
    if (mountedUrl.current !== previewUrl) {
      mountedUrl.current = previewUrl;
      try {
        iframe.contentWindow?.location.replace(previewUrl);
      } catch {
        iframe.src = previewUrl;
      }
    }
  }, [previewUrl]);

  // ── Reload when save triggers a refresh ───────────────────────────────
  useEffect(() => {
    if (refreshSignal === 0) return;
    const iframe = iframeRef.current;
    try {
      iframe?.contentWindow?.location.reload();
    } catch {
      setReloadKey(k => k + 1);
    }
  }, [refreshSignal]);

  // ── Manual refresh button ──────────────────────────────────────────────
  const handleManualRefresh = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      setReloadKey(k => k + 1);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">

      {/* Toolbar */}
      <div className="shrink-0 h-10 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Prévisualisation en direct
        </span>

        <div className="flex items-center gap-1">
          {/* Device switcher */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 mr-1">
            {(Object.entries(DEVICE_CONFIG) as [Device, typeof DEVICE_CONFIG[Device]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                title={cfg.label}
                className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                  device === key ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <cfg.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            title="Actualiser"
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir dans un nouvel onglet"
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Iframe area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div
          className="bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
          style={{ width: DEVICE_CONFIG[device].width, maxWidth: '100%' }}
        >
          {/* Browser chrome mock */}
          <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-2 shrink-0">
            <div className="flex gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md h-4 flex items-center px-2">
              <span className="text-[9px] text-slate-400 truncate">{previewUrl}</span>
            </div>
          </div>

          <iframe
            ref={iframeRef}
            key={reloadKey}
            src={previewUrl}
            className="w-full border-0 block"
            style={{ height: `${iframeHeight}px` }}
            title="Aperçu du blog"
            onLoad={handleLoad}
          />
        </div>
      </div>
    </div>
  );
}
