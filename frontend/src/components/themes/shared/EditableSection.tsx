'use client';

interface Props {
  id: string;
  editMode?: boolean;
  selectedSectionId?: string | null;
  onSectionClick?: (id: string) => void;
  onSectionHover?: (id: string | null) => void;
  children: React.ReactNode;
}

/**
 * Wraps a section for the Studio canvas. No longer intercepts pointer events —
 * selection/hover is handled by delegated listeners in EditModeController, so
 * children (InlineEditable text, links, buttons) stay directly clickable.
 * data-edit-id/data-edit-kind are the only contract EditModeController relies on.
 */
export function EditableSection({ id, editMode, children }: Props) {
  if (!editMode) return <>{children}</>;

  return (
    <div data-edit-id={id} data-edit-kind="section" style={{ position: 'relative' }}>
      {children}
    </div>
  );
}
