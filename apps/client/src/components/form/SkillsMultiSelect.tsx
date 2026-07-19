import { useMemo, useState } from "react";
import { COMMON_SKILLS } from "@roms/shared";
import {
  SKILL_CATEGORIES,
  categorizeSkill,
  type SkillCategory,
} from "../../lib/skill-categories.js";
import { FormHint } from "../ui/FormHint.js";
import { Icon } from "../ui/Icon.js";

type SkillsMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
};

export function SkillsMultiSelect({
  value,
  onChange,
  label = "Skills",
  placeholder = "Search the skills library or add a custom skill",
  hint = "Pick from the library for consistency, or add a custom skill when needed.",
}: SkillsMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SkillCategory | "ALL">("ALL");

  const normalizedQuery = query.trim().toLowerCase();
  const selectedSet = useMemo(
    () => new Set(value.map((item) => item.toLowerCase())),
    [value],
  );

  const filtered = useMemo(() => {
    return COMMON_SKILLS.filter((skill) => {
      if (selectedSet.has(skill.toLowerCase())) {
        return false;
      }
      if (category !== "ALL" && categorizeSkill(skill) !== category) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return skill.toLowerCase().includes(normalizedQuery);
    }).slice(0, 18);
  }, [category, normalizedQuery, selectedSet]);

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
      {hint ? <FormHint>{hint}</FormHint> : null}
      <div className="skills-picker">
        <div className="skills-picker__toolbar">
          <label className="skills-picker__search">
            <Icon name="search" />
            <input
              className="form-field__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              aria-label={label}
            />
          </label>
          <select
            className="form-field__input skills-picker__category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SkillCategory | "ALL")
            }
            aria-label="Skill category"
          >
            <option value="ALL">All categories</option>
            {SKILL_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {value.length > 0 ? (
          <div className="skills-picker__selected" aria-label="Selected skills">
            {value.map((skill) => (
              <button
                key={skill}
                type="button"
                className="badge badge--skill"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
              >
                {skill} <Icon name="x" />
              </button>
            ))}
          </div>
        ) : (
          <p className="meta-text">No skills selected yet.</p>
        )}

        {filtered.length > 0 || canAddCustom ? (
          <div className="skills-picker__results" role="listbox" aria-label="Skill suggestions">
            {filtered.map((skill) => (
              <button
                key={skill}
                type="button"
                className="skills-picker__option"
                onClick={() => addSkill(skill)}
                role="option"
              >
                <span>{skill}</span>
                <span className="skills-picker__option-meta">
                  {categorizeSkill(skill)}
                </span>
              </button>
            ))}
            {canAddCustom ? (
              <button
                type="button"
                className="skills-picker__option skills-picker__option--custom"
                onClick={() => addSkill(query.trim())}
              >
                Add custom “{query.trim()}”
              </button>
            ) : null}
          </div>
        ) : normalizedQuery ? (
          <p className="meta-text">No library matches. Add a custom skill above.</p>
        ) : null}
      </div>
    </div>
  );
}
