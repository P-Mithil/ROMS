import type { OfferDto, PublicOfferDto } from "@roms/shared";
import {
  formatCurrency,
  formatOfferDate,
  formatOfferDateTime,
} from "../utils/offer-labels.js";

type OfferPreviewProps = {
  offer: OfferDto | PublicOfferDto;
  candidateLabel?: string;
  requisitionTitle?: string;
};

function resolveCandidateName(
  offer: OfferDto | PublicOfferDto,
  candidateLabel?: string,
) {
  if (candidateLabel) {
    return candidateLabel;
  }

  if ("candidateName" in offer) {
    return offer.candidateName;
  }

  return offer.candidate.fullName;
}

function resolveRequisitionTitle(
  offer: OfferDto | PublicOfferDto,
  requisitionTitle?: string,
) {
  if (requisitionTitle) {
    return requisitionTitle;
  }

  if ("requisitionTitle" in offer) {
    return offer.requisitionTitle;
  }

  return offer.requisition.title;
}

export function OfferPreview({
  offer,
  candidateLabel,
  requisitionTitle,
}: OfferPreviewProps) {
  return (
    <div className="offer-preview">
      <p className="offer-preview__eyebrow">Candidate preview</p>
      <h3 className="offer-preview__title">{offer.jobTitle}</h3>
      <p className="offer-preview__subtitle">
        {resolveRequisitionTitle(offer, requisitionTitle)}
      </p>

      <dl className="detail-list">
        <div>
          <dt>Candidate</dt>
          <dd>{resolveCandidateName(offer, candidateLabel)}</dd>
        </div>
        <div>
          <dt>Employment type</dt>
          <dd>{offer.employmentType.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Work mode</dt>
          <dd>{offer.workMode.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Base salary</dt>
          <dd>{formatCurrency(offer.baseSalary, offer.currency)}</dd>
        </div>
        <div>
          <dt>Joining date</dt>
          <dd>{formatOfferDate(offer.joiningDate)}</dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>{formatOfferDateTime(offer.validUntil)}</dd>
        </div>
      </dl>

      {offer.terms ? (
        <div className="offer-preview__terms">
          <h4>Terms</h4>
          <p>{offer.terms}</p>
        </div>
      ) : null}
    </div>
  );
}
