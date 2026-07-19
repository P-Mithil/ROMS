const PREFIX = "roms:v1:";

function key(name: string) {
  return `${PREFIX}${name}`;
}

export function readJsonStorage<T>(name: string): T | null {
  try {
    const raw = window.localStorage.getItem(key(name));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonStorage<T>(name: string, value: T) {
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function removeStorage(name: string) {
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    // Ignore.
  }
}

export type FilterPreset<T extends Record<string, unknown>> = {
  id: string;
  name: string;
  createdAt: string;
  filters: T;
};

export function listFilterPresets<T extends Record<string, unknown>>(
  scope: string,
): FilterPreset<T>[] {
  return readJsonStorage<FilterPreset<T>[]>(`filters:${scope}`) ?? [];
}

export function saveFilterPreset<T extends Record<string, unknown>>(
  scope: string,
  name: string,
  filters: T,
): FilterPreset<T>[] {
  const current = listFilterPresets<T>(scope);
  const next: FilterPreset<T>[] = [
    {
      id: crypto.randomUUID(),
      name: name.trim() || "Saved filter",
      createdAt: new Date().toISOString(),
      filters,
    },
    ...current,
  ].slice(0, 8);
  writeJsonStorage(`filters:${scope}`, next);
  return next;
}

export function deleteFilterPreset(scope: string, id: string) {
  const next = listFilterPresets(scope).filter((item) => item.id !== id);
  writeJsonStorage(`filters:${scope}`, next);
  return next;
}

export type DraftEnvelope<T> = {
  updatedAt: string;
  data: T;
};

export function loadDraft<T>(scope: string): DraftEnvelope<T> | null {
  return readJsonStorage<DraftEnvelope<T>>(`draft:${scope}`);
}

export function saveDraft<T>(scope: string, data: T) {
  writeJsonStorage(`draft:${scope}`, {
    updatedAt: new Date().toISOString(),
    data,
  } satisfies DraftEnvelope<T>);
}

export function clearDraft(scope: string) {
  removeStorage(`draft:${scope}`);
}
