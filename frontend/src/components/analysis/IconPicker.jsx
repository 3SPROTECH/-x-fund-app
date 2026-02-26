import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import IconifyIcon from './IconifyIcon';

const API = 'https://api.iconify.design';
const PREFIXES = 'lucide,mdi,tabler,ph,solar';
const LIMIT = 48;

const SUGGESTIONS = [
  { label: 'Immobilier', query: 'building house home' },
  { label: 'Finance', query: 'money bank chart' },
  { label: 'Localisation', query: 'map pin location' },
  { label: 'Sécurité', query: 'shield lock protect' },
  { label: 'Utilisateurs', query: 'user people team' },
  { label: 'Temps', query: 'clock time calendar' },
];

export default function IconPicker({ value, onSelect, triggerRect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef();
  const searchRef = useRef();
  const debounceRef = useRef();

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const search = useCallback((term) => {
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API}/search?query=${encodeURIComponent(term)}&limit=${LIMIT}&prefixes=${PREFIXES}`)
      .then((r) => r.json())
      .then((data) => setResults(data.icons || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSuggestion = (term) => {
    setQuery(term);
    search(term);
  };

  // Position: below trigger, flip up if near bottom
  const top = triggerRect
    ? triggerRect.bottom + 6 + 380 > window.innerHeight
      ? Math.max(8, triggerRect.top - 380 - 6)
      : triggerRect.bottom + 6
    : 100;
  const left = triggerRect
    ? Math.max(8, Math.min(triggerRect.left, window.innerWidth - 308))
    : 100;

  return (
    <div className="an-ip-overlay">
      <div ref={pickerRef} className="an-ip" style={{ top, left }}>
        {/* Header */}
        <div className="an-ip-header">
          <div className="an-ip-search">
            <Search size={13} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="Rechercher une icône..."
            />
            {query && (
              <button
                type="button"
                className="an-ip-clear"
                onClick={() => { setQuery(''); setResults([]); }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="an-ip-body">
          {/* Suggestions when no query */}
          {!query && results.length === 0 && !loading && (
            <div className="an-ip-suggestions">
              <p className="an-ip-hint">Recherchez par mot-clé ou parcourez par catégorie :</p>
              <div className="an-ip-chips">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="an-ip-chip"
                    onClick={() => handleSuggestion(s.query)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="an-ip-loading">
              <Loader2 size={18} className="an-ip-spinner" />
            </div>
          )}

          {/* Results grid */}
          {!loading && results.length > 0 && (
            <div className="an-ip-grid">
              {results.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`an-ip-item${value === icon ? ' selected' : ''}`}
                  onClick={() => onSelect(icon)}
                  title={icon}
                >
                  <IconifyIcon icon={icon} size={20} />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query && results.length === 0 && (
            <div className="an-ip-empty">Aucune icône trouvée pour &quot;{query}&quot;</div>
          )}
        </div>
      </div>
    </div>
  );
}
