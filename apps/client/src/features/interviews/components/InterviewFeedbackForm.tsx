import { FormEvent, useEffect, useState } from "react";
import type {
  CreateInterviewFeedbackRequest,
  InterviewFeedbackDto,
  InterviewRecommendation,
} from "@roms/shared";
import {
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_RECOMMENDATION_LABELS,
  createInterviewFeedbackSchema,
} from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { submitInterviewFeedback } from "../api/interviews-api.js";

export type InterviewFeedbackFormValues = {
  rating: string;
  recommendation: InterviewRecommendation | "";
  strengths: string;
  concerns: string;
  summary: string;
};

type InterviewFeedbackFormProps = {
  interviewId: string;
  existingFeedback?: InterviewFeedbackDto;
  onSubmitted: (interview: Awaited<ReturnType<typeof submitInterviewFeedback>>["interview"]) => void;
};

const emptyValues: InterviewFeedbackFormValues = {
  rating: "",
  recommendation: "",
  strengths: "",
  concerns: "",
  summary: "",
};

function toFormValues(
  feedback: InterviewFeedbackDto | undefined,
): InterviewFeedbackFormValues {
  if (!feedback) {
    return emptyValues;
  }

  return {
    rating: feedback.rating != null ? String(feedback.rating) : "",
    recommendation:
      feedback.recommendation &&
      INTERVIEW_RECOMMENDATIONS.includes(
        feedback.recommendation as InterviewRecommendation,
      )
        ? (feedback.recommendation as InterviewRecommendation)
        : "",
    strengths: feedback.strengths ?? "",
    concerns: feedback.concerns ?? "",
    summary: feedback.summary ?? "",
  };
}

export function InterviewFeedbackForm({
  interviewId,
  existingFeedback,
  onSubmitted,
}: InterviewFeedbackFormProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<InterviewFeedbackFormValues>(
    toFormValues(existingFeedback),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof InterviewFeedbackFormValues, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(toFormValues(existingFeedback));
  }, [existingFeedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload: CreateInterviewFeedbackRequest = {
      rating: values.rating ? Number(values.rating) : undefined,
      recommendation: values.recommendation || undefined,
      strengths: values.strengths.trim() || undefined,
      concerns: values.concerns.trim() || undefined,
      summary: values.summary.trim() || undefined,
    };

    const parsed = createInterviewFeedbackSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof InterviewFeedbackFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key as keyof InterviewFeedbackFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setError("Please provide at least one feedback field.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitInterviewFeedback(interviewId, parsed.data);
      onSubmitted(result.interview);
      showToast(
        existingFeedback ? "Feedback updated." : "Feedback submitted.",
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to save feedback";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Rating</span>
          <select
            className="form-field__input"
            value={values.rating}
            onChange={(event) =>
              setValues((current) => ({ ...current, rating: event.target.value }))
            }
          >
            <option value="">Not rated</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={String(rating)}>
                {rating} / 5
              </option>
            ))}
          </select>
          {fieldErrors.rating ? (
            <span className="form-field__error">{fieldErrors.rating}</span>
          ) : null}
        </label>

        <label className="form-field">
          <span className="form-field__label">Recommendation</span>
          <select
            className="form-field__input"
            value={values.recommendation}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                recommendation: event.target.value as InterviewRecommendation | "",
              }))
            }
          >
            <option value="">Select recommendation</option>
            {INTERVIEW_RECOMMENDATIONS.map((recommendation) => (
              <option key={recommendation} value={recommendation}>
                {INTERVIEW_RECOMMENDATION_LABELS[recommendation]}
              </option>
            ))}
          </select>
          {fieldErrors.recommendation ? (
            <span className="form-field__error">{fieldErrors.recommendation}</span>
          ) : null}
        </label>
      </div>

      <label className="form-field">
        <span className="form-field__label">Summary</span>
        <textarea
          className="form-field__textarea"
          value={values.summary}
          onChange={(event) =>
            setValues((current) => ({ ...current, summary: event.target.value }))
          }
          rows={3}
          maxLength={5000}
          placeholder="Overall hiring recommendation and key takeaways"
        />
        {fieldErrors.summary ? (
          <span className="form-field__error">{fieldErrors.summary}</span>
        ) : null}
      </label>

      <label className="form-field">
        <span className="form-field__label">Strengths</span>
        <textarea
          className="form-field__textarea"
          value={values.strengths}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              strengths: event.target.value,
            }))
          }
          rows={3}
          maxLength={5000}
        />
        {fieldErrors.strengths ? (
          <span className="form-field__error">{fieldErrors.strengths}</span>
        ) : null}
      </label>

      <label className="form-field">
        <span className="form-field__label">Concerns</span>
        <textarea
          className="form-field__textarea"
          value={values.concerns}
          onChange={(event) =>
            setValues((current) => ({ ...current, concerns: event.target.value }))
          }
          rows={3}
          maxLength={5000}
        />
        {fieldErrors.concerns ? (
          <span className="form-field__error">{fieldErrors.concerns}</span>
        ) : null}
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions form-actions--left">
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting
            ? "Saving…"
            : existingFeedback
              ? "Update feedback"
              : "Submit feedback"}
        </button>
      </div>
    </form>
  );
}
