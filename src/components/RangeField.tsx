interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}

export function RangeField({ id, label, value, min, max, minLabel, maxLabel, onChange }: RangeFieldProps) {
  return <div className="range-field">
    <label htmlFor={id}>{label} <output htmlFor={id}>{value}/{max}</output></label>
    <input
      id={id}
      aria-label={`${label} from ${min} to ${max}`}
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    <div className="range-labels" aria-hidden="true"><span>{minLabel}</span><span>{maxLabel}</span></div>
  </div>;
}
