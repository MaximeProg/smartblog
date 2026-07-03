'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote,
  Link2, ImageIcon, Minus, RotateCcw, RotateCw,
} from 'lucide-react';
import { mediaApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StudioRichTextProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  tenantId?: string;
  minHeight?: number;
}

const btnCls = (active = false) =>
  `h-7 w-7 flex items-center justify-center rounded-md text-[12px] transition-colors ${
    active
      ? 'bg-blue-100 text-blue-700'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  }`;

export function StudioRichText({
  value,
  onChange,
  placeholder = 'Écrivez ici…',
  tenantId,
  minHeight = 160,
}: StudioRichTextProps) {
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 text-[14px] text-slate-700 leading-relaxed',
        style: `min-height:${minHeight}px`,
      },
    },
  });

  // Sync external value changes without losing cursor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL du lien :');
    if (!url) return;
    editor.chain().focus().extendMarkToLink({ href: url }).setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(async () => {
    if (!editor) return;
    if (tenantId) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const { data } = await mediaApi.upload(tenantId, file);
          editor.chain().focus().setImage({ src: data.cloudinary_secure_url }).run();
        } catch {
          toast({ variant: 'destructive', title: 'Erreur lors de l\'upload.' });
        }
      };
      input.click();
    } else {
      const url = window.prompt('URL de l\'image :');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, tenantId, toast]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive('bold'))} title="Gras"><Bold className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive('italic'))} title="Italique"><Italic className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnCls(editor.isActive('underline'))} title="Souligné"><UnderlineIcon className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnCls(editor.isActive('strike'))} title="Barré"><Strikethrough className="h-3.5 w-3.5" /></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive('heading', { level: 2 }))} title="Titre H2"><Heading2 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive('heading', { level: 3 }))} title="Titre H3"><Heading3 className="h-3.5 w-3.5" /></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive('bulletList'))} title="Liste à puces"><List className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive('orderedList'))} title="Liste numérotée"><ListOrdered className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive('blockquote'))} title="Citation"><Quote className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnCls()} title="Séparateur"><Minus className="h-3.5 w-3.5" /></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button type="button" onClick={addLink} className={btnCls(editor.isActive('link'))} title="Insérer un lien"><Link2 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={addImage} className={btnCls()} title="Insérer une image"><ImageIcon className="h-3.5 w-3.5" /></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5 ml-auto" />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnCls()} title="Annuler"><RotateCcw className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnCls()} title="Refaire"><RotateCw className="h-3.5 w-3.5" /></button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
