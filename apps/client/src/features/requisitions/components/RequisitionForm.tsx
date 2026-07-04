import { FormEvent, useEffect, useState } from "react";
import type {
  CreateRequisitionRequest,
  EmploymentType,
  HiringPriority,
  UpdateRequisitionRequest,
  WorkMode,
} from "@roms/shared";
import {
  EMPLOYMENT_TYPES,
  HIRING_PRIORITIES,
  WORK_MODES,
  createRequisitionSchema,
  updateRequisitionSchema,
} from "@roms/shared";
import { SkillsMultiSelect } from "../../../components/form/SkillsMultiSelect.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { stringifySkills } from "../../../lib/skills.js";
import { listDepartments, listHiringManagers } from "../api/lookups-api.js";

export type RequisitionFormValues = {
  title: string;
  description: string;
  skills: string[];
  departmentId: string;
  hiringManagerId: string;
  hiringPriority: HiringPriority;
  openings: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salaryMin: string;
  salaryMax: string;
  experienceMin: string;
  experienceMax: string;
};

type RequisitionFormProps = {
  mode: "create" | "edit";
  initialValues?: RequisitionFormValues;
  submitLabel: string;
  descriptionOnly?: boolean;
  readOnlyDetails?: {
    departmentName: string;
    hiringManagerName: string;
  };
  onSubmit: (
    values: CreateRequisitionRequest | UpdateRequisitionRequest,
  ) => Promise<void>;
  onCancel: () => void;
};

const emptyValues: RequisitionFormValues = {
  title: "",
  description: "",
  skills: [],
  departmentId: "",
  hiringManagerId: "",
  hiringPriority: "MEDIUM",
  openings: "1",
  employmentType: "FULL_TIME",
  workMode: "HYBRID",
  salaryMin: "",
  salaryMax: "",
  experienceMin: "",
  experienceMax: "",
};

export function RequisitionForm({
  mode,
  initialValues,
  submitLabel,
  descriptionOnly = false,
  readOnlyDetails,
  onSubmit,
  onCancel,
}: RequisitionFormProps) {
  const [values, setValues] = useState<RequisitionFormValues>(
    initialValues ?? emptyValues,
  );
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [hiringManagers, setHiringManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RequisitionFormValues, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    if (descriptionOnly) {
      setLoadingLookups(false);
      return;
    }

    let cancelled = false;

    async function loadLookups() {
      try {
        const [deptData, hmData] = await Promise.all([
          listDepartments(),
          listHiringManagers(),
        ]);

        if (!cancelled) {
          setDepartments(deptData);
          setHiringManagers(hmData);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load form options";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingLookups(false);
        }
      }
    }

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [descriptionOnly]);

  function updateField<K extends keyof RequisitionFormValues>(
    field: K,
    value: RequisitionFormValues[K],
  ) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (descriptionOnly) {
      setSubmitting(true);
      try {
        await onSubmit({ description: values.description || null });
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : "Save failed";
        setError(message);
        setSubmitting(false);
      }
      return;
    }

    const payload =
      mode === "create"
        ? {
            title: values.title,
            description: values.description || undefined,
            skills: stringifySkills(values.skills),
            departmentId: values.departmentId,
            hiringManagerId: values.hiringManagerId,
            hiringPriority: values.hiringPriority,
            openings: Number(values.openings),
            employmentType: values.employmentType,
            workMode: values.workMode,
            salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
            salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
            experienceMin: values.experienceMin
              ? Number(values.experienceMin)
              : undefined,
            experienceMax: values.experienceMax
              ? Number(values.experienceMax)
              : undefined,
          }
        : {
            title: values.title,
            description: values.description || null,
            skills: stringifySkills(values.skills) ?? null,
            departmentId: values.departmentId,
            hiringManagerId: values.hiringManagerId,
            hiringPriority: values.hiringPriority,
            openings: Number(values.openings),
            employmentType: values.employmentType,
            workMode: values.workMode,
            salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
            salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
            experienceMin: values.experienceMin
              ? Number(values.experienceMin)
              : null,
            experienceMax: values.experienceMax
              ? Number(values.experienceMax)
              : null,
          };

    const schema =
      mode === "create" ? createRequisitionSchema : updateRequisitionSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      const nextFieldErrors: Partial<Record<keyof RequisitionFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in nextFieldErrors)) {
          nextFieldErrors[field as keyof RequisitionFormValues] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Save failed";
      setError(message);
      setSubmitting(false);
    }
  }

  if (loadingLookups) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading form…</span>
      </div>
    );
  }

  return (
    <form className="form card" onSubmit={handleSubmit}>
      {descriptionOnly ? (
        <div className="card card--muted">
          <dl className="detail-list">
            <div>
              <dt>Title</dt>
              <dd>{values.title}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{readOnlyDetails?.departmentName ?? "—"}</dd>
            </div>
            <div>
              <dt>Hiring manager</dt>
              <dd>{readOnlyDetails?.hiringManagerName ?? "—"}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{values.hiringPriority.replaceAll("_", " ")}</dd>
            </div>
          </dl>
          <p className="meta-text">
            These fields are locked after approval. Only the description can be
            updated while a requisition is open.
          </p>
        </div>
      ) : (
        <div className="form-section">
          <div>
            <h2 className="form-section__title">Requisition Basics</h2>
            <p className="form-section__subtitle">
              Define ownership, hiring urgency, and role expectations.
            </p>
          </div>

          <label className="form-field">
            <span className="form-field__label">Title</span>
            <input
              className="form-field__input"
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
              maxLength={200}
            />
            {fieldErrors.title ? <p className="form-error">{fieldErrors.title}</p> : null}
          </label>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Department</span>
              <select
                className="form-field__input"
                value={values.departmentId}
                onChange={(event) => updateField("departmentId", event.target.value)}
                required
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-field__label">Hiring manager</span>
              <select
                className="form-field__input"
                value={values.hiringManagerId}
                onChange={(event) =>
                  updateField("hiringManagerId", event.target.value)
                }
                required
              >
                <option value="">Select hiring manager</option>
                {hiringManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} ({manager.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Hiring priority</span>
              <select
                className="form-field__input"
                value={values.hiringPriority}
                onChange={(event) =>
                  updateField("hiringPriority", event.target.value as HiringPriority)
                }
              >
                {HIRING_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-field__label">Openings</span>
              <input
                className="form-field__input"
                type="number"
                min={1}
                max={500}
                value={values.openings}
                onChange={(event) => updateField("openings", event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Employment type</span>
              <select
                className="form-field__input"
                value={values.employmentType}
                onChange={(event) =>
                  updateField("employmentType", event.target.value as EmploymentType)
                }
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-field__label">Work mode</span>
              <select
                className="form-field__input"
                value={values.workMode}
                onChange={(event) =>
                  updateField("workMode", event.target.value as WorkMode)
                }
              >
                {WORK_MODES.map((modeOption) => (
                  <option key={modeOption} value={modeOption}>
                    {modeOption.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Salary minimum</span>
              <input
                className="form-field__input"
                type="number"
                min={0}
                value={values.salaryMin}
                onChange={(event) => updateField("salaryMin", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-field__label">Salary maximum</span>
              <input
                className="form-field__input"
                type="number"
                min={0}
                value={values.salaryMax}
                onChange={(event) => updateField("salaryMax", event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Experience minimum</span>
              <input
                className="form-field__input"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={values.experienceMin}
                onChange={(event) => updateField("experienceMin", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-field__label">Experience maximum</span>
              <input
                className="form-field__input"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={values.experienceMax}
                onChange={(event) => updateField("experienceMax", event.target.value)}
              />
            </label>
          </div>

          <SkillsMultiSelect
            value={values.skills}
            onChange={(next) => updateField("skills", next)}
            label="Required skills"
          />
        </div>
      )}

      <label className="form-field">
        <span className="form-field__label">Description</span>
        <textarea
          className="form-field__textarea"
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          rows={5}
          maxLength={5000}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button
          className="btn btn--secondary"
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
