import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

function CustomSelect({ label, value, options, onChange, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);
  const isFiltered = Boolean(value);

  const filtered = searchable && query
    ? options.filter((o) => !o.value || o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

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
          {searchable && (
            <div className="tf-select-search">
              <Search size={14} className="tf-select-search-icon" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher..."
                className="tf-select-search-input"
              />
              {query && (
                <button type="button" className="tf-select-search-clear" onClick={() => setQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <div className="tf-select-options">
            {filtered.length === 0 ? (
              <div className="tf-select-empty">Aucun resultat</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`tf-select-option${opt.value === value ? ' active' : ''}`}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={14} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DebouncedSearch({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '');
  const timerRef = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const handleChange = (v) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 350);
  };

  const handleClear = () => { setLocal(''); clearTimeout(timerRef.current); onChange(''); };

  return (
    <div className="tf-search">
      <Search size={16} className="tf-search-icon" />
      <input type="text" value={local} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} />
      {local && (
        <button className="tf-search-clear" onClick={handleClear} type="button">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function TableFilters({ filters = [], onFilterChange, search, onSearchChange, searchPlaceholder = 'Rechercher...' }) {
  const hasSearch = onSearchChange !== undefined;

  return (
    <div className="table-filters">
      {filters.map((f) => (
        <CustomSelect
          key={f.key}
          label={f.label}
          value={f.value}
          options={f.options}
          onChange={(val) => onFilterChange(f.key, val)}
          searchable={f.searchable}
        />
      ))}
      {hasSearch && (
        <DebouncedSearch value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      )}
    </div>
  );
}
