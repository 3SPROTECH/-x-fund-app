import { useState, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import IconifyIcon from '../IconifyIcon';
import IconPicker from '../IconPicker';

const TITLE_MAX = 30;
const DESC_MAX = 100;
const MIN_ITEMS = 4;
const MAX_ITEMS = 6;

const StepHighlights = forwardRef(function StepHighlights(
  { value, onChange },
  ref,
) {
  const items = Array.isArray(value) ? value : [];
  const [attempted, setAttempted] = useState(false);
  const [picker, setPicker] = useState(null); // { index, rect }

  useImperativeHandle(ref, () => ({
    validate() {
      setAttempted(true);
      if (items.length < MIN_ITEMS) return false;
      return items.every((item) => item.icon && item.title.trim() && item.description.trim());
    },
  }));

  const update = (index, field, val) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    );
    onChange?.(next);
  };

  const add = () => {
    if (items.length >= MAX_ITEMS) return;
    onChange?.([...items, { icon: '', title: '', description: '' }]);
  };

  const remove = (index) => {
    onChange?.(items.filter((_, i) => i !== index));
    if (picker?.index === index) setPicker(null);
  };

  const openPicker = (index, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPicker({ index, rect });
  };

  const selectIcon = (iconName) => {
    if (picker) {
      update(picker.index, 'icon', iconName);
      setPicker(null);
    }
  };

  const tooFew = attempted && items.length < MIN_ITEMS;

  return (
    <div>
      {items.length === 0 && (
        <div className={`an-swot-empty${attempted ? ' error' : ''}`}>
          {attempted
            ? `Ajoutez au moins ${MIN_ITEMS} caractéristiques pour continuer.`
            : 'Aucune caractéristique ajoutée. Commencez par définir les points clés du projet.'}
        </div>
      )}

      {tooFew && items.length > 0 && (
        <p className="an-step-field-error" style={{ marginBottom: '0.5rem' }}>
          Minimum {MIN_ITEMS} caractéristiques requises ({items.length}/{MIN_ITEMS})
        </p>
      )}

      <div className="an-hl-grid">
        {items.map((item, i) => {
          const iconErr = attempted && !item.icon;
          const titleErr = attempted && !item.title.trim();
          const descErr = attempted && !item.description.trim();

          return (
            <div key={i} className="an-hl-card">
              <div className="an-hl-card-top">
                <button
                  type="button"
                  className={`an-hl-icon-btn${iconErr ? ' error' : ''}${item.icon ? ' has-icon' : ''}`}
                  onClick={(e) => openPicker(i, e)}
                  title="Choisir une icône"
                >
                  {item.icon
                    ? <IconifyIcon icon={item.icon} size={22} />
                    : <Plus size={16} />
                  }
                </button>
                <button
                  type="button"
                  className="an-swot-remove"
                  onClick={() => remove(i)}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <input
                type="text"
                className={`an-hl-title${titleErr ? ' error' : ''}`}
                value={item.title}
                onChange={(e) => update(i, 'title', e.target.value.slice(0, TITLE_MAX))}
                placeholder="Titre court"
                maxLength={TITLE_MAX}
              />

              <input
                type="text"
                className={`an-hl-desc${descErr ? ' error' : ''}`}
                value={item.description}
                onChange={(e) => update(i, 'description', e.target.value.slice(0, DESC_MAX))}
                placeholder="Description en une ligne..."
                maxLength={DESC_MAX}
              />
              <div className="an-swot-counter">{item.description.length}/{DESC_MAX}</div>
            </div>
          );
        })}
      </div>

      {items.length < MAX_ITEMS && (
        <button type="button" className="an-swot-add" onClick={add}>
          <Plus size={14} /> Ajouter une caractéristique ({items.length}/{MAX_ITEMS})
        </button>
      )}

      {picker && (
        <IconPicker
          value={items[picker.index]?.icon}
          triggerRect={picker.rect}
          onSelect={selectIcon}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
});

export default StepHighlights;
