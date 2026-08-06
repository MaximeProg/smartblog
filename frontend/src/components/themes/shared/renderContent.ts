/**
 * Converts Markdown to HTML or passes HTML through unchanged.
 * Shared by all blog templates.
 */

import DOMPurify, { type Config } from 'isomorphic-dompurify';

// Restreint aux balises/attributs que markdownToHtml() produit réellement,
// plus ceux qu'un article édité en HTML brut (WYSIWYG) peut légitimement
// contenir — jamais <script>, <style>, gestionnaires on*, javascript: URLs,
// etc. Sans ça, le contenu d'un article est injecté tel quel via
// dangerouslySetInnerHTML sur une page publique visitée par n'importe qui ;
// combiné au token d'auth stocké en localStorage, un article piégé
// suffirait à voler la session de n'importe quel visiteur connecté (vrai
// gap trouvé lors de l'audit de sécurité du 2026-08-06).
const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark',
    'a', 'img', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'target', 'rel', 'class', 'colspan', 'rowspan', 'allowfullscreen', 'loading', 'frameborder'],
};

// <iframe src> ne doit jamais accepter un domaine arbitraire (DOMPurify
// n'a pas de restriction par-domaine intégrée dans sa config déclarative) —
// seuls les lecteurs vidéo YouTube/Vimeo que markdownToHtml() génère
// lui-même sont légitimes ; tout le reste est retiré.
const IFRAME_SRC_ALLOWLIST = [/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\//, /^https:\/\/player\.vimeo\.com\/video\//];
let hookRegistered = false;
function ensureIframeHook(): void {
  if (hookRegistered) return;
  hookRegistered = true;
  DOMPurify.addHook('uponSanitizeElement', (node) => {
    if (node.nodeName?.toLowerCase() !== 'iframe') return;
    const src = (node as HTMLIFrameElement).getAttribute?.('src') ?? '';
    if (!IFRAME_SRC_ALLOWLIST.some(re => re.test(src))) {
      node.parentNode?.removeChild(node);
    }
  });
}

export function sanitizeHtml(html: string): string {
  ensureIframeHook();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string;
}

export function markdownToHtml(md: string): string {
  // Pre-process: extract video/audio embed lines before HTML escaping
  const embeds: string[] = [];

  let src = md
    // YouTube: full URL on its own line
    .replace(
      /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*$/gm,
      (_, id) => {
        const idx = embeds.length;
        embeds.push(
          `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.5em 0">` +
          `<iframe src="https://www.youtube.com/embed/${id}?rel=0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe></div>`
        );
        return `__EMBED_${idx}__`;
      }
    )
    // Vimeo: full URL on its own line
    .replace(
      /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)[^\s]*$/gm,
      (_, id) => {
        const idx = embeds.length;
        embeds.push(
          `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.5em 0">` +
          `<iframe src="https://player.vimeo.com/video/${id}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe></div>`
        );
        return `__EMBED_${idx}__`;
      }
    );

  let html = src
    // Escape raw HTML special chars (XSS guard for plain-text content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr>')
    // Blockquote
    .replace(/^&gt;\s*(.+)$/gm, '<blockquote>$1</blockquote>')
    // List items (unordered + ordered — both become <li>, wrapped below)
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Images before links (order matters)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:1em 0" />')
    // Links — open in new tab
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Bold + italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Wrap consecutive <li> sequences in <ul>
  html = html.replace(
    /(<li>[\s\S]*?<\/li>)(\s*<li>[\s\S]*?<\/li>)*/g,
    m => `<ul>${m}</ul>`,
  );

  // Wrap plain-text blocks in <p> (anything not already a block element)
  const BLOCK = /^<(h[1-6]|ul|ol|li|blockquote|hr|img|pre|div|table)/;
  const EMBED_PLACEHOLDER = /^__EMBED_\d+__$/;
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (BLOCK.test(block) || EMBED_PLACEHOLDER.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  // Restore video/audio embeds
  embeds.forEach((embed, i) => {
    html = html.replace(`__EMBED_${i}__`, embed);
  });

  return html;
}

/**
 * Renders article content: auto-detects Markdown vs HTML and converts if
 * needed, then sanitizes — the result is only ever safe to hand to
 * dangerouslySetInnerHTML because of this last step (never skip it, and
 * never render `source` directly without going through this function).
 */
export function renderContent(source: string | null | undefined): string {
  if (!source) return '<p>No content available.</p>';
  const isMarkdown = !/<[a-z][\s\S]*>/i.test(source);
  const html = isMarkdown ? markdownToHtml(source) : source;
  return sanitizeHtml(html);
}
