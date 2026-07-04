import { FormEvent, useEffect, useState } from "react";
import type {
  CreateInterviewRequest,
  InterviewMode,
  InterviewRoundType,
  UpdateInterviewRequest,
} from "@roms/shared";
import {
  INTERVIEW_MODES,
  INTERVIEW_ROUND_TYPES,
  createInterviewSchema,
  updateInterviewSchema,
} from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { listCandidates } from "../../candidates/api/candidates-api.js";
import { listInterviewers } from "../api/lookups-api.js";
import { InterviewerMultiSelect } from "./InterviewerMultiSelect.js";

export type InterviewFormValues = {
  candidateId: string;
  roundType: InterviewRoundType;
  customRoundLabel: string;
  scheduledAt: string;
  durationMinutes: string;
  mode: InterviewMode;
  location: string;
  meetingLink: string;
  instructions: string;
  interviewerIds: string[];
};

type InterviewFormProps = {
  mode: "create" | "edit";
  initialValues?: InterviewFormValues;
  submitLabel: string;
  lockedCandidate?: {
    id: string;
    fullName: string;
    email: string;
  };
  onSubmit: (
    values: CreateInterviewRequest | UpdateInterviewRequest,
  ) => Promise<void>;
  onCancel: () => void;
};

const emptyValues: InterviewFormValues = {
  candidateId: "",
  roundType: "HR",
  customRoundLabel: "",
  scheduledAt: "",
  durationMinutes: "60",
  mode: "VIRTUAL",
  location: "",
  meetingLink: "",
  instructions: "",
  interviewerIds: [],
};

const ROUND_LABELS: Record<InterviewRoundType, string> = {
  HR: "HR",
  TECHNICAL: "Technical",
  MANAGERIAL: "Managerial",
  FINAL: "Final",
  CUSTOM: "Custom",
};

const MODE_LABELS: Record<InterviewMode, string> = {
  IN_PERSON: "In person",
  VIRTUAL: "Virtual",
  PHONE: "Phone",
};

function isConflictError(message: string) {
  return message.toLowerCase().includes("overlapping");
}

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string) {
  return new Date(local).toISOString();
}

export function interviewToFormValues(
  interview: {
    candidate: { id: string };
    roundType: InterviewRoundType;
    customRoundLabel: string | null;
    scheduledAt: string;
    durationMinutes: number;
    mode: InterviewMode;
    location: string | null;
    meetingLink: string | null;
    instructions: string | null;
    interviewers: Array<{ id: string }>;
  },
): InterviewFormValues {
  return {
    candidateId: interview.candidate.id,
    roundType: interview.roundType,
    customRoundLabel: interview.customRoundLabel ?? "",
    scheduledAt: toDatetimeLocalValue(interview.scheduledAt),
    durationMinutes: String(interview.durationMinutes),
    mode: interview.mode,
    location: interview.location ?? "",
    meetingLink: interview.meetingLink ?? "",
    instructions: interview.instructions ?? "",
    interviewerIds: interview.interviewers.map((person) => person.id),
  };
}

export function InterviewForm({
  mode,
  initialValues,
  submitLabel,
  lockedCandidate,
  onSubmit,
  onCancel,
}: InterviewFormProps) {
  const [values, setValues] = useState<InterviewFormValues>(
    initialValues ?? {
      ...emptyValues,
      candidateId: lockedCandidate?.id ?? "",
    },
  );
  const [shortlistedCandidates, setShortlistedCandidates] = useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);
  const [interviewers, setInterviewers] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof InterviewFormValues, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      setLoadingLookups(true);
      try {
        const [candidateResult, interviewerList] = await Promise.all([
          mode === "create" && !lockedCandidate
            ? listCandidates({
                page: 1,
                limit: 100,
                status: "SHORTLISTED",
              })
            : Promise.resolve(null),
          listInterviewers(),
        ]);

        if (!cancelled) {
          if (candidateResult) {
            setShortlistedCandidates(
              candidateResult.items.map((candidate) => ({
                id: candidate.id,
                fullName: candidate.fullName,
                email: candidate.email,
              })),
            );
          }
          setInterviewers(interviewerList);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load form options.");
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
  }, [lockedCandidate, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConflictWarning(null);
    setFieldErrors({});

    const payload =
      mode === "create"
        ? {
            candidateId: values.candidateId,
            roundType: values.roundType,
            customRoundLabel: values.customRoundLabel.trim() || undefined,
            scheduledAt: fromDatetimeLocalValue(values.scheduledAt),
            durationMinutes: Number(values.durationMinutes),
            mode: values.mode,
            location: values.location.trim() || undefined,
            meetingLink: values.meetingLink.trim() || undefined,
            instructions: values.instructions.trim() || undefined,
            interviewerIds: values.interviewerIds,
          }
        : {
            roundType: values.roundType,
            customRoundLabel:
              values.roundType === "CUSTOM"
                ? values.customRoundLabel.trim() || null
                : null,
            scheduledAt: fromDatetimeLocalValue(values.scheduledAt),
            durationMinutes: Number(values.durationMinutes),
            mode: values.mode,
            location:
              values.mode === "IN_PERSON" ? values.location.trim() || null : null,
            meetingLink:
              values.mode === "VIRTUAL" ? values.meetingLink.trim() || null : null,
            instructions: values.instructions.trim() || null,
            interviewerIds: values.interviewerIds,
          };

    const parsed =
      mode === "create"
        ? createInterviewSchema.safeParse(payload)
        : updateInterviewSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof InterviewFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key as keyof InterviewFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to save interview";
      if (isConflictError(message)) {
        setConflictWarning(message);
      }
      setError(message);
    } finally {
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
    <form className="card form-card" onSubmit={handleSubmit}>
      {conflictWarning ? (
        <div className="conflict-warning" role="alert">
          <strong>Scheduling conflict</strong>
          <p>{conflictWarning}</p>
        </div>
      ) : null}

      {mode === "create" ? (
        lockedCandidate ? (
          <div className="form-field">
            <span className="form-field__label">Candidate</span>
            <p>
              {lockedCandidate.fullName} ({lockedCandidate.email})
            </p>
          </div>
        ) : (
          <label className="form-field">
            <span className="form-field__label">Candidate</span>
            <select
              className="form-field__input"
              value={values.candidateId}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  candidateId: event.target.value,
                }))
              }
              required
            >
              <option value="">Select a shortlisted candidate</option>
              {shortlistedCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName} ({candidate.email})
                </option>
              ))}
            </select>
            {fieldErrors.candidateId ? (
              <span className="form-field__error">{fieldErrors.candidateId}</span>
            ) : null}
          </label>
        )
      ) : null}

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Round type</span>
          <select
            className="form-field__input"
            value={values.roundType}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                roundType: event.target.value as InterviewRoundType,
              }))
            }
          >
            {INTERVIEW_ROUND_TYPES.map((roundType) => (
              <option key={roundType} value={roundType}>
                {ROUND_LABELS[roundType]}
              </option>
            ))}
          </select>
        </label>

        {values.roundType === "CUSTOM" ? (
          <label className="form-field">
            <span className="form-field__label">Custom round label</span>
            <input
              className="form-field__input"
              value={values.customRoundLabel}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  customRoundLabel: event.target.value,
                }))
              }
              maxLength={100}
              required
            />
            {fieldErrors.customRoundLabel ? (
              <span className="form-field__error">
                {fieldErrors.customRoundLabel}
              </span>
            ) : null}
          </label>
        ) : null}
      </div>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Scheduled at</span>
          <input
            className="form-field__input"
            type="datetime-local"
            value={values.scheduledAt}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scheduledAt: event.target.value,
              }))
            }
            required
          />
          {fieldErrors.scheduledAt ? (
            <span className="form-field__error">{fieldErrors.scheduledAt}</span>
          ) : null}
        </label>

        <label className="form-field">
          <span className="form-field__label">Duration (minutes)</span>
          <select
            className="form-field__input"
            value={values.durationMinutes}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                durationMinutes: event.target.value,
              }))
            }
          >
            {[30, 45, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={String(minutes)}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field">
        <span className="form-field__label">Mode</span>
        <select
          className="form-field__input"
          value={values.mode}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              mode: event.target.value as InterviewMode,
            }))
          }
        >
          {INTERVIEW_MODES.map((interviewMode) => (
            <option key={interviewMode} value={interviewMode}>
              {MODE_LABELS[interviewMode]}
            </option>
          ))}
        </select>
      </label>

      {values.mode === "IN_PERSON" ? (
        <label className="form-field">
          <span className="form-field__label">Location</span>
          <input
            className="form-field__input"
            value={values.location}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                location: event.target.value,
              }))
            }
            maxLength={255}
            required
          />
          {fieldErrors.location ? (
            <span className="form-field__error">{fieldErrors.location}</span>
          ) : null}
        </label>
      ) : null}

      {values.mode === "VIRTUAL" ? (
        <label className="form-field">
          <span className="form-field__label">Meeting link</span>
          <input
            className="form-field__input"
            type="url"
            value={values.meetingLink}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                meetingLink: event.target.value,
              }))
            }
            maxLength={500}
            required
          />
          {fieldErrors.meetingLink ? (
            <span className="form-field__error">{fieldErrors.meetingLink}</span>
          ) : null}
        </label>
      ) : null}

      <label className="form-field">
        <span className="form-field__label">Instructions</span>
        <textarea
          className="form-field__textarea"
          value={values.instructions}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              instructions: event.target.value,
            }))
          }
          rows={4}
          maxLength={5000}
        />
      </label>

      <InterviewerMultiSelect
        value={values.interviewerIds}
        options={interviewers}
        onChange={(interviewerIds) =>
          setValues((current) => ({ ...current, interviewerIds }))
        }
      />
      {fieldErrors.interviewerIds ? (
        <p className="form-field__error">{fieldErrors.interviewerIds}</p>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button
          className="btn btn--secondary"
          type="button"
          disabled={submitting}
          onClick={onCancel}
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
