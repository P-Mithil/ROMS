import type { InterviewFeedbackDto } from "@roms/shared";
import {
  INTERVIEW_RECOMMENDATION_LABELS,
  type InterviewRecommendation,
} from "@roms/shared";

type InterviewFeedbackListProps = {
  items: InterviewFeedbackDto[];
};

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

function formatRecommendation(value: string | null) {
  if (!value) {
    return null;
  }

  if (value in INTERVIEW_RECOMMENDATION_LABELS) {
    return INTERVIEW_RECOMMENDATION_LABELS[value as InterviewRecommendation];
  }

  return value;
}

export function InterviewFeedbackList({ items }: InterviewFeedbackListProps) {
  if (items.length === 0) {
    return <p className="meta-text">No feedback submitted yet.</p>;
  }

  return (
    <div className="feedback-list">
      {items.map((item) => (
        <article key={item.id} className="feedback-list__item">
          <div className="feedback-list__header">
            <strong>{formatUserName(item.createdBy)}</strong>
            <span className="meta-text">
              {new Date(item.updatedAt).toLocaleString()}
            </span>
          </div>

          <dl className="feedback-list__details">
            {item.rating != null ? (
              <div>
                <dt>Rating</dt>
                <dd>{item.rating} / 5</dd>
              </div>
            ) : null}
            {item.recommendation ? (
              <div>
                <dt>Recommendation</dt>
                <dd>{formatRecommendation(item.recommendation)}</dd>
              </div>
            ) : null}
          </dl>

          {item.summary ? (
            <>
              <h4>Summary</h4>
              <p className="description-text">{item.summary}</p>
            </>
          ) : null}

          {item.strengths ? (
            <>
              <h4>Strengths</h4>
              <p className="description-text">{item.strengths}</p>
            </>
          ) : null}

          {item.concerns ? (
            <>
              <h4>Concerns</h4>
              <p className="description-text">{item.concerns}</p>
            </>
          ) : null}
        </article>
      ))}
    </div>
  );
}
