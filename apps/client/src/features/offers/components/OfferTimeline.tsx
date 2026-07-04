import type { OfferTimelineItemDto } from "@roms/shared";

function timelineTone(key: string) {
  if (key === "accepted" || key === "approved") {
    return "success";
  }
  if (
    key === "submitted" ||
    key === "extended" ||
    key === "approval-rejected"
  ) {
    return "pending";
  }
  if (key === "declined" || key === "withdrawn" || key === "expired") {
    return "danger";
  }
  return "neutral";
}

type OfferTimelineProps = {
  items: OfferTimelineItemDto[];
};

export function OfferTimeline({ items }: OfferTimelineProps) {
  if (items.length === 0) {
    return <p className="meta-text">No timeline events yet.</p>;
  }

  return (
    <ol className="timeline">
      {items.map((item) => (
        <li
          key={item.key}
          className={`timeline__item timeline__item--${timelineTone(item.key)}`}
        >
          <p className="timeline__date">
            {new Date(item.at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="timeline__title">{item.title}</p>
          {item.detail ? (
            <p className="timeline__detail">{item.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
