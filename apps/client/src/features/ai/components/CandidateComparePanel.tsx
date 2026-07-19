import { useState } from "react";
import type { AiCompareResult } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { compareCandidates } from "../api/ai-api.js";
import { formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

type CandidateComparePanelProps = {
  selectedIds: string[];
  onClear: () => void;
};

export function CandidateComparePanel({
  selectedIds,
  onClear,
}: CandidateComparePanelProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCompareResult | null>(null);

  if (selectedIds.length < 2) {
    return null;
  }

  return (
    <AiPanel
      title="Candidate comparison"
      error={error}
      loading={loading}
      actions={
        <div className="button-row">
          <AiButton
            label={`Compare (${selectedIds.length})`}
            loading={loading}
            disabled={selectedIds.length < 2 || selectedIds.length > 3}
            onClick={() => {
              setLoading(true);
              setError(null);
              void compareCandidates(selectedIds)
                .then((data) => setResult(data))
                .catch((err) => {
                  const message = formatAiError(err);
                  setError(message);
                  showToast(message, "error");
                })
                .finally(() => setLoading(false));
            }}
          />
          <AiButton label="Clear" variant="ghost" onClick={onClear} />
        </div>
      }
    >
      {result ? (
        <div className="ai-result">
          <p>{result.narrative}</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Score</th>
                <th>Recommendation</th>
                <th>Missing skills</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.candidateId}>
                  <td>{row.fullName}</td>
                  <td>{row.score}</td>
                  <td>{row.recommendation.replaceAll("_", " ")}</td>
                  <td>{row.missingSkills.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="meta-text">
          Select 2–3 candidates on the same requisition, then compare.
        </p>
      )}
    </AiPanel>
  );
}
