export default function CheckboxGrid({ options, selected, onChange, name }) {
  const handleChange = (value) => {
    if (!onChange) return;
    const isSelected = selected.includes(value);
    const next = isSelected
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  return (
    <div className="pf-checkbox-grid">
      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            checked={selected.includes(opt.value)}
            onChange={() => handleChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
