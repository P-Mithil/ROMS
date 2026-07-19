import { useMemo, useState } from "react";

type InterviewerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type InterviewerMultiSelectProps = {
  value: string[];
  options: InterviewerOption[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export function InterviewerMultiSelect({
  value,
  options,
  onChange,
  disabled = false,
}: InterviewerMultiSelectProps) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      options.filter((option) => {
        if (selectedSet.has(option.id)) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack =
          `${option.firstName} ${option.lastName} ${option.email}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [normalizedQuery, options, selectedSet],
  );

  const selectedOptions = options.filter((option) => selectedSet.has(option.id));

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }

    onChange([...value, id]);
  }

  return (
    <div className="form-field">
      <span className="form-field__label">Interviewers</span>
      <div className="skills-picker">
        <input
          className="form-field__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search interviewers"
          disabled={disabled}
        />

        {selectedOptions.length > 0 ? (
          <div className="skills-picker__selected">
            {selectedOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="badge badge--skill"
                disabled={disabled}
                onClick={() => toggle(option.id)}
              >
                {option.firstName} {option.lastName} x
              </button>
            ))}
          </div>
        ) : (
          <p className="meta-text">Select at least one interviewer.</p>
        )}

        {filtered.length > 0 ? (
          <div className="skills-picker__results">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                className="skills-picker__option"
                disabled={disabled}
                onClick={() => toggle(option.id)}
              >
                {option.firstName} {option.lastName} ({option.email})
              </button>
            ))}
          </div>
        ) : options.length === 0 ? (
          <p className="meta-text meta-text--danger">
            No interviewers found. Seed demo users or create an INTERVIEWER user
            first.
          </p>
        ) : (
          <p className="meta-text">
            No matches. Clear the search and click a name from the list to
            select them.
          </p>
        )}
      </div>
    </div>
  );
}
