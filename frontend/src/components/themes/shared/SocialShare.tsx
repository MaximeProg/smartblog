'use client';

import { Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  url: string;
  title: string;
  compact?: boolean;
}

export function SocialShare({ url, title, compact = false }: Props) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass = compact
    ? 'h-8 w-8 rounded-full flex items-center justify-center border border-border hover:border-[var(--blog-primary)] hover:text-[var(--blog-primary)] transition-colors'
    : 'flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-[var(--blog-primary)] hover:text-[var(--blog-primary)] transition-colors text-sm font-medium';

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank" rel="noopener noreferrer"
        className={btnClass}
        aria-label="Twitter"
      >
        <Twitter className="h-3.5 w-3.5" />
        {!compact && <span>Twitter</span>}
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank" rel="noopener noreferrer"
        className={btnClass}
        aria-label="Facebook"
      >
        <Facebook className="h-3.5 w-3.5" />
        {!compact && <span>Facebook</span>}
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank" rel="noopener noreferrer"
        className={btnClass}
        aria-label="LinkedIn"
      >
        <Linkedin className="h-3.5 w-3.5" />
        {!compact && <span>LinkedIn</span>}
      </a>
      <button onClick={copy} className={btnClass} aria-label="Copier le lien">
        {copied
          ? <Check className="h-3.5 w-3.5 text-green-500" />
          : <Link2 className="h-3.5 w-3.5" />}
        {!compact && <span>{copied ? 'Copié !' : 'Copier'}</span>}
      </button>
    </div>
  );
}
