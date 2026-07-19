import { useEffect, useRef, useState } from "react";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "../lib/local-persistence.js";

type UseDraftAutosaveOptions<T> = {
  scope: string;
  enabled?: boolean;
  value: T;
  onRestore?: (value: T) => void;
  debounceMs?: number;
};

export function useDraftAutosave<T>({
  scope,
  enabled = true,
  value,
  onRestore,
  debounceMs = 800,
}: UseDraftAutosaveOptions<T>) {
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const restoredRef = useRef(false);
  const skipNextSave = useRef(false);
  const firstSaveRun = useRef(true);
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (!enabled || restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    const draft = loadDraft<T>(scope);
    if (!draft) {
      return;
    }
    // A draft identical to the pristine form (e.g. saved before anything was
    // typed) is useless noise — drop it instead of restoring it.
    if (JSON.stringify(draft.data) === JSON.stringify(initialValueRef.current)) {
      clearDraft(scope);
      return;
    }
    skipNextSave.current = true;
    onRestore?.(draft.data);
    setRestoredAt(draft.updatedAt);
    setDirty(true);
  }, [enabled, onRestore, scope]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    // Don't persist the untouched initial value on mount; only save after the
    // user actually changes something.
    if (firstSaveRun.current) {
      firstSaveRun.current = false;
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveDraft(scope, value);
      setDirty(true);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, enabled, scope, value]);

  function discard() {
    clearDraft(scope);
    // Discarding usually resets the form values; don't treat that reset as a
    // new edit worth saving.
    skipNextSave.current = true;
    setDirty(false);
    setRestoredAt(null);
  }

  function markSaved() {
    clearDraft(scope);
    setDirty(false);
    setRestoredAt(null);
  }

  return { restoredAt, dirty, discard, markSaved };
}
