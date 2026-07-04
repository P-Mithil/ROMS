import { FormEvent, useRef, useState } from "react";
import type { OnboardingCaseDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import {
  deleteOnboardingDocumentFile,
  downloadOnboardingDocument,
  uploadOnboardingDocument,
  verifyOnboardingDocument,
  waiveOnboardingDocument,
} from "../api/onboarding-api.js";
import {
  ONBOARDING_DOCUMENT_STATUS_LABELS,
  ONBOARDING_DOCUMENT_TYPE_LABELS,
} from "../utils/onboarding-labels.js";
import {
  canUploadDocument,
  canVerifyDocument,
  canWaiveDocument,
} from "../utils/permissions.js";

type DocumentChecklistProps = {
  onboardingCase: OnboardingCaseDto;
  onUpdated: (onboardingCase: OnboardingCaseDto) => void;
};

export function DocumentChecklist({
  onboardingCase,
  onUpdated,
}: DocumentChecklistProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [waiveDocId, setWaiveDocId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const canUpload = canUploadDocument(user, onboardingCase);

  async function runAction(action: () => Promise<OnboardingCaseDto>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated(updated);
      showToast("Document updated.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Document action failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !uploadDocId) {
      return;
    }

    await runAction(() =>
      uploadOnboardingDocument(onboardingCase.id, uploadDocId, file),
    );
    setUploadDocId(null);
    event.target.value = "";
  }

  async function handleWaive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!waiveDocId || !waiveReason.trim()) {
      setError("A waive reason is required");
      return;
    }

    await runAction(() =>
      waiveOnboardingDocument(onboardingCase.id, waiveDocId, {
        reason: waiveReason.trim(),
      }),
    );
    setWaiveDocId(null);
    setWaiveReason("");
  }

  return (
    <div className="card">
      <h2>Document checklist</h2>
      {error ? <p className="form-error">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="visually-hidden"
        onChange={handleFileChange}
      />

      {waiveDocId ? (
        <form className="reason-form" onSubmit={handleWaive}>
          <label className="form-field">
            <span className="form-field__label">Waive reason</span>
            <textarea
              className="form-field__textarea"
              rows={3}
              required
              value={waiveReason}
              onChange={(event) => setWaiveReason(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => {
                setWaiveDocId(null);
                setWaiveReason("");
              }}
            >
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm waive"}
            </button>
          </div>
        </form>
      ) : null}

      <ul className="checklist">
        {onboardingCase.documents.map((document) => {
          const showVerify = canVerifyDocument(user, document, onboardingCase);
          const showWaive = canWaiveDocument(user, document);
          const showUpload = canUpload;
          const showDownload = Boolean(document.fileName);
          const showRemove = canUpload && Boolean(document.fileName);

          return (
            <li key={document.id} className="checklist__item">
              <div className="checklist__main">
                <div>
                  <strong>
                    {ONBOARDING_DOCUMENT_TYPE_LABELS[document.documentType]}
                  </strong>
                  <p className="meta-text">
                    {document.isRequired ? "Required" : "Optional"}
                    {document.fileName ? ` · ${document.fileName}` : ""}
                  </p>
                  {document.waiveReason ? (
                    <p className="meta-text">Waived: {document.waiveReason}</p>
                  ) : null}
                </div>
                <span
                  className={`badge badge--status badge--document-${document.status.toLowerCase()}`}
                >
                  {ONBOARDING_DOCUMENT_STATUS_LABELS[document.status]}
                </span>
              </div>

              <div className="button-row">
                {showUpload ? (
                  <button
                    className="btn btn--secondary"
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setUploadDocId(document.id);
                      fileInputRef.current?.click();
                    }}
                  >
                    {document.fileName ? "Replace" : "Upload"}
                  </button>
                ) : null}
                {showDownload && document.fileName ? (
                  <button
                    className="btn btn--ghost"
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void downloadOnboardingDocument(
                        onboardingCase.id,
                        document.id,
                        document.fileName!,
                      ).catch((err) =>
                        showToast(
                          err instanceof ApiClientError
                            ? err.message
                            : "Download failed",
                          "error",
                        ),
                      )
                    }
                  >
                    Download
                  </button>
                ) : null}
                {showRemove ? (
                  <button
                    className="btn btn--ghost"
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void runAction(() =>
                        deleteOnboardingDocumentFile(
                          onboardingCase.id,
                          document.id,
                        ),
                      )
                    }
                  >
                    Remove file
                  </button>
                ) : null}
                {showVerify ? (
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void runAction(() =>
                        verifyOnboardingDocument(onboardingCase.id, document.id),
                      )
                    }
                  >
                    Verify
                  </button>
                ) : null}
                {showWaive ? (
                  <button
                    className="btn btn--ghost"
                    type="button"
                    disabled={submitting}
                    onClick={() => setWaiveDocId(document.id)}
                  >
                    Waive
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
