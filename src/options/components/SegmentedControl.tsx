interface SegmentedControlProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  style?: React.CSSProperties;
}

export function SegmentedControl({ options, value, onChange, style }: SegmentedControlProps) {
  return (
    <div className="seg-control" style={style}>
      {options.map((opt) => (
        <button
          key={opt.key}
          className={`seg-btn ${value === opt.key ? "active" : ""}`}
          onClick={() => onChange(opt.key)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
