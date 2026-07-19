type AiDisclaimerProps = {
  text?: string;
};

export function AiDisclaimer({
  text = "AI suggestion only. Review before Apply or Copy. Nothing is saved automatically.",
}: AiDisclaimerProps) {
  return <p className="ai-disclaimer">{text}</p>;
}
