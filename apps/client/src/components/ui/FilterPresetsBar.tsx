import { FormEvent, useEffect, useState } from "react";
import {
  deleteFilterPreset,
  listFilterPresets,
  saveFilterPreset,
  type FilterPreset,
} from "../../lib/local-persistence.js";
import { Icon } from "./Icon.js";

type FilterPresetsBarProps<T extends Record<string, unknown>> = {
  scope: string;
  currentFilters: T;
  onApply: (filters: T) => void;
};

export function FilterPresetsBar<T extends Record<string, unknown>>({
  scope,
  currentFilters,
  onApply,
}: FilterPresetsBarProps<T>) {
  const [presets, setPresets] = useState<FilterPreset<T>[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setPresets(listFilterPresets<T>(scope));
  }, [scope]);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    const next = saveFilterPreset(scope, name, currentFilters);
    setPresets(next);
    setName("");
  }

  return (
    <div className="filter-presets card">
      <div className="filter-presets__header">
        <span className="filter-presets__title">
          <Icon name="filter" /> Saved filters
        </span>
        <form className="filter-presets__save" onSubmit={handleSave}>
          <input
            className="form-field__input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Preset name"
            maxLength={40}
            aria-label="Filter preset name"
          />
          <button className="btn btn--secondary" type="submit" disabled={!name.trim()}>
            Save current
          </button>
        </form>
      </div>
      {presets.length === 0 ? (
        <p className="meta-text">Save the current filters for one-click reuse on this device.</p>
      ) : (
        <div className="filter-presets__list">
          {presets.map((preset) => (
            <div key={preset.id} className="filter-presets__item">
              <button
                type="button"
                className="btn btn--chip"
                onClick={() => onApply(preset.filters)}
              >
                {preset.name}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() =>
                  setPresets(
                    deleteFilterPreset(scope, preset.id) as FilterPreset<T>[],
                  )
                }
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
