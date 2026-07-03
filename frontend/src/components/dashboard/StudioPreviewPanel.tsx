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
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const mountedUrl = useRef<string | null>(null);
  const [device,    setDevice]    = useState<Device>('desktop');
  const [reloadKey, setReloadKey] = useState(0);

  // Soft-navigate when previewUrl changes (no full reload of the layout)
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

  // Reload iframe after save
  useEffect(() => {
    if (refreshSignal === 0) return;
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      setReloadKey(k => k + 1);
    }
  }, [refreshSignal]);

  const handleManualRefresh = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      setReloadKey(k => k + 1);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* Toolbar */}
      <div className="shrink-0 h-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Prévisualisation en direct
        </span>

        <div className="flex items-center gap-1">
          {/* Device switcher */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mr-1">
            {(Object.entries(DEVICE_CONFIG) as [Device, typeof DEVICE_CONFIG[Device]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                title={cfg.label}
                className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                  device === key ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <cfg.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            title="Actualiser"
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir dans un nouvel onglet"
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Preview area — iframe fills all remaining height, content scrolls inside */}
      <div className="flex-1 overflow-hidden flex items-stretch justify-center p-4 gap-0">
        <div
          className="flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
          style={{ width: DEVICE_CONFIG[device].width, maxWidth: '100%' }}
        >
          {/* Browser chrome mock */}
          <div className="shrink-0 h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-2">
            <div className="flex gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md h-4 flex items-center px-2">
              <span className="text-[9px] text-slate-400 truncate">{previewUrl}</span>
            </div>
          </div>

          {/* iframe takes remaining height — content scrolls naturally inside */}
          <iframe
            ref={iframeRef}
            key={reloadKey}
            src={previewUrl}
            className="flex-1 w-full border-0 block min-h-0"
            title="Aperçu du blog"
          />
        </div>
      </div>
    </div>
  );
}
