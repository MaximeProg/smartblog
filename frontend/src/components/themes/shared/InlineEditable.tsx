'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

interface Props {
  path: string;
  value: string;
  editMode?: boolean;
  tag?: string;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}

export function InlineEditable({
  path, value, editMode, tag = 'span', className, style, multiline = false,
}: Props) {
  const el = useRef<HTMLElement>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!active.current && el.current) el.current.innerText = value;
  });

  const Tag = tag as any;
  if (!editMode) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      ref={el}
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={{ ...style, cursor: 'text', outline: 'none' }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        active.current = true;
        e.currentTarget.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 0 4px #dbeafe';
        e.currentTarget.style.borderRadius = '3px';
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        active.current = false;
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderRadius = '';
        window.parent.postMessage(
          { type: 'INLINE_EDIT', path, value: e.currentTarget.innerText.trim() },
          '*',
        );
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') e.currentTarget.blur();
      }}
    />
  );
}
