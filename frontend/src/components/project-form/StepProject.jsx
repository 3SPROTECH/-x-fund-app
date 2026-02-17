import { useNavigate } from 'react-router-dom';
import useProjectFormStore from '../../stores/useProjectFormStore';
import FormSelect from '../FormSelect';
import { ImagePlus, X, Plus, Building } from 'lucide-react';

const ASSET_TYPE_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'immeuble', label: 'Immeuble' },
  { value: 'commercial', label: 'Commercial / Bureau' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'mixte', label: 'Mixte' },
];

const OPERATION_TYPE_OPTIONS = [
  { value: 'promotion_immobiliere', label: 'Promotion Immobilière' },
  { value: 'marchand_de_biens', label: 'Marchand de Biens (Achat/Revente)' },
  { value: 'refinancement', label: 'Refinancement' },
  { value: 'amenagement_foncier', label: 'Aménagement Foncier' },
];

const DPE_OPTIONS = [
  { value: 'dpe_current_a', label: 'A' },
  { value: 'dpe_current_b', label: 'B' },
  { value: 'dpe_current_c', label: 'C' },
  { value: 'dpe_current_d', label: 'D' },
  { value: 'dpe_current_e', label: 'E' },
  { value: 'dpe_current_f', label: 'F (Passoire thermique)' },
  { value: 'dpe_current_g', label: 'G' },
];

const DPE_TARGET_OPTIONS = [
  { value: 'dpe_target_a', label: 'A' },
  { value: 'dpe_target_b', label: 'B' },
  { value: 'dpe_target_c', label: 'C' },
  { value: 'dpe_target_d', label: 'D' },
];

const PERMIT_OPTIONS = [
  { value: 'obtenu_purge', label: 'Permis Obtenu & Purgé de tout recours' },
  { value: 'obtenu_non_purge', label: 'Permis Obtenu mais recours possible' },
  { value: 'depose', label: 'Permis Déposé (Instruction en cours)' },
];

export default function StepProject() {
  const navigate = useNavigate();
  const {
    properties, selectedPropertyId, project, files, errors,
    selectProperty, clearProperty, updateProject, addPhotos, removePhoto, getSelectedProperty,
  } = useProjectFormStore();

  const selectedProp = getSelectedProperty();
  const selectedAttrs = selectedProp ? (selectedProp.attributes || selectedProp) : null;

  const isPromotion = project.operation_type === 'promotion_immobiliere';
  const isMdb = project.operation_type === 'marchand_de_biens';
  const showPermitDetails = project.permit_status === 'obtenu_purge' || project.permit_status === 'obtenu_non_purge';

  const propertyOptions = properties
    .filter((p) => String(p.id) !== selectedPropertyId)
    .map((p) => {
      const a = p.attributes || p;
      return { value: String(p.id), label: `${a.title} — ${a.city} (${a.property_type})` };
    });

  const handleSelectProperty = (e) => {
    if (e.target.value) selectProperty(e.target.value);
  };

  const handleAddPhotos = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) addPhotos(newFiles);
    e.target.value = '';
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.25rem' }}>Caractéristiques du Projet</h3>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Sélectionnez un bien immobilier puis complétez les détails du projet.
      </p>

      {/* ---- Property Selector ---- */}
      <div className="form-section" style={{ marginBottom: '1.5rem' }}>
        <div className="form-section-title">Bien immobilier associé *</div>

        {properties.length === 0 ? (
          /* No properties — prompt to create one */
          <div style={{
            padding: '2rem', textAlign: 'center', border: '2px dashed var(--border)',
            borderRadius: '8px', background: 'var(--bg-secondary)',
          }}>
            <Building size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Aucun bien immobilier trouvé. Créez un bien avant de soumettre un projet.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/properties')}
            >
              <Plus size={16} /> Créer un bien immobilier
            </button>
          </div>
        ) : selectedProp ? (
          /* Selected property card */
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
          }}>
            <div>
              <strong>{selectedAttrs.title}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                {selectedAttrs.city} — {selectedAttrs.property_type}
                {selectedAttrs.surface_area_sqm ? ` — ${selectedAttrs.surface_area_sqm} m²` : ''}
              </span>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={clearProperty}
              aria-label="Retirer"
              style={{ color: 'var(--danger)' }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Property dropdown */
          <>
            <FormSelect
              value=""
              onChange={handleSelectProperty}
              placeholder="-- Sélectionner un bien --"
              options={propertyOptions}
              className={errors.selectedPropertyId ? 'error' : ''}
            />
            {errors.selectedPropertyId && <span className="error-message">{errors.selectedPropertyId}</span>}
            <span className="form-hint">Les champs ci-dessous seront pré-remplis à partir du bien sélectionné.</span>
          </>
        )}
      </div>

      <div className="divider" />

      {/* ---- Project fields (auto-filled from property, editable) ---- */}

      {/* Project Name */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label>Nom de l'opération *</label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProject('title', e.target.value)}
            placeholder="Ex: Résidence Les Lilas"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>
      </div>

      {/* Description */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label>Résumé de l'opération *</label>
          <textarea
            value={project.description}
            onChange={(e) => updateProject('description', e.target.value)}
            placeholder="Décrivez l'opportunité (ex: Achat d'un immeuble de 4 lots pour revente à la découpe après rénovation)"
            rows={3}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
      </div>

      {/* Address */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label>Adresse Complète *</label>
          <input
            type="text"
            value={project.address_line1}
            onChange={(e) => updateProject('address_line1', e.target.value)}
            placeholder="12 rue de la Paix, 75000 Paris"
            className={errors.address_line1 ? 'error' : ''}
          />
          {errors.address_line1 && <span className="error-message">{errors.address_line1}</span>}
        </div>
      </div>

      {/* Surface + Asset Type */}
      <div className="form-row">
        <div className="form-group">
          <label>Surface Actuelle / Terrain (m²) *</label>
          <input
            type="number"
            value={project.surface_area_sqm}
            onChange={(e) => updateProject('surface_area_sqm', e.target.value)}
            placeholder="Ex: 850"
            className={errors.surface_area_sqm ? 'error' : ''}
          />
          {errors.surface_area_sqm && <span className="error-message">{errors.surface_area_sqm}</span>}
        </div>
        <div className="form-group">
          <label>Type d'Actif *</label>
          <FormSelect
            value={project.property_type}
            onChange={(e) => updateProject('property_type', e.target.value)}
            name="property_type"
            placeholder="Sélectionner..."
            options={ASSET_TYPE_OPTIONS}
            className={errors.property_type ? 'error' : ''}
          />
          {errors.property_type && <span className="error-message">{errors.property_type}</span>}
        </div>
      </div>

      {/* Photos Upload */}
      <div className="form-group">
        <label>Photos de l'existant / Plans *</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', border: '2px dashed var(--border)',
              borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)',
            }}
          >
            <ImagePlus size={20} />
            Ajouter des photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddPhotos}
              style={{ display: 'none' }}
            />
          </label>
          {files.photos.length > 0 && (
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {files.photos.length} fichier{files.photos.length > 1 ? 's' : ''} sélectionné{files.photos.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {files.photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {files.photos.map((photo, index) => (
              <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                <img
                  src={URL.createObjectURL(photo)}
                  alt={photo.name}
                  style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operation Type */}
      <div className="form-row">
        <div className="form-group">
          <label>Type d'Opération *</label>
          <FormSelect
            value={project.operation_type}
            onChange={(e) => updateProject('operation_type', e.target.value)}
            name="operation_type"
            options={OPERATION_TYPE_OPTIONS}
          />
        </div>
      </div>

      {/* Conditional: Promotion fields */}
      {isPromotion && (
        <div className="form-row" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="form-group">
            <label>Surface de Plancher (SDP m²)</label>
            <input
              type="number"
              value={project.floor_area_sqm}
              onChange={(e) => updateProject('floor_area_sqm', e.target.value)}
              placeholder="Ex: 1200"
            />
          </div>
          <div className="form-group">
            <label>Nombre de Lots</label>
            <input
              type="number"
              value={project.number_of_lots}
              onChange={(e) => updateProject('number_of_lots', e.target.value)}
              placeholder="Ex: 24"
            />
          </div>
        </div>
      )}

      {/* Conditional: MdB fields */}
      {isMdb && (
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="is_land_division"
              checked={project.is_land_division}
              onChange={(e) => updateProject('is_land_division', e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="is_land_division" style={{ margin: 0, cursor: 'pointer' }}>
              Opération de Division Parcellaire ?
            </label>
          </div>
          <span className="form-hint">Détachement de terrain à bâtir ou division en lots.</span>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>DPE Actuel</label>
              <FormSelect
                value={project.dpe_current}
                onChange={(e) => updateProject('dpe_current', e.target.value)}
                name="dpe_current"
                placeholder="Sélectionner..."
                options={DPE_OPTIONS}
              />
            </div>
            <div className="form-group">
              <label>DPE Visé (Après travaux)</label>
              <FormSelect
                value={project.dpe_target}
                onChange={(e) => updateProject('dpe_target', e.target.value)}
                name="dpe_target"
                placeholder="Sélectionner..."
                options={DPE_TARGET_OPTIONS}
              />
            </div>
          </div>
        </div>
      )}

      {/* Permit Status */}
      <div className="divider" />

      <div className="form-section">
        <div className="form-section-title">Statut Administratif (Permis) *</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {PERMIT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px',
                cursor: 'pointer', background: project.permit_status === opt.value ? 'var(--bg-secondary)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="permit_status"
                value={opt.value}
                checked={project.permit_status === opt.value}
                onChange={(e) => updateProject('permit_status', e.target.value)}
                style={{ width: 'auto' }}
              />
              <span style={{ fontSize: '0.85rem' }}>{opt.label}</span>
            </label>
          ))}
        </div>

        {showPermitDetails && (
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Date d'obtention</label>
              <input
                type="date"
                value={project.permit_date}
                onChange={(e) => updateProject('permit_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Numéro de PC</label>
              <input
                type="text"
                value={project.permit_number}
                onChange={(e) => updateProject('permit_number', e.target.value)}
                placeholder="PC 075 101 ..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
