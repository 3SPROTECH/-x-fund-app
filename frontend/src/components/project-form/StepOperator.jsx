import useProjectFormStore from '../../stores/useProjectFormStore';
import FormSelect from '../FormSelect';
import { Upload } from 'lucide-react';

const LEGAL_FORM_OPTIONS = [
  { value: 'sas', label: 'SAS / SASU' },
  { value: 'sarl', label: 'SARL / EURL' },
  { value: 'sci', label: 'SCI' },
  { value: 'snc', label: 'SNC' },
  { value: 'sccv', label: 'SCCV (Dédiée)' },
];

export default function StepOperator() {
  const { operator, files, errors, updateOperator, setFile } = useProjectFormStore();

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.25rem' }}>Identité de l'Opérateur</h3>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Informations légales sur la société porteuse du projet (KYB).
      </p>

      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label>Dénomination Sociale *</label>
          <input
            type="text"
            value={operator.company_name}
            onChange={(e) => updateOperator('company_name', e.target.value)}
            placeholder="Ex: SAS Immobilière du Sud"
            className={errors.company_name ? 'error' : ''}
          />
          {errors.company_name && <span className="error-message">{errors.company_name}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Numéro SIRET *</label>
          <input
            type="text"
            value={operator.siret}
            onChange={(e) => updateOperator('siret', e.target.value)}
            placeholder="14 chiffres"
            maxLength={14}
            className={errors.siret ? 'error' : ''}
          />
          {errors.siret && <span className="error-message">{errors.siret}</span>}
        </div>
        <div className="form-group">
          <label>Date de Création *</label>
          <input
            type="date"
            value={operator.company_creation_date}
            onChange={(e) => updateOperator('company_creation_date', e.target.value)}
            className={errors.company_creation_date ? 'error' : ''}
          />
          {errors.company_creation_date && <span className="error-message">{errors.company_creation_date}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Forme Juridique *</label>
          <FormSelect
            value={operator.legal_form}
            onChange={(e) => updateOperator('legal_form', e.target.value)}
            name="legal_form"
            placeholder="Sélectionner..."
            options={LEGAL_FORM_OPTIONS}
            className={errors.legal_form ? 'error' : ''}
          />
          {errors.legal_form && <span className="error-message">{errors.legal_form}</span>}
        </div>
        <div className="form-group">
          <label>Représentant Légal *</label>
          <input
            type="text"
            value={operator.legal_representative_name}
            onChange={(e) => updateOperator('legal_representative_name', e.target.value)}
            placeholder="Nom et Prénom du dirigeant"
            className={errors.legal_representative_name ? 'error' : ''}
          />
          {errors.legal_representative_name && <span className="error-message">{errors.legal_representative_name}</span>}
        </div>
      </div>

      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label>Siège Social *</label>
          <input
            type="text"
            value={operator.headquarters_address}
            onChange={(e) => updateOperator('headquarters_address', e.target.value)}
            placeholder="Adresse du siège social de la société"
            className={errors.headquarters_address ? 'error' : ''}
          />
          {errors.headquarters_address && <span className="error-message">{errors.headquarters_address}</span>}
        </div>
      </div>

      <div className="divider" />

      <div className="form-section">
        <div className="form-section-title">Track Record & Documents</div>
        <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label>Opérations réalisées</label>
            <input
              type="number"
              min="0"
              value={operator.completed_operations_count}
              onChange={(e) => updateOperator('completed_operations_count', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Volume géré (€)</label>
            <input
              type="number"
              min="0"
              value={operator.managed_volume_cents}
              onChange={(e) => updateOperator('managed_volume_cents', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Défauts (%)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={operator.default_rate_percent}
              onChange={(e) => updateOperator('default_rate_percent', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>K-bis (Moins de 3 mois) *</label>
          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '8px',
              cursor: 'pointer', background: 'var(--bg-secondary)', minHeight: '100px',
            }}
          >
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {files.kbis ? files.kbis.name : 'K-Bis (PDF/JPG)'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile('kbis', e.target.files[0] || null)}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="form-group">
          <label>Plaquette Présentation / CV *</label>
          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '8px',
              cursor: 'pointer', background: 'var(--bg-secondary)', minHeight: '100px',
            }}
          >
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {files.presentation_deck ? files.presentation_deck.name : 'Présentation (PDF)'}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile('presentation_deck', e.target.files[0] || null)}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
