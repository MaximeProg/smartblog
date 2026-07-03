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
  previewUrl: string;
}

export function StudioPreviewPanel({ previewUrl }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [iframeHeight, setIframeHeight] = useState(900);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedUrl = useRef<string | null>(null);

  // Soft-navigate inside the iframe when previewUrl changes (no full reload)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // First load: let src handle it
    if (mountedUrl.current === null) {
      mountedUrl.current = previewUrl;
      return;
    }

    // Subsequent changes: soft navigate
    if (mountedUrl.current !== previewUrl) {
      mountedUrl.current = previewUrl;
      try {
        iframe.contentWindow?.location.replace(previewUrl);
      } catch {
        // Cross-origin fallback: change src (will reload, but shouldn't happen here)
        iframe.src = previewUrl;
      }
    }
  }, [previewUrl]);

  // Full reload on refresh button
  const handleRefresh = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.contentWindow?.location.reload();
    }
    setRefreshKey(k => k + 1);
  }, []);

  // Auto-size iframe to content height
  function handleLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const h = doc.documentElement.scrollHeight;
        if (h > 0) setIframeHeight(Math.max(600, h));
      }
    } catch {}
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
      {/* Toolbar */}
      <div className="shrink-0 h-10 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prévisualisation en direct</span>

        <div className="flex items-center gap-1">
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
            onClick={handleRefresh}
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
          style={{ width: DEVICE_CONFIG[device].width, maxWidth: '100%', minHeight: '600px' }}
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
            key={refreshKey}
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
