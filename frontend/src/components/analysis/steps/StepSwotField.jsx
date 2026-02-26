import { useState, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const TITLE_MAX = 80;
const DESC_MAX = 400;

const StepSwotField = forwardRef(function StepSwotField(
  { addLabel = 'Ajouter un element', titlePlaceholder, descPlaceholder, value, onChange },
  ref,
) {
  const items = Array.isArray(value) ? value : [];
  const [attempted, setAttempted] = useState(false);

  useImperativeHandle(ref, () => ({
    validate() {
      setAttempted(true);
      if (!items.length) return false;
      return items.every((item) => item.title.trim() && item.description.trim());
    },
  }));

  const update = (index, field, val) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    );
    onChange?.(next);
  };

  const add = () => {
    onChange?.([...items, { title: '', description: '' }]);
  };

  const remove = (index) => {
    onChange?.(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      {items.length === 0 && (
        <div className={`an-swot-empty${attempted ? ' error' : ''}`}>
          {attempted
            ? 'Ajoutez au moins un element pour continuer.'
            : 'Aucun element ajoute. Commencez par ajouter votre premier point.'}
        </div>
      )}

      <div className="an-swot-list">
        {items.map((item, i) => {
          const titleErr = attempted && !item.title.trim();
          const descErr = attempted && !item.description.trim();

          return (
            <div key={i} className="an-swot-card">
              <div className="an-swot-card-header">
                <span className="an-swot-card-num">{i + 1}</span>
                <input
                  type="text"
                  className={`an-swot-input${titleErr ? ' error' : ''}`}
                  value={item.title}
                  onChange={(e) => update(i, 'title', e.target.value.slice(0, TITLE_MAX))}
                  placeholder={titlePlaceholder}
                  maxLength={TITLE_MAX}
                />
                <button
                  type="button"
                  className="an-swot-remove"
                  onClick={() => remove(i)}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="an-swot-counter">
                <span className={item.title.length >= TITLE_MAX ? 'over' : ''}>
                  {item.title.length}/{TITLE_MAX}
                </span>
              </div>

              <textarea
                className={`an-swot-textarea${descErr ? ' error' : ''}`}
                value={item.description}
                onChange={(e) => update(i, 'description', e.target.value.slice(0, DESC_MAX))}
                placeholder={descPlaceholder}
                maxLength={DESC_MAX}
                rows={3}
              />

              <div className="an-swot-counter">
                <span className={item.description.length >= DESC_MAX ? 'over' : ''}>
                  {item.description.length}/{DESC_MAX}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="an-swot-add" onClick={add}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
});

export default StepSwotField;
