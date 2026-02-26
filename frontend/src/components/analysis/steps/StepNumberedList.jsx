import { useState, forwardRef, useImperativeHandle } from 'react';
import { Plus, X } from 'lucide-react';

const TITLE_MAX = 80;
const DESC_MAX = 400;

const StepNumberedList = forwardRef(function StepNumberedList(
  { addLabel = 'Ajouter un élément', titlePlaceholder, descPlaceholder, value, onChange },
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
            ? 'Ajoutez au moins un élément pour continuer.'
            : 'Aucun élément ajouté. Commencez par ajouter votre première conclusion.'}
        </div>
      )}

      <div className="an-nl-list">
        {items.map((item, i) => {
          const titleErr = attempted && !item.title.trim();
          const descErr = attempted && !item.description.trim();

          return (
            <div key={i} className="an-nl-item">
              <span className="an-nl-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="an-nl-body">
                <input
                  type="text"
                  className={`an-nl-title${titleErr ? ' error' : ''}`}
                  value={item.title}
                  onChange={(e) => update(i, 'title', e.target.value.slice(0, TITLE_MAX))}
                  placeholder={titlePlaceholder}
                  maxLength={TITLE_MAX}
                />
                <textarea
                  className={`an-nl-desc${descErr ? ' error' : ''}`}
                  value={item.description}
                  onChange={(e) => update(i, 'description', e.target.value.slice(0, DESC_MAX))}
                  placeholder={descPlaceholder}
                  maxLength={DESC_MAX}
                  rows={2}
                />
                <div className="an-swot-counter">
                  <span className={item.description.length >= DESC_MAX ? 'over' : ''}>
                    {item.description.length}/{DESC_MAX}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="an-nl-remove"
                onClick={() => remove(i)}
                title="Supprimer"
              >
                <X size={14} />
              </button>
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

export default StepNumberedList;
