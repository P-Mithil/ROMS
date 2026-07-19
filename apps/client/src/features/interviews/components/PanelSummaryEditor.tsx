import { FormEvent, useEffect, useState } from "react";
import type { InterviewDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { updatePanelSummary } from "../api/interviews-api.js";

type PanelSummaryEditorProps = {
  interview: InterviewDto;
  onUpdated: (interview: InterviewDto) => void;
  aiSummaryDraft?: string | null;
  onAiSummaryConsumed?: () => void;
};

export function PanelSummaryEditor({
  interview,
  onUpdated,
  aiSummaryDraft,
  onAiSummaryConsumed,
}: PanelSummaryEditorProps) {
  const { showToast } = useToast();
  const [value, setValue] = useState(interview.feedbackSummary ?? "");
  const [fromAi, setFromAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValue(interview.feedbackSummary ?? "");
    setFromAi(false);
  }, [interview.feedbackSummary]);

  useEffect(() => {
    if (!aiSummaryDraft) {
      return;
    }
    setValue(aiSummaryDraft);
    setFromAi(true);
    onAiSummaryConsumed?.();
  }, [aiSummaryDraft, onAiSummaryConsumed]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const updated = await updatePanelSummary(interview.id, {
        feedbackSummary: value.trim() || null,
      });
      onUpdated(updated);
      showToast("Panel summary saved.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Unable to save panel summary";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack-sm panel-summary-editor" onSubmit={handleSubmit}>
      <p className="meta-text">
        Short rollup for hiring managers after interviewer feedback is collected.
      </p>
      <label className="form-field">
        <span className="form-field__label-row">
          <span className="form-field__label">Panel summary</span>
          {fromAi ? (
            <span className="ai-field-hint">
              <span className="ai-badge">AI</span> draft applied
            </span>
          ) : null}
        </span>
        <textarea
          className={`form-field__textarea${fromAi ? " form-field__textarea--ai" : ""}`}
          value={value}
          onChange={(event) => {
            setFromAi(false);
            setValue(event.target.value);
          }}
          rows={4}
          maxLength={5000}
          placeholder="Summarize the panel decision and next steps"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions form-actions--left">
        <button className="btn btn--secondary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save panel summary"}
        </button>
      </div>
    </form>
  );
}
