import { useState } from "react";
import type { ReportDataset, ReportExportFormat, ReportFiltersInput } from "@roms/shared";
import { Icon } from "../../../components/ui/Icon.js";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { downloadReportExport } from "../api/reports-api.js";

type ExportButtonsProps = {
  dataset: ReportDataset;
  filters: ReportFiltersInput;
};

export function ExportButtons({ dataset, filters }: ExportButtonsProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<ReportExportFormat | null>(null);

  async function handleExport(format: ReportExportFormat) {
    setBusy(format);
    try {
      await downloadReportExport(dataset, format, filters);
      showToast(`Exported ${dataset} as ${format.toUpperCase()}.`);
    } catch (error) {
      showToast(
        error instanceof ApiClientError ? error.message : "Export failed",
        "error",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="button-row export-buttons">
      <button
        className="btn btn--secondary"
        type="button"
        disabled={busy != null}
        onClick={() => void handleExport("csv")}
      >
        <Icon name="download" />
        {busy === "csv" ? "Exporting…" : "Export CSV"}
      </button>
      <button
        className="btn btn--secondary"
        type="button"
        disabled={busy != null}
        onClick={() => void handleExport("xlsx")}
      >
        <Icon name="download" />
        {busy === "xlsx" ? "Exporting…" : "Export Excel"}
      </button>
    </div>
  );
}
