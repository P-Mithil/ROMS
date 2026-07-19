import { FormEvent, useEffect, useState } from "react";
import type { DepartmentDto, ReportFiltersInput } from "@roms/shared";
import { REPORT_DATE_PRESETS } from "@roms/shared";
import { apiGet } from "../../../lib/api-client.js";
import { filtersFromPreset } from "../utils/report-labels.js";

type ReportFiltersProps = {
  value: ReportFiltersInput;
  onChange: (value: ReportFiltersInput) => void;
  showSearch?: boolean;
};

export function ReportFiltersBar({
  value,
  onChange,
  showSearch = false,
}: ReportFiltersProps) {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const items = await apiGet<DepartmentDto[]>("/departments");
        if (!cancelled) {
          setDepartments(items);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onChange({
      ...draft,
      search: draft.search?.trim() || undefined,
      departmentId: draft.departmentId || undefined,
      requisitionId: draft.requisitionId || undefined,
    });
  }

  return (
    <form className="card filters-card" onSubmit={handleSubmit}>
      <div className="filters-row">
        <label className="form-field form-field--inline">
          <span className="form-field__label">From</span>
          <input
            className="form-field__input"
            type="date"
            value={draft.dateFrom ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dateFrom: event.target.value,
              }))
            }
          />
        </label>
        <label className="form-field form-field--inline">
          <span className="form-field__label">To</span>
          <input
            className="form-field__input"
            type="date"
            value={draft.dateTo ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dateTo: event.target.value,
              }))
            }
          />
        </label>
        <label className="form-field form-field--inline">
          <span className="form-field__label">Department</span>
          <select
            className="form-field__input"
            value={draft.departmentId ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                departmentId: event.target.value || undefined,
              }))
            }
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        {showSearch ? (
          <label className="form-field form-field--search">
            <span className="form-field__label">Search</span>
            <input
              className="form-field__input"
              value={draft.search ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Name, email…"
            />
          </label>
        ) : null}
      </div>

      <div className="button-row" style={{ marginTop: "0.75rem" }}>
        {REPORT_DATE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              const next = {
                ...draft,
                ...filtersFromPreset(preset),
              };
              setDraft(next);
              onChange(next);
            }}
          >
            {preset.replaceAll("_", " ").toLowerCase()}
          </button>
        ))}
        <button className="btn btn--primary" type="submit">
          Apply filters
        </button>
      </div>
    </form>
  );
}
