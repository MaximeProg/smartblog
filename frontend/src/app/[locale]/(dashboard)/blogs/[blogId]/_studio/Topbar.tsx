'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink, Save, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor.store';
import { useCurrentTenant } from '@/store/auth.store';
import { useState } from 'react';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface TopbarProps {
  deviceMode: DeviceMode;
  onDeviceChange: (m: DeviceMode) => void;
}

const DEVICES: { mode: DeviceMode; icon: React.ElementType; label: string }[] = [
  { mode: 'desktop', icon: Monitor,    label: 'Bureau' },
  { mode: 'tablet',  icon: Tablet,     label: 'Tablette' },
  { mode: 'mobile',  icon: Smartphone, label: 'Mobile' },
];

export function Topbar({ deviceMode, onDeviceChange }: TopbarProps) {
  const params  = useParams();
  const locale  = params.locale as string;
  const pathname = usePathname();

  const { dirty, saving, save, tenantSlug } = useEditorStore();
  const currentTenant = useCurrentTenant();
  const [saved, setSaved] = useState(false);

  const isStudioRoot = pathname === `/${locale}/blogs/${params.blogId as string}`;

  const handleSave = async () => {
    try {
      await save();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="h-12 shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center px-3 gap-2 z-20">
      {/* ← Dashboard */}
      <Link
        href={`/${locale}/dashboard`}
        className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

      {/* Blog name */}
      <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate min-w-0 flex-1">
        {currentTenant?.name ?? 'Studio'}
      </span>

      {/* Device controls — only on studio root */}
      {isStudioRoot && (
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {DEVICES.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              title={label}
              onClick={() => onDeviceChange(mode)}
              className={cn(
                'flex items-center justify-center h-7 w-8 rounded-md transition',
                deviceMode === mode
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      {/* View blog */}
      {tenantSlug && (
        <a
          href={`/${locale}/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 text-[12px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition shrink-0',
          dirty && !saving
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default',
        )}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : saved ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        <span>{saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}</span>
      </button>
    </div>
  );
}
