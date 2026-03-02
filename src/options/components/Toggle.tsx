interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div className="toggle-thumb" />
    </button>
  );
}
