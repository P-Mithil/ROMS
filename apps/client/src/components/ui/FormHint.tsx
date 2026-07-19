type FormHintProps = {
  children: React.ReactNode;
};

export function FormHint({ children }: FormHintProps) {
  return <p className="form-hint">{children}</p>;
}
