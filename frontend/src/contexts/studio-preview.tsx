'use client';

import { createContext, useContext } from 'react';

export interface StudioPreviewCtx {
  setPreview: (config: { path: string; blogSlug?: string }) => void;
}

export const StudioPreviewContext = createContext<StudioPreviewCtx>({
  setPreview: () => {},
});

export const useStudioPreview = () => useContext(StudioPreviewContext);
