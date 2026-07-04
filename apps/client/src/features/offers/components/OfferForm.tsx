import { FormEvent, useState } from "react";
import type {
  CreateOfferRequest,
  EmploymentType,
  UpdateOfferRequest,
  WorkMode,
} from "@roms/shared";
import {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  createOfferSchema,
  updateOfferSchema,
} from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";

export type OfferFormValues = {
  candidateId: string;
  jobTitle: string;
  employmentType: EmploymentType | "";
  workMode: WorkMode | "";
  baseSalary: string;
  currency: string;
  joiningDate: string;
  validUntil: string;
  terms: string;
  internalNotes: string;
};

type OfferFormProps = {
  mode: "create" | "edit";
  initialValues?: OfferFormValues;
  lockedCandidate?: {
    id: string;
    fullName: string;
    email: string;
  };
  submitLabel: string;
  onSubmit: (
    values: CreateOfferRequest | UpdateOfferRequest,
  ) => Promise<void>;
  onCancel: () => void;
};

const emptyValues: OfferFormValues = {
  candidateId: "",
  jobTitle: "",
  employmentType: "",
  workMode: "",
  baseSalary: "",
  currency: "INR",
  joiningDate: "",
  validUntil: "",
  terms: "",
  internalNotes: "",
};

function toIsoDateTime(localValue: string) {
  return new Date(localValue).toISOString();
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function OfferForm({
  mode,
  initialValues,
  lockedCandidate,
  submitLabel,
  onSubmit,
  onCancel,
}: OfferFormProps) {
  const [values, setValues] = useState<OfferFormValues>(
    initialValues ?? {
      ...emptyValues,
      candidateId: lockedCandidate?.id ?? "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof OfferFormValues>(
    key: K,
    value: OfferFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "create") {
        const payload = {
          candidateId: lockedCandidate?.id ?? values.candidateId,
          jobTitle: values.jobTitle.trim() || undefined,
          employmentType: values.employmentType || undefined,
          workMode: values.workMode || undefined,
          baseSalary: Number(values.baseSalary),
          currency: values.currency.trim() || undefined,
          joiningDate: values.joiningDate,
          validUntil: toIsoDateTime(values.validUntil),
          terms: values.terms.trim() || undefined,
          internalNotes: values.internalNotes.trim() || undefined,
        };

        const parsed = createOfferSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid input");
          return;
        }

        await onSubmit(parsed.data);
        return;
      }

      const payload = {
        jobTitle: values.jobTitle.trim() || undefined,
        employmentType: values.employmentType || undefined,
        workMode: values.workMode || undefined,
        baseSalary: values.baseSalary ? Number(values.baseSalary) : undefined,
        currency: values.currency.trim() || undefined,
        joiningDate: values.joiningDate || undefined,
        validUntil: values.validUntil
          ? toIsoDateTime(values.validUntil)
          : undefined,
        terms: values.terms.trim() || null,
        internalNotes: values.internalNotes.trim() || null,
      };

      const parsed = updateOfferSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid input");
        return;
      }

      await onSubmit(parsed.data);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to save offer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form card" onSubmit={handleSubmit}>
      {lockedCandidate ? (
        <div className="form-field">
          <span className="form-field__label">Candidate</span>
          <p className="meta-text">
            {lockedCandidate.fullName} ({lockedCandidate.email})
          </p>
        </div>
      ) : null}

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Job title</span>
          <input
            className="form-field__input"
            value={values.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            placeholder="Defaults to requisition title"
          />
        </label>

        <label className="form-field">
          <span className="form-field__label">Base salary</span>
          <input
            className="form-field__input"
            type="number"
            min="1"
            required
            value={values.baseSalary}
            onChange={(event) => updateField("baseSalary", event.target.value)}
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
              updateField(
                "employmentType",
                event.target.value as EmploymentType | "",
              )
            }
          >
            <option value="">Use requisition default</option>
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
              updateField("workMode", event.target.value as WorkMode | "")
            }
          >
            <option value="">Use requisition default</option>
            {WORK_MODES.map((modeValue) => (
              <option key={modeValue} value={modeValue}>
                {modeValue.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Currency</span>
          <input
            className="form-field__input"
            maxLength={3}
            value={values.currency}
            onChange={(event) =>
              updateField("currency", event.target.value.toUpperCase())
            }
          />
        </label>

        <label className="form-field">
          <span className="form-field__label">Joining date</span>
          <input
            className="form-field__input"
            type="date"
            required
            value={values.joiningDate}
            onChange={(event) => updateField("joiningDate", event.target.value)}
          />
        </label>
      </div>

      <label className="form-field">
        <span className="form-field__label">Valid until</span>
        <input
          className="form-field__input"
          type="datetime-local"
          required
          value={values.validUntil}
          onChange={(event) => updateField("validUntil", event.target.value)}
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Terms (visible to candidate)</span>
        <textarea
          className="form-field__textarea"
          rows={4}
          value={values.terms}
          onChange={(event) => updateField("terms", event.target.value)}
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Internal notes</span>
        <textarea
          className="form-field__textarea"
          rows={3}
          value={values.internalNotes}
          onChange={(event) => updateField("internalNotes", event.target.value)}
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

export function offerDtoToFormValues(offer: {
  jobTitle: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  baseSalary: number;
  currency: string;
  joiningDate: string;
  validUntil: string;
  terms: string | null;
  internalNotes: string | null;
  candidate: { id: string };
}): OfferFormValues {
  return {
    candidateId: offer.candidate.id,
    jobTitle: offer.jobTitle,
    employmentType: offer.employmentType,
    workMode: offer.workMode,
    baseSalary: String(offer.baseSalary),
    currency: offer.currency,
    joiningDate: offer.joiningDate,
    validUntil: toLocalDateTimeInput(offer.validUntil),
    terms: offer.terms ?? "",
    internalNotes: offer.internalNotes ?? "",
  };
}
