'use client';

import { useEffect } from 'react';

interface Props {
  enabled: boolean;
  onSelect: (elementId: string | null, kind: string | null, sectionId: string | null) => void;
  onHover: (elementId: string | null) => void;
}

function resolveSectionId(el: Element): string | null {
  const sectionEl = el.closest('[data-edit-kind="section"]');
  return sectionEl ? sectionEl.getAttribute('data-edit-id') : null;
}

/**
 * Delegated click/hover for the Studio canvas — replaces the old blocking
 * overlay in EditableSection. Runs in the capture phase so it always sees
 * the event first, but only calls preventDefault on real navigation
 * (links/forms), leaving everything else (contentEditable focus, buttons)
 * to behave normally.
 */
export function EditModeController({ enabled, onSelect, onHover }: Props) {
  useEffect(() => {
    if (!enabled) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const navBlocker = target.closest('a, form, button[type="submit"]');
      if (navBlocker) e.preventDefault();

      const editEl = target.closest('[data-edit-id]') as HTMLElement | null;
      if (!editEl) {
        onSelect(null, null, null);
        return;
      }
      const elementId = editEl.getAttribute('data-edit-id');
      const kind = editEl.getAttribute('data-edit-kind');
      const sectionId = kind === 'section' ? elementId : resolveSectionId(editEl);
      onSelect(elementId, kind, sectionId);
    }

    function handleOver(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const editEl = target?.closest('[data-edit-id]') as HTMLElement | null;
      onHover(editEl ? editEl.getAttribute('data-edit-id') : null);
    }

    function handleOut(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !related.closest?.('[data-edit-id]')) onHover(null);
    }

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleOver, true);
    document.addEventListener('mouseout', handleOut, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseover', handleOver, true);
      document.removeEventListener('mouseout', handleOut, true);
    };
  }, [enabled, onSelect, onHover]);

  return null;
}
