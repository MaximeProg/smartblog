'use client';

import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  debounceMs?: number;
  /** Set to true once the initial server data has been loaded into cfg */
  enabled?: boolean;
}

/**
 * Debounced auto-save hook. Fires `saveFn` after `debounceMs` of no changes.
 * Skips the first time `enabled` becomes true (initial server-data load).
 * The `isDirtyRef` should be set by the page's patch fn and cleared on save success,
 * so that server refetches don't overwrite in-progress edits.
 */
export function useAutoSave<T>(
  cfg: T,
  saveFn: (cfg: T) => Promise<unknown>,
  { debounceMs = 1500, enabled = true }: UseAutoSaveOptions = {},
): { isAutoSaving: boolean } {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cfgRef = useRef(cfg);
  const saveFnRef = useRef(saveFn);
  const skipRef = useRef(true); // skip first fire after enabled becomes true

  cfgRef.current = cfg;
  saveFnRef.current = saveFn;

  const cfgKey = JSON.stringify(cfg);

  useEffect(() => {
    if (!enabled) {
      skipRef.current = true;
      return;
    }
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await saveFnRef.current(cfgRef.current);
      } catch {
        // silent — user can use the manual save button on error
      } finally {
        setIsAutoSaving(false);
      }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
    // cfgKey and enabled are the only stable triggers we need
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey, enabled, debounceMs]);

  return { isAutoSaving };
}
