'use client';

import type { PublicArticleFull } from '@/lib/public-api';

type MediaArticle = Pick<PublicArticleFull,
  'article_type' | 'video_url' | 'audio_url' | 'episode_number' | 'season'
>;

function parseVideoEmbed(url: string): { embedUrl: string; kind: 'youtube' | 'vimeo' | 'direct' } | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0`, kind: 'youtube' };

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`, kind: 'vimeo' };

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { embedUrl: url, kind: 'direct' };

  return null;
}

interface ArticleMediaBlockProps {
  article: MediaArticle;
  /**
   * hero=true → renders only the media element with absolute inset-0,
   * suitable for placement inside the theme's own hero container.
   * hero=false (default) → renders a standalone block with its own wrapper.
   */
  hero?: boolean;
}

export function ArticleMediaBlock({ article, hero = false }: ArticleMediaBlockProps) {
  const type = article.article_type;

  if (type === 'video' && article.video_url) {
    const embed = parseVideoEmbed(article.video_url);
    if (!embed) return null;

    if (hero) {
      if (embed.kind === 'direct') {
        return (
          <video
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
            src={embed.embedUrl}
          >
            Your browser does not support the video tag.
          </video>
        );
      }
      return (
        <iframe
          src={embed.embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          title="Video"
        />
      );
    }

    // Standalone block
    if (embed.kind === 'direct') {
      return (
        <div className="w-full my-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
            <video controls className="w-full h-full" src={embed.embedUrl} playsInline>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full my-8">
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
          <iframe
            src={embed.embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title="Video"
          />
        </div>
      </div>
    );
  }

  if ((type === 'audio' || type === 'podcast') && article.audio_url) {
    return (
      <div className="w-full my-8">
        {type === 'podcast' && (article.episode_number || article.season) && (
          <div className="flex items-center gap-2 mb-4">
            {article.season != null && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Season {article.season}
              </span>
            )}
            {article.episode_number != null && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-white">
                Episode {article.episode_number}
              </span>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <audio controls className="w-full" src={article.audio_url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    );
  }

  return null;
}
