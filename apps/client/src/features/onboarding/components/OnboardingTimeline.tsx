import type { OnboardingTimelineItemDto } from "@roms/shared";

function timelineTone(key: string) {
  if (key === "completed" || key === "joined") {
    return "success";
  }
  if (key === "started") {
    return "pending";
  }
  if (key === "cancelled") {
    return "danger";
  }
  return "neutral";
}

type OnboardingTimelineProps = {
  items: OnboardingTimelineItemDto[];
};

export function OnboardingTimeline({ items }: OnboardingTimelineProps) {
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
