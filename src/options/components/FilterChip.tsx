interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      className={`filter-chip ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
