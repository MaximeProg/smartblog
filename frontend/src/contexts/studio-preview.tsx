'use client';

import { createContext, useContext } from 'react';

export interface StudioPreviewCtx {
  setPreview: (config: { path: string; blogSlug?: string }) => void;
  refresh: () => void;
  setFullWidth: (full: boolean) => void;
}

export const StudioPreviewContext = createContext<StudioPreviewCtx>({
  setPreview:    () => {},
  refresh:       () => {},
  setFullWidth:  () => {},
});

export const useStudioPreview = () => useContext(StudioPreviewContext);
