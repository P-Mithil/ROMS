import { FormEvent, useEffect, useState } from "react";
import type {
  CreateCandidateRequest,
  UpdateCandidateRequest,
} from "@roms/shared";
import {
  createCandidateSchema,
  updateCandidateSchema,
} from "@roms/shared";
import { SkillsMultiSelect } from "../../../components/form/SkillsMultiSelect.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { stringifySkills } from "../../../lib/skills.js";
import { listRequisitions } from "../../requisitions/api/requisitions-api.js";

export type CandidateFormValues = {
  requisitionId: string;
  fullName: string;
  email: string;
  phone: string;
  totalExperienceYears: string;
  skills: string[];
  currentCompany: string;
  currentLocation: string;
  noticePeriodDays: string;
  notes: string;
};

type CandidateFormProps = {
  mode: "create" | "edit";
  initialValues?: CandidateFormValues;
  readOnlyRequisitionTitle?: string;
  submitLabel: string;
  allowResume?: boolean;
  onSubmit: (
    values: CreateCandidateRequest | UpdateCandidateRequest,
    resumeFile: File | null,
  ) => Promise<void>;
  onCancel: () => void;
};

const emptyValues: CandidateFormValues = {
  requisitionId: "",
  fullName: "",
  email: "",
  phone: "",
  totalExperienceYears: "",
  skills: [],
  currentCompany: "",
  currentLocation: "",
  noticePeriodDays: "",
  notes: "",
};

export function CandidateForm({
  mode,
  initialValues,
  readOnlyRequisitionTitle,
  submitLabel,
  allowResume = false,
  onSubmit,
  onCancel,
}: CandidateFormProps) {
  const [values, setValues] = useState<CandidateFormValues>(
    initialValues ?? emptyValues,
  );
  const [openRequisitions, setOpenRequisitions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loadingLookups, setLoadingLookups] = useState(mode === "create");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CandidateFormValues, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    let cancelled = false;

    async function loadOpenRequisitions() {
      try {
        const result = await listRequisitions({
          page: 1,
          limit: 100,
          status: "OPEN",
        });

        if (!cancelled) {
          setOpenRequisitions(
            result.items.map((item) => ({ id: item.id, title: item.title })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load open requisitions";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingLookups(false);
        }
      }
    }

    void loadOpenRequisitions();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  function updateField<K extends keyof CandidateFormValues>(
    field: K,
    value: CandidateFormValues[K],
  ) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setValues((current) => ({ ...current, [field]: value }));
  }

  function buildPayload() {
    if (mode === "create") {
      return {
        requisitionId: values.requisitionId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        totalExperienceYears: values.totalExperienceYears
          ? Number(values.totalExperienceYears)
          : undefined,
        skills: stringifySkills(values.skills),
        currentCompany: values.currentCompany || undefined,
        currentLocation: values.currentLocation || undefined,
        noticePeriodDays: values.noticePeriodDays
          ? Number(values.noticePeriodDays)
          : undefined,
        notes: values.notes || undefined,
      };
    }

    return {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      totalExperienceYears: values.totalExperienceYears
        ? Number(values.totalExperienceYears)
        : null,
      skills: stringifySkills(values.skills) ?? null,
      currentCompany: values.currentCompany || null,
      currentLocation: values.currentLocation || null,
      noticePeriodDays: values.noticePeriodDays
        ? Number(values.noticePeriodDays)
        : null,
      notes: values.notes || null,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = buildPayload();
    const schema =
      mode === "create" ? createCandidateSchema : updateCandidateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      const nextFieldErrors: Partial<Record<keyof CandidateFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in nextFieldErrors)) {
          nextFieldErrors[field as keyof CandidateFormValues] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data, resumeFile);
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
      <div className="form-section">
        <div>
          <h2 className="form-section__title">Personal Information</h2>
          <p className="form-section__subtitle">
            Capture the candidate's basic contact details.
          </p>
        </div>

      {mode === "create" ? (
        <label className="form-field">
          <span className="form-field__label">Requisition</span>
          <select
            className="form-field__input"
            value={values.requisitionId}
            onChange={(event) =>
              updateField("requisitionId", event.target.value)
            }
            required
          >
            <option value="">Select open requisition</option>
            {openRequisitions.map((requisition) => (
              <option key={requisition.id} value={requisition.id}>
                {requisition.title}
              </option>
            ))}
          </select>
          {openRequisitions.length === 0 ? (
            <p className="meta-text">
              No open requisitions available. Candidates can only be added to
              open requisitions.
            </p>
          ) : null}
          {fieldErrors.requisitionId ? (
            <p className="form-error">{fieldErrors.requisitionId}</p>
          ) : null}
        </label>
      ) : (
        <div className="card card--muted">
          <dl className="detail-list">
            <div>
              <dt>Requisition</dt>
              <dd>{readOnlyRequisitionTitle ?? "—"}</dd>
            </div>
          </dl>
        </div>
      )}

      <label className="form-field">
        <span className="form-field__label">Full name</span>
        <input
          className="form-field__input"
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          required
          maxLength={150}
        />
        {fieldErrors.fullName ? (
          <p className="form-error">{fieldErrors.fullName}</p>
        ) : null}
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Email</span>
          <input
            className="form-field__input"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
            maxLength={255}
          />
          {fieldErrors.email ? (
            <p className="form-error">{fieldErrors.email}</p>
          ) : null}
        </label>

        <label className="form-field">
          <span className="form-field__label">Phone</span>
          <input
            className="form-field__input"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
            maxLength={30}
          />
          {fieldErrors.phone ? (
            <p className="form-error">{fieldErrors.phone}</p>
          ) : null}
        </label>
      </div>
      </div>

      <div className="form-section">
        <div>
          <h2 className="form-section__title">Professional Information</h2>
          <p className="form-section__subtitle">
            Add experience, current role context, and skill coverage.
          </p>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span className="form-field__label">Experience (years)</span>
            <input
              className="form-field__input"
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={values.totalExperienceYears}
              onChange={(event) =>
                updateField("totalExperienceYears", event.target.value)
              }
            />
            {fieldErrors.totalExperienceYears ? (
              <p className="form-error">{fieldErrors.totalExperienceYears}</p>
            ) : null}
          </label>

          <label className="form-field">
            <span className="form-field__label">Notice period (days)</span>
            <input
              className="form-field__input"
              type="number"
              min={0}
              max={3650}
              value={values.noticePeriodDays}
              onChange={(event) =>
                updateField("noticePeriodDays", event.target.value)
              }
            />
            {fieldErrors.noticePeriodDays ? (
              <p className="form-error">{fieldErrors.noticePeriodDays}</p>
            ) : null}
          </label>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span className="form-field__label">Current company</span>
            <input
              className="form-field__input"
              value={values.currentCompany}
              onChange={(event) =>
                updateField("currentCompany", event.target.value)
              }
              maxLength={150}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Current location</span>
            <input
              className="form-field__input"
              value={values.currentLocation}
              onChange={(event) =>
                updateField("currentLocation", event.target.value)
              }
              maxLength={150}
            />
          </label>
        </div>

        <SkillsMultiSelect
          value={values.skills}
          onChange={(next) => updateField("skills", next)}
        />

        <label className="form-field">
          <span className="form-field__label">Profile notes</span>
          <textarea
            className="form-field__textarea"
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            maxLength={5000}
          />
        </label>
      </div>

      {allowResume ? (
        <div className="form-section">
          <div>
            <h2 className="form-section__title">Resume</h2>
            <p className="form-section__subtitle">
              Upload a PDF or Word document. You can replace it later.
            </p>
          </div>

          <label className="form-field">
            <span className="form-field__label">Resume (PDF or Word)</span>
            <input
              className="form-field__input"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setResumeFile(file);
              }}
            />
          </label>
        </div>
      ) : null}

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
