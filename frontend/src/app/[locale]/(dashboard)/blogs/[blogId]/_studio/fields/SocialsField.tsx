'use client';

import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

const NETWORKS = [
  { key: 'twitter',   label: 'X / Twitter',  placeholder: 'https://x.com/…' },
  { key: 'facebook',  label: 'Facebook',     placeholder: 'https://facebook.com/…' },
  { key: 'instagram', label: 'Instagram',    placeholder: 'https://instagram.com/…' },
  { key: 'youtube',   label: 'YouTube',      placeholder: 'https://youtube.com/…' },
  { key: 'linkedin',  label: 'LinkedIn',     placeholder: 'https://linkedin.com/in/…' },
  { key: 'tiktok',    label: 'TikTok',       placeholder: 'https://tiktok.com/@…' },
  { key: 'github',    label: 'GitHub',       placeholder: 'https://github.com/…' },
  { key: 'discord',   label: 'Discord',      placeholder: 'https://discord.gg/…' },
  { key: 'pinterest', label: 'Pinterest',    placeholder: 'https://pinterest.com/…' },
  { key: 'telegram',  label: 'Telegram',     placeholder: 'https://t.me/…' },
  { key: 'spotify',   label: 'Spotify',      placeholder: 'https://open.spotify.com/…' },
];

export function SocialsField({ value, onChange }: Props) {
  const links = (value as Record<string, string>) ?? {};

  const update = (key: string, val: string) => {
    if (val.trim()) {
      onChange({ ...links, [key]: val });
    } else {
      const next = { ...links };
      delete next[key];
      onChange(next);
    }
  };

  return (
    <div className="space-y-2">
      {NETWORKS.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-0.5">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</label>
          <input
            type="url"
            value={links[key] ?? ''}
            onChange={(e) => update(key, e.target.value)}
            placeholder={placeholder}
            className="w-full text-[12px] px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>
      ))}
    </div>
  );
}
