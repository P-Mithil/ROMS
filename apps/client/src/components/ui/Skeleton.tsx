type SkeletonListProps = {
  rows?: number;
  label?: string;
};

export function SkeletonList({
  rows = 3,
  label = "Loading…",
}: SkeletonListProps) {
  return (
    <div className="list-skeleton" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="card skeleton-card" />
      ))}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="badge badge--loading">{label}</span>
    </div>
  );
}
