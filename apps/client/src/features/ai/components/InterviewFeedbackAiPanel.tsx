import { useState } from "react";
import type { AiFeedbackIntelligenceResult } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { summarizeInterviewFeedback } from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type InterviewFeedbackAiPanelProps = {
  interviewId: string;
  onApplySummary: (summary: string) => void;
};

export function InterviewFeedbackAiPanel({
  interviewId,
  onApplySummary,
}: InterviewFeedbackAiPanelProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiFeedbackIntelligenceResult | null>(
    null,
  );

  return (
    <AiPanel title="Interview intelligence" error={error} loading={loading}>
      <AiButton
        label="Feedback summary"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setError(null);
          void summarizeInterviewFeedback(interviewId)
            .then((data) => setResult(data))
            .catch((err) => {
              const message = formatAiError(err);
              setError(message);
              showToast(message, "error");
            })
            .finally(() => setLoading(false));
        }}
      />

      {result ? (
        <div className="ai-result">
          <h3>Consensus</h3>
          <p>{result.consensus}</p>
          <h3>Summary</h3>
          <p>{result.summary}</p>
          <p className="meta-text">
            Based on {result.interviewerCount} interviewer
            {result.interviewerCount === 1 ? "" : "s"}
          </p>
          {result.strengths.length > 0 ? (
            <>
              <h4>Strengths</h4>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {result.concerns.length > 0 ? (
            <>
              <h4>Concerns</h4>
              <ul>
                {result.concerns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="button-row">
            <AiButton
              label="Apply to panel summary"
              onClick={() => {
                const text = [
                  result.consensus,
                  "",
                  result.summary,
                  result.strengths.length
                    ? `\nStrengths:\n${result.strengths.map((s) => `• ${s}`).join("\n")}`
                    : "",
                  result.concerns.length
                    ? `\nConcerns:\n${result.concerns.map((c) => `• ${c}`).join("\n")}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n");
                onApplySummary(text);
                showToast(
                  "Applied to panel summary draft — save to persist.",
                );
              }}
            />
            <AiButton
              label="Copy"
              variant="ghost"
              onClick={() =>
                void copyText(
                  `${result.consensus}\n\n${result.summary}`,
                ).then(() => showToast("Feedback summary copied."))
              }
            />
          </div>
        </div>
      ) : null}
    </AiPanel>
  );
}
