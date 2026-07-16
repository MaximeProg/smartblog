'use client';
import { useState } from 'react';

interface Props {
  id: string;
  editMode?: boolean;
  selectedSectionId?: string | null;
  onSectionClick?: (id: string) => void;
  onSectionHover?: (id: string | null) => void;
  children: React.ReactNode;
}

export function EditableSection({ id, editMode, selectedSectionId, onSectionClick, onSectionHover, children }: Props) {
  const [hovered, setHovered] = useState(false);

  if (!editMode) return <>{children}</>;

  const isSelected = selectedSectionId === id;
  const outlineColor = isSelected ? '#3b82f6' : hovered ? '#93c5fd' : 'transparent';

  return (
    <div style={{ position: 'relative' }}>
      {/* transparent overlay — intercepts all pointer events so the section is selectable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          cursor: 'pointer',
          outline: `2px solid ${outlineColor}`,
          outlineOffset: '-2px',
          transition: 'outline-color 0.1s',
        }}
        onClick={() => onSectionClick?.(id)}
        onMouseEnter={() => { setHovered(true); onSectionHover?.(id); }}
        onMouseLeave={() => { setHovered(false); onSectionHover?.(null); }}
      >
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: '#3b82f6',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {id}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
