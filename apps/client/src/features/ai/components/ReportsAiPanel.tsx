import { useState } from "react";
import type {
  AiInsightsResult,
  AiMissingSkillsResult,
  AiWeeklySummaryResult,
  InsightsFiltersInput,
} from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import {
  getDepartmentInsights,
  getHiringInsights,
  getMissingSkills,
  getWeeklyHiringSummary,
} from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type ReportsAiPanelProps = {
  filters: InsightsFiltersInput;
};

export function ReportsAiPanel({ filters }: ReportsAiPanelProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiring, setHiring] = useState<AiInsightsResult | null>(null);
  const [departments, setDepartments] = useState<AiInsightsResult | null>(null);
  const [missing, setMissing] = useState<AiMissingSkillsResult | null>(null);
  const [weekly, setWeekly] = useState<AiWeeklySummaryResult | null>(null);

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
    <AiPanel title="Analytics intelligence" error={error}>
      <div className="button-row">
        <AiButton
          label="Hiring insights"
          loading={busy === "hiring"}
          onClick={() =>
            void run("hiring", async () => {
              setHiring(await getHiringInsights(filters));
            })
          }
        />
        <AiButton
          label="Department insights"
          loading={busy === "dept"}
          onClick={() =>
            void run("dept", async () => {
              setDepartments(await getDepartmentInsights(filters));
            })
          }
        />
        <AiButton
          label="Missing skills"
          loading={busy === "missing"}
          onClick={() =>
            void run("missing", async () => {
              setMissing(await getMissingSkills(filters));
            })
          }
        />
        <AiButton
          label="Weekly summary"
          loading={busy === "weekly"}
          onClick={() =>
            void run("weekly", async () => {
              setWeekly(await getWeeklyHiringSummary(filters));
            })
          }
        />
      </div>

      {hiring ? (
        <div className="ai-result">
          <h3>Hiring insights</h3>
          <ul>
            {hiring.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {departments ? (
        <div className="ai-result">
          <h3>Department insights</h3>
          <ul>
            {departments.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {missing ? (
        <div className="ai-result">
          <h3>Top missing skills</h3>
          {missing.commentary ? <p>{missing.commentary}</p> : null}
          <ul>
            {missing.skills.map((item) => (
              <li key={item.skill}>
                <strong>{item.skill}</strong> ({item.count}) —{" "}
                {item.requisitionTitles.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {weekly ? (
        <div className="ai-result">
          <h3>{weekly.title}</h3>
          <p>{weekly.summary}</p>
          <ul>
            {weekly.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <AiButton
            label="Copy summary"
            onClick={() =>
              void copyText(
                `${weekly.title}\n\n${weekly.summary}\n\n${weekly.bullets.map((b) => `• ${b}`).join("\n")}`,
              ).then(() => showToast("Weekly summary copied."))
            }
          />
        </div>
      ) : null}
    </AiPanel>
  );
}
