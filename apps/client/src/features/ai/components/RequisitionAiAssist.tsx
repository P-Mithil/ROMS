import { useState } from "react";
import type {
  AiJdGenerateResult,
  AiRequisitionImproveResult,
} from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { stringifySkills } from "../../../lib/skills.js";
import {
  generateJd,
  generateJdForRequisition,
  improveRequisition,
} from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type RequisitionAiAssistProps = {
  requisitionId?: string;
  title: string;
  departmentName?: string;
  employmentType?: string;
  workMode?: string;
  experienceMin?: string;
  experienceMax?: string;
  skills: string[];
  onApplyDescription: (description: string) => void;
  onApplySkills: (skills: string[]) => void;
};

export function RequisitionAiAssist({
  requisitionId,
  title,
  departmentName,
  employmentType,
  workMode,
  experienceMin,
  experienceMax,
  skills,
  onApplyDescription,
  onApplySkills,
}: RequisitionAiAssistProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jd, setJd] = useState<AiJdGenerateResult | null>(null);
  const [improve, setImprove] = useState<AiRequisitionImproveResult | null>(
    null,
  );

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (err) {
      const message = formatAiError(err);
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AiPanel title="JD assistant" error={error}>
      <div className="button-row">
        <AiButton
          label="Generate JD"
          loading={busy === "generate"}
          disabled={!title.trim()}
          onClick={() =>
            void run("generate", async () => {
              const result = requisitionId
                ? await generateJdForRequisition(requisitionId)
                : await generateJd({
                    title: title.trim(),
                    departmentName: departmentName || undefined,
                    employmentType: employmentType || undefined,
                    workMode: workMode || undefined,
                    experienceMin: experienceMin
                      ? Number(experienceMin)
                      : undefined,
                    experienceMax: experienceMax
                      ? Number(experienceMax)
                      : undefined,
                    skills: stringifySkills(skills),
                  });
              setJd(result);
            })
          }
        />
        {requisitionId ? (
          <AiButton
            label="Improve JD"
            loading={busy === "improve"}
            onClick={() =>
              void run("improve", async () => {
                setImprove(await improveRequisition(requisitionId));
              })
            }
          />
        ) : null}
      </div>

      {jd ? (
        <div className="ai-result">
          <h3>Generated job description</h3>
          <pre className="ai-pre">{jd.description}</pre>
          {jd.suggestedSkills ? (
            <p className="meta-text">Suggested skills: {jd.suggestedSkills}</p>
          ) : null}
          <div className="button-row">
            <AiButton
              label="Apply description"
              onClick={() => {
                onApplyDescription(jd.description);
                showToast(
                  "Description applied to form — save to persist.",
                );
              }}
            />
            {jd.suggestedSkills ? (
              <AiButton
                label="Apply skills"
                onClick={() => {
                  onApplySkills(
                    jd.suggestedSkills
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  );
                  showToast("Skills applied to form — save to persist.");
                }}
              />
            ) : null}
            <AiButton
              label="Copy"
              variant="ghost"
              onClick={() =>
                void copyText(jd.description).then(() =>
                  showToast("JD copied."),
                )
              }
            />
          </div>
        </div>
      ) : null}

      {improve ? (
        <div className="ai-result">
          <h3>Improvement suggestions</h3>
          <ul>
            {improve.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {improve.revisedDescription ? (
            <>
              <h4>Revised description</h4>
              <pre className="ai-pre">{improve.revisedDescription}</pre>
              <div className="button-row">
                <AiButton
                  label="Apply revised description"
                  onClick={() => {
                    onApplyDescription(improve.revisedDescription!);
                    showToast(
                      "Revised description applied — save to persist.",
                    );
                  }}
                />
                <AiButton
                  label="Copy"
                  variant="ghost"
                  onClick={() =>
                    void copyText(improve.revisedDescription!).then(() =>
                      showToast("Revised JD copied."),
                    )
                  }
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </AiPanel>
  );
}
