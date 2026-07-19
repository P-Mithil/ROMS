type AiButtonProps = {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

export function AiButton({
  label,
  loadingLabel = "Working…",
  loading = false,
  disabled = false,
  onClick,
  variant = "secondary",
}: AiButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} ai-btn`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
