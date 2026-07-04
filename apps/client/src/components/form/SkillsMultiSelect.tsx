import { useMemo, useState } from "react";
import { COMMON_SKILLS } from "@roms/shared";

type SkillsMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
};

export function SkillsMultiSelect({
  value,
  onChange,
  label = "Skills",
  placeholder = "Search skills or add a custom skill",
}: SkillsMultiSelectProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(value.map((item) => item.toLowerCase())), [value]);

  const filtered = useMemo(
    () =>
      COMMON_SKILLS.filter((skill) => {
        if (selectedSet.has(skill.toLowerCase())) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return skill.toLowerCase().includes(normalizedQuery);
      }).slice(0, 12),
    [normalizedQuery, selectedSet],
  );

  const canAddCustom =
    normalizedQuery.length > 0 &&
    !value.some((skill) => skill.toLowerCase() === normalizedQuery) &&
    !COMMON_SKILLS.some((skill) => skill.toLowerCase() === normalizedQuery);

  function addSkill(skill: string) {
    onChange([...value, skill]);
    setQuery("");
  }

  function removeSkill(skill: string) {
    onChange(value.filter((item) => item !== skill));
  }

  return (
    <div className="form-field">
      <span className="form-field__label">{label}</span>
      <div className="skills-picker">
        <input
          className="form-field__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />

        {value.length > 0 ? (
          <div className="skills-picker__selected">
            {value.map((skill) => (
              <button
                key={skill}
                type="button"
                className="badge badge--skill"
                onClick={() => removeSkill(skill)}
              >
                {skill} x
              </button>
            ))}
          </div>
        ) : (
          <p className="meta-text">No skills selected yet.</p>
        )}

        {(filtered.length > 0 || canAddCustom) && (
          <div className="skills-picker__results">
            {filtered.map((skill) => (
              <button
                key={skill}
                type="button"
                className="skills-picker__option"
                onClick={() => addSkill(skill)}
              >
                {skill}
              </button>
            ))}
            {canAddCustom ? (
              <button
                type="button"
                className="skills-picker__option skills-picker__option--custom"
                onClick={() => addSkill(query.trim())}
              >
                Add "{query.trim()}"
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
