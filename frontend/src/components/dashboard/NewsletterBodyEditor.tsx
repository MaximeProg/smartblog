'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, UnderlineIcon, Link2, List, ListOrdered,
  Heading2, Heading3, Minus, ImageIcon, Quote, MousePointer2, Eye, Pencil,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolBtn({
  active, onClick, children, title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
        active
          ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-slate-100'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

const PREVIEW_WRAP = (body: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #1e293b; line-height: 1.65; margin: 0; padding: 24px; background: #f8fafc; }
  .email-body { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 1.5em; }
  h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 1.2em; }
  p { margin: .8em 0; }
  a { color: #2563eb; }
  blockquote { border-left: 3px solid #2563eb; margin: 1em 0; padding: 8px 16px; background: #eff6ff; color: #1e3a8a; border-radius: 0 8px 8px 0; }
  ul, ol { padding-left: 1.5em; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
  img { max-width: 100%; border-radius: 8px; }
  .cta-btn { display: block; width: fit-content; margin: 20px auto; padding: 12px 28px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; }
</style></head>
<body><div class="email-body">${body}</div></body></html>`;

export default function NewsletterBodyEditor({ value, onChange, placeholder }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? 'Rédigez le contenu de votre email…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[180px] px-3 py-3 focus:outline-none text-[13px] text-slate-800 dark:text-slate-200',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', prev ?? 'https://');
    if (url === null) return;
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL de l\'image');
    if (!url) return;
    const alt = window.prompt('Texte alternatif (optionnel)', '') ?? '';
    editor.chain().focus().setImage({ src: url, alt }).run();
  }, [editor]);

  const insertCTA = useCallback(() => {
    if (!editor) return;
    const label = window.prompt('Texte du bouton', 'Lire la suite →');
    if (!label) return;
    const url = window.prompt('URL du bouton', 'https://');
    if (!url) return;
    editor.chain().focus().insertContent(
      `<p><a class="cta-btn" href="${url}">${label}</a></p>`
    ).run();
  }, [editor]);

  if (!editor) return null;

  const html = editor.getHTML();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        {mode === 'edit' && (
          <>
            <ToolBtn title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolBtn title="Titre H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Titre H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolBtn title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolBtn title="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Image" active={false} onClick={insertImage}>
              <ImageIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Bouton CTA" active={false} onClick={insertCTA}>
              <MousePointer2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Lien" active={editor.isActive('link')} onClick={setLink}>
              <Link2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn title="Séparateur" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus className="h-3.5 w-3.5" />
            </ToolBtn>
          </>
        )}

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-semibold transition-colors ${mode === 'edit' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-semibold transition-colors ${mode === 'preview' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor or Preview */}
      {mode === 'edit' ? (
        <EditorContent editor={editor} />
      ) : (
        <iframe
          srcDoc={PREVIEW_WRAP(html)}
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ minHeight: '280px', height: '100%' }}
          onLoad={e => {
            const frame = e.currentTarget;
            const doc = frame.contentDocument;
            if (doc) {
              frame.style.height = `${doc.body.scrollHeight + 40}px`;
            }
          }}
          title="Email preview"
        />
      )}
    </div>
  );
}
