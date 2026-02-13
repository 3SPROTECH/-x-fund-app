import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

function CustomSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isFiltered = Boolean(value);

  return (
    <div className="tf-select" ref={ref}>
      <button
        type="button"
        className={`tf-select-trigger${open ? ' open' : ''}${isFiltered ? ' filtered' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="tf-select-label">{label}</span>
        {isFiltered && <span className="tf-select-value">{selected?.label}</span>}
        <ChevronDown size={14} className="tf-select-chevron" />
      </button>
      {open && (
        <div className="tf-select-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tf-select-option${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
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

/**
 * Reusable filter + search bar for tables.
 *
 * @param {Object} props
 * @param {Array} props.filters - Array of filter definitions:
 *   { key: string, label: string, value: string, options: [{ value: string, label: string }] }
 * @param {Function} props.onFilterChange - (key, value) => void
 * @param {string} [props.search] - Current search value (omit to hide search)
 * @param {Function} [props.onSearchChange] - (value) => void
 * @param {string} [props.searchPlaceholder] - Placeholder for the search input
 */
export default function TableFilters({ filters = [], onFilterChange, search, onSearchChange, searchPlaceholder = 'Rechercher...' }) {
  const hasSearch = onSearchChange !== undefined;

  return (
    <div className="table-filters">
      {hasSearch && (
        <div className="tf-search">
          <Search size={16} className="tf-search-icon" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
          {search && (
            <button className="tf-search-clear" onClick={() => onSearchChange('')} type="button">
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {filters.map((f) => (
        <CustomSelect
          key={f.key}
          label={f.label}
          value={f.value}
          options={f.options}
          onChange={(val) => onFilterChange(f.key, val)}
        />
      ))}
    </div>
  );
}
