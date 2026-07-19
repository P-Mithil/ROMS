import { useState } from "react";
import type { AiInterviewQuestionsResult, InterviewRoundType } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { generateInterviewQuestions } from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type InterviewQuestionsAssistProps = {
  candidateId: string;
  roundType: InterviewRoundType;
  customRoundLabel?: string;
  onApplyInstructions: (text: string) => void;
};

export function InterviewQuestionsAssist({
  candidateId,
  roundType,
  customRoundLabel,
  onApplyInstructions,
}: InterviewQuestionsAssistProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiInterviewQuestionsResult | null>(null);

  return (
    <AiPanel title="Interview questions" error={error} loading={loading}>
      <AiButton
        label="Generate questions"
        loading={loading}
        disabled={!candidateId}
        onClick={() => {
          setLoading(true);
          setError(null);
          void generateInterviewQuestions({
            candidateId,
            roundType,
            customRoundLabel: customRoundLabel || undefined,
          })
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
          <ol>
            {result.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
          <div className="button-row">
            <AiButton
              label="Apply to instructions"
              onClick={() => {
                onApplyInstructions(result.instructionsText);
                showToast(
                  "Questions applied to instructions — save to persist.",
                );
              }}
            />
            <AiButton
              label="Copy"
              variant="ghost"
              onClick={() =>
                void copyText(result.instructionsText).then(() =>
                  showToast("Questions copied."),
                )
              }
            />
          </div>
        </div>
      ) : null}
    </AiPanel>
  );
}
