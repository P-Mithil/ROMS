import { useState } from "react";
import type { AiEmailTemplate } from "@roms/shared";
import { AI_EMAIL_TEMPLATES } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { generateEmailDraft, suggestSalary } from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type OfferAiPanelProps = {
  candidateId: string;
  offerId: string;
  joiningDate?: string;
  offerLink?: string;
};

export function OfferAiPanel({
  candidateId,
  offerId,
  joiningDate,
  offerLink,
}: OfferAiPanelProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] =
    useState<AiEmailTemplate>("OFFER_EXTENDED");
  const [emailDraft, setEmailDraft] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [salaryText, setSalaryText] = useState<string | null>(null);

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
    <AiPanel title="Offer AI assist" error={error}>
      <div className="form-field">
        <span className="form-field__label">Email template</span>
        <select
          className="form-field__input"
          value={template}
          onChange={(event) =>
            setTemplate(event.target.value as AiEmailTemplate)
          }
        >
          {AI_EMAIL_TEMPLATES.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="button-row">
        <AiButton
          label="Draft email"
          loading={busy === "email"}
          onClick={() =>
            void run("email", async () => {
              const result = await generateEmailDraft({
                template,
                candidateId,
                offerId,
                joiningDate,
                offerLink,
              });
              setEmailDraft({ subject: result.subject, body: result.body });
            })
          }
        />
        <AiButton
          label="Suggest salary"
          loading={busy === "salary"}
          onClick={() =>
            void run("salary", async () => {
              const result = await suggestSalary(candidateId);
              setSalaryText(
                [
                  `Currency: ${result.currency}`,
                  `Min: ${result.suggestedMin ?? "—"}`,
                  `Max: ${result.suggestedMax ?? "—"}`,
                  `Mid: ${result.midpoint ?? "—"}`,
                  ...result.rationale,
                ].join("\n"),
              );
            })
          }
        />
      </div>

      {emailDraft ? (
        <div className="ai-result">
          <h3>{emailDraft.subject}</h3>
          <pre className="ai-pre">{emailDraft.body}</pre>
          <AiButton
            label="Copy email"
            onClick={() =>
              void copyText(
                `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`,
              ).then(() => showToast("Email draft copied."))
            }
          />
        </div>
      ) : null}

      {salaryText ? (
        <div className="ai-result">
          <h3>Salary guidance</h3>
          <pre className="ai-pre">{salaryText}</pre>
          <AiButton
            label="Copy"
            onClick={() =>
              void copyText(salaryText).then(() =>
                showToast("Salary guidance copied."),
              )
            }
          />
        </div>
      ) : null}
    </AiPanel>
  );
}
