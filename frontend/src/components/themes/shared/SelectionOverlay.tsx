'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(id: string): Rect | null {
  const el = document.querySelector(`[data-edit-id="${CSS.escape(id)}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function useTrackedRect(id: string | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!id) {
      setRect(null);
      return;
    }

    function update() {
      setRect(id ? getRect(id) : null);
    }
    update();

    const el = document.querySelector(`[data-edit-id="${CSS.escape(id)}"]`);
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [id]);

  return rect;
}

interface Props {
  hoveredId: string | null;
  selectedId: string | null;
}

/**
 * Purely visual — pointer-events:none, so it never intercepts clicks.
 * Draws a highlight box around whatever DOM node currently carries the
 * hovered/selected data-edit-id, resolved live via getBoundingClientRect().
 */
export function SelectionOverlay({ hoveredId, selectedId }: Props) {
  const showHover = hoveredId && hoveredId !== selectedId;
  const hoverRect = useTrackedRect(showHover ? hoveredId : null);
  const selectedRect = useTrackedRect(selectedId);

  return (
    <>
      {hoverRect && <div style={boxStyle(hoverRect, '#93c5fd')} />}
      {selectedRect && (
        <div style={boxStyle(selectedRect, '#3b82f6')}>
          <span style={labelStyle}>{selectedId}</span>
        </div>
      )}
    </>
  );
}

function boxStyle(r: Rect, color: string): CSSProperties {
  return {
    position: 'fixed',
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    outline: `2px solid ${color}`,
    outlineOffset: -2,
    pointerEvents: 'none',
    zIndex: 999999,
  };
}

const labelStyle: CSSProperties = {
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
};
