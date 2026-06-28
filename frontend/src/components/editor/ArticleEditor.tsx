'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useTranslations } from 'next-intl';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Undo, Redo, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ArticleEditorProps {
  content?: string;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function ArticleEditor({
  content = '',
  onChange,
  placeholder,
  readOnly = false,
}: ArticleEditorProps) {
  const t = useTranslations('editor.toolbar');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-8 w-8 flex items-center justify-center rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted',
        active && 'bg-muted text-foreground'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden bg-background">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-2 bg-muted/30">
          <ToolbarButton title={t('bold')} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('strikethrough')} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarButton title={t('heading1')} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('heading2')} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('heading3')} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarButton title={t('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('code')} onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarButton title={t('undo')} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title={t('redo')} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
