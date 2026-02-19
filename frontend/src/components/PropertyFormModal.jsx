import { useState } from 'react';
import { X } from 'lucide-react';
import FormSelect from './FormSelect';
import { EMPTY_PROPERTY } from '../utils';

/**
 * Reusable modal for creating / editing a property.
 *
 * Props:
 *   isOpen       – boolean, controls visibility
 *   onClose      – () => void
 *   onSubmit     – (formData) => Promise<void>  (receives the raw form state)
 *   initialData  – property attributes to pre-fill the form (null for create)
 *   submitting   – boolean, disables submit button
 */
export default function PropertyFormModal({ isOpen, onClose, onSubmit, initialData = null, submitting = false }) {
  const isEditing = !!initialData;

  const buildInitial = () => {
    if (!initialData) return { ...EMPTY_PROPERTY };
    const a = initialData.attributes || initialData;
    return {
      title: a.title || '', description: a.description || '', property_type: a.property_type || 'appartement',
      address_line1: a.address_line1 || '', address_line2: a.address_line2 || '',
      city: a.city || '', postal_code: a.postal_code || '', country: a.country || 'France',
      surface_area_sqm: a.surface_area_sqm || '', acquisition_price_cents: a.acquisition_price_cents ? a.acquisition_price_cents / 100 : '',
      estimated_value_cents: a.estimated_value_cents ? a.estimated_value_cents / 100 : '',
      number_of_lots: a.number_of_lots || '',
      lots: (a.lots || []).map(l => ({ id: l.id, lot_number: l.lot_number, surface_area_sqm: l.surface_area_sqm || '', description: l.description || '' })),
    };
  };

  const [form, setForm] = useState(buildInitial);

  // Reset form when modal opens with new data
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen && !prevOpen) {
    setForm(buildInitial());
    setPrevOpen(true);
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  if (!isOpen) return null;

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'number_of_lots') {
        const count = parseInt(value) || 0;
        const currentLots = prev.lots || [];
        const newLots = [];
        for (let i = 0; i < count; i++) {
          newLots.push(currentLots[i] || { lot_number: i + 1, surface_area_sqm: '', description: '' });
        }
        updated.lots = newLots;
      }
      if (field === 'property_type' && value !== 'immeuble') {
        updated.number_of_lots = '';
        updated.lots = [];
      }
      return updated;
    });
  };

  const setLotField = (index, field) => (e) => {
    setForm(prev => {
      const lots = [...prev.lots];
      lots[index] = { ...lots[index], [field]: e.target.value };
      return { ...prev, lots };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>{isEditing ? 'Modifier le bien' : 'Ajouter un bien immobilier'}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="modal-body">
            <div className="form-section">
              <div className="form-section-title">Informations générales</div>
              <div className="form-group" style={{ marginBottom: '.75rem' }}>
                <label>Titre</label>
                <input value={form.title} onChange={set('title')} required placeholder="Ex: Appartement T3 Lyon" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type de bien</label>
                  <FormSelect
                    value={form.property_type}
                    onChange={set('property_type')}
                    name="property_type"
                    options={[
                      { value: 'appartement', label: 'Appartement' },
                      { value: 'maison', label: 'Maison' },
                      { value: 'immeuble', label: 'Immeuble' },
                      { value: 'commercial', label: 'Commercial' },
                      { value: 'terrain', label: 'Terrain' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input type="number" step="0.1" value={form.surface_area_sqm} onChange={set('surface_area_sqm')} required />
                </div>
                {form.property_type === 'immeuble' && (
                  <div className="form-group">
                    <label>Nombre de lots</label>
                    <input type="number" min="1" max="50" step="1" value={form.number_of_lots} onChange={set('number_of_lots')} required placeholder="Ex: 4" />
                  </div>
                )}
              </div>
              {form.property_type === 'immeuble' && form.lots.length > 0 && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div className="form-section-title">Détail des lots</div>
                  {form.lots.map((lot, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', marginBottom: '.75rem' }}>
                      <div style={{ minWidth: '60px', fontWeight: 600, paddingBottom: '.5rem', color: 'var(--text-muted)' }}>
                        Lot {i + 1}
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Surface (m²)</label>
                        <input type="number" step="0.1" min="0" value={lot.surface_area_sqm} onChange={setLotField(i, 'surface_area_sqm')} placeholder="Surface" />
                      </div>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label>Description</label>
                        <input value={lot.description} onChange={setLotField(i, 'description')} placeholder={`Ex: Appartement T${i + 2}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-group" style={{ marginTop: '.75rem' }}>
                <label>Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="Description du bien..." />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Adresse</div>
              <div className="form-group" style={{ marginBottom: '.75rem' }}>
                <label>Adresse ligne 1</label>
                <input value={form.address_line1} onChange={set('address_line1')} required />
              </div>
              <div className="form-group" style={{ marginBottom: '.75rem' }}>
                <label>Adresse ligne 2</label>
                <input value={form.address_line2} onChange={set('address_line2')} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>Ville</label><input value={form.city} onChange={set('city')} required /></div>
                <div className="form-group"><label>Code postal</label><input value={form.postal_code} onChange={set('postal_code')} required /></div>
                <div className="form-group"><label>Pays</label><input value={form.country} onChange={set('country')} /></div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Financier</div>
              <div className="form-row">
                <div className="form-group"><label>Prix d'acquisition (EUR)</label><input type="number" step="0.01" value={form.acquisition_price_cents} onChange={set('acquisition_price_cents')} required /></div>
                <div className="form-group"><label>Valeur estimée (EUR)</label><input type="number" step="0.01" value={form.estimated_value_cents} onChange={set('estimated_value_cents')} required /></div>
              </div>
              <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginTop: '.5rem' }}>
                💡 Le rendement et la durée d'investissement seront définis lors de la création du projet d'investissement.
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le bien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
