import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function FormSelect({ value, options, onChange, name, placeholder, className, required, disabled, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const hasError = className && className.includes('error');

  const handleSelect = useCallback((optValue) => {
    onChange({ target: { value: optValue, name: name || '' } });
    setOpen(false);
  }, [onChange, name]);

  return (
    <div
      className={`fs-select${hasError ? ' fs-error' : ''}${disabled ? ' fs-disabled' : ''}`}
      ref={ref}
      style={style}
    >
      <button
        type="button"
        className={`fs-select-trigger${open ? ' open' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
      >
        <span className={`fs-select-text${!selected ? ' fs-placeholder' : ''}`}>
          {selected ? selected.label : (placeholder || 'Sélectionner...')}
        </span>
        <ChevronDown size={14} className="fs-select-chevron" />
      </button>
      {open && (
        <div className="fs-select-dropdown" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`fs-select-option${opt.value === value ? ' active' : ''}`}
              onClick={() => handleSelect(opt.value)}
              role="option"
              aria-selected={opt.value === value}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
