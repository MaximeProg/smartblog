/**
 * Converts Markdown to HTML or passes HTML through unchanged.
 * Shared by all blog templates.
 */

export function markdownToHtml(md: string): string {
  let html = md
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
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (BLOCK.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Renders article content: auto-detects Markdown vs HTML and converts if needed.
 */
export function renderContent(source: string | null | undefined): string {
  if (!source) return '<p>No content available.</p>';
  const isMarkdown = !/<[a-z][\s\S]*>/i.test(source);
  return isMarkdown ? markdownToHtml(source) : source;
}
