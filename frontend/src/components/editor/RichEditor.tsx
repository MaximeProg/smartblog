'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Youtube } from '@tiptap/extension-youtube';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Mention } from '@tiptap/extension-mention';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import { Extension, Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { useTranslations } from 'next-intl';

const lowlight = createLowlight(common);

// ── Custom FontSize extension ─────────────────────────────────────

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as unknown as Partial<RawCommands>;
  },
});

// ── Callout custom node ───────────────────────────────────────────

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      type: { default: 'info' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: `callout callout-${HTMLAttributes.type}` }), 0];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCallout: (type: string = 'info') => ({ commands }: any) =>
        commands.setNode('callout', { type }),
    } as unknown as Partial<RawCommands>;
  },
});

// ── CTA Button node ───────────────────────────────────────────────

const CTAButton = Node.create({
  name: 'ctaButton',
  group: 'block',
  inline: false,
  atom: true,
  addAttributes() {
    return {
      label: { default: 'Click here' },
      url: { default: '#' },
      variant: { default: 'primary' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-cta]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { label, url, variant } = HTMLAttributes;
    return ['div', mergeAttributes({ 'data-cta': '' }), ['a', { href: url, class: `cta-button cta-${variant}` }, label]];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCTAButton: (attrs: { label: string; url: string; variant?: string }) => ({ commands }: any) =>
        commands.insertContent({ type: 'ctaButton', attrs }),
    } as unknown as Partial<RawCommands>;
  },
});

// ── Props ─────────────────────────────────────────────────────────

export interface RichEditorProps {
  content?: string;
  contentJson?: Record<string, unknown>;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

export function RichEditor({
  content = '',
  contentJson,
  onChange,
  placeholder,
  readOnly = false,
  className = '',
}: RichEditorProps) {
  const t = useTranslations('editor');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      CharacterCount,
      Mention.configure({
        suggestion: {
          items: ({ query }: { query: string }) => {
            const authors = ['Alice', 'Bob', 'Charlie', 'Diana'];
            return authors.filter(a => a.toLowerCase().startsWith(query.toLowerCase()));
          },
          render: () => {
            let el: HTMLElement | null = null;
            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStart: (props: any) => {
                el = document.createElement('div');
                el.className = 'mention-dropdown';
                document.body.appendChild(el);
                renderMentionList(el, props);
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onUpdate: (props: any) => {
                if (el) renderMentionList(el, props);
              },
              onExit: () => {
                el?.remove();
                el = null;
              },
            };
          },
        },
      }),
      Callout,
      CTAButton,
      Placeholder.configure({ placeholder: placeholder || t('placeholder') }),
    ],
    content: contentJson || content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON() as Record<string, unknown>;
      onChangeRef.current?.(html, json);
    },
  });

  // Sync content from outside (e.g. loaded from API)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (contentJson && JSON.stringify(editor.getJSON()) !== JSON.stringify(contentJson)) {
      editor.commands.setContent(contentJson, false);
    } else if (!contentJson && content && current !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, contentJson, editor]);

  const addYoutube = useCallback(() => {
    const url = window.prompt(t('youtubePrompt'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (url && editor) (editor.commands as any).setYoutubeVideo({ src: url });
  }, [editor, t]);

  const addImage = useCallback(() => {
    const url = window.prompt(t('imagePrompt'));
    if (url && editor) editor.commands.setImage({ src: url });
  }, [editor, t]);

  const addLink = useCallback(() => {
    const url = window.prompt(t('linkPrompt'));
    if (url && editor) editor.chain().focus().setLink({ href: url }).run();
  }, [editor, t]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addCallout = useCallback((type: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor?.chain().focus() as any)?.setCallout(type)?.run();
  }, [editor]);

  const addCTA = useCallback(() => {
    const label = window.prompt(t('ctaLabel')) || 'Click here';
    const url = window.prompt(t('ctaUrl')) || '#';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor?.chain().focus() as any)?.setCTAButton({ label, url })?.run();
  }, [editor, t]);

  const setFontSize = useCallback((size: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor?.chain().focus() as any)?.setFontSize(size)?.run();
  }, [editor]);

  if (!editor) return null;

  const stats = editor.storage.characterCount;

  return (
    <div className={`rich-editor ${className}`}>
      {/* ── Toolbar ── */}
      <div className="rich-editor-toolbar">
        {/* History */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title={t('undo')} disabled={!editor.can().undo()}>↩</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title={t('redo')} disabled={!editor.can().redo()}>↪</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarGroup>
          {([1, 2, 3, 4] as const).map(level => (
            <ToolBtn
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              active={editor.isActive('heading', { level })}
              title={`H${level}`}
            >
              H{level}
            </ToolBtn>
          ))}
          <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title={t('paragraph')}>¶</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Inline marks */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title={t('bold')}><b>B</b></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title={t('italic')}><i>I</i></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title={t('underline')}><u>U</u></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title={t('strike')}><s>S</s></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title={t('code')}>{'<>'}</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title={t('bulletList')}>•</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title={t('orderedList')}>1.</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title={t('taskList')}>☑</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Align */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title={t('alignLeft')}>⇤</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title={t('alignCenter')}>≡</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title={t('alignRight')}>⇥</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Blocks */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title={t('blockquote')}>"</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title={t('codeBlock')}>{'</>'}</ToolBtn>
          <ToolBtn onClick={addTable} title={t('table')}>⊞</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Media & embeds */}
        <ToolbarGroup>
          <ToolBtn onClick={addImage} title={t('image')}>🖼</ToolBtn>
          <ToolBtn onClick={addYoutube} title={t('youtube')}>▶</ToolBtn>
          <ToolBtn onClick={addLink} active={editor.isActive('link')} title={t('link')}>🔗</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Colors */}
        <ToolbarGroup>
          <label className="toolbar-color-label" title={t('textColor')}>
            A
            <input
              type="color"
              className="toolbar-color-input"
              onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              title={t('textColor')}
            />
          </label>
          <label className="toolbar-color-label toolbar-highlight-label" title={t('highlight')}>
            H
            <input
              type="color"
              className="toolbar-color-input"
              defaultValue="#FFFF00"
              onInput={e => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
              title={t('highlight')}
            />
          </label>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Font size */}
        <ToolbarGroup>
          <select
            className="toolbar-select"
            defaultValue=""
            onChange={e => { if (e.target.value) setFontSize(e.target.value); }}
            title={t('fontSize')}
          >
            <option value="">Size</option>
            {['12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','60px','72px'].map(s => (
              <option key={s} value={s}>{s.replace('px', '')}</option>
            ))}
          </select>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Callouts */}
        <ToolbarGroup>
          <ToolBtn onClick={() => addCallout('info')} title="Callout Info">ℹ</ToolBtn>
          <ToolBtn onClick={() => addCallout('warning')} title="Callout Warning">⚠</ToolBtn>
          <ToolBtn onClick={() => addCallout('success')} title="Callout Success">✓</ToolBtn>
          <ToolBtn onClick={() => addCallout('danger')} title="Callout Danger">✕</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* CTA */}
        <ToolbarGroup>
          <ToolBtn onClick={addCTA} title={t('cta')}>CTA</ToolBtn>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* HR */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title={t('hr')}>—</ToolBtn>
        </ToolbarGroup>
      </div>

      {/* ── Bubble Menu ── */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bubble-menu">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><b>B</b></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><i>I</i></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><s>S</s></ToolBtn>
          <ToolBtn onClick={addLink} active={editor.isActive('link')}>🔗</ToolBtn>
          {editor.isActive('link') && (
            <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()}>✕</ToolBtn>
          )}
        </div>
      </BubbleMenu>

      {/* ── Editor area ── */}
      <EditorContent
        editor={editor}
        className="rich-editor-content prose max-w-none"
      />

      {/* ── Word / char / time counter ── */}
      {stats && (
        <div className="rich-editor-stats">
          <span>{stats.characters()} {t('chars')}</span>
          <span>·</span>
          <span>{stats.words()} {t('words')}</span>
          <span>·</span>
          <span>{Math.max(1, Math.ceil(stats.words() / 200))} {t('minRead')}</span>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="toolbar-group">{children}</div>;
}

function ToolbarDivider() {
  return <span className="toolbar-divider" />;
}

function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`toolbar-btn${active ? ' toolbar-btn-active' : ''}${disabled ? ' toolbar-btn-disabled' : ''}`}
      title={title}
      disabled={disabled}
      tabIndex={-1}
    >
      {children}
    </button>
  );
}

function renderMentionList(
  el: HTMLElement,
  props: { clientRect?: () => DOMRect | null; items: string[]; command: (item: { id: string }) => void }
) {
  const rect = props.clientRect?.();
  if (rect) {
    el.style.position = 'fixed';
    el.style.top = `${rect.bottom + 4}px`;
    el.style.left = `${rect.left}px`;
  }
  el.innerHTML = props.items.map(item =>
    `<div class="mention-item" data-name="${item}">${item}</div>`
  ).join('');
  el.querySelectorAll('.mention-item').forEach((node) => {
    const name = (node as HTMLElement).dataset.name ?? '';
    node.addEventListener('mousedown', (e) => {
      e.preventDefault();
      props.command({ id: name });
    });
  });
}
