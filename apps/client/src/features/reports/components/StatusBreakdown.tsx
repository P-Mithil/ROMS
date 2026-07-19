type StatusBreakdownProps = {
  title?: string;
  items: Array<{ key: string; label: string; count: number }>;
};

export function StatusBreakdown({ title, items }: StatusBreakdownProps) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="card">
      {title ? <h2>{title}</h2> : null}
      <ul className="report-bars">
        {items.map((item) => (
          <li key={item.key} className="report-bars__item">
            <div className="report-bars__label">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${Math.round((item.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
