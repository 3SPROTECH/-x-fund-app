import useProjectFormStore from '../../stores/useProjectFormStore';
import FormSelect from '../FormSelect';
import { Upload } from 'lucide-react';

const EXIT_SCENARIO_OPTIONS = [
  { value: 'unit_sale', label: 'Vente à la découpe (Lots individuels)' },
  { value: 'block_sale', label: 'Vente en Bloc (Bailleur social / Institutionnel)' },
  { value: 'refinance_exit', label: 'Refinancement Bancaire Post-Construction' },
];

function FileUploadBox({ label, fileKey, accept = '.pdf' }) {
  const { files, setFile } = useProjectFormStore();
  const file = files[fileKey];

  return (
    <div className="form-group">
      <label>{label}</label>
      <label
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', border: '2px dashed var(--border)', borderRadius: '8px',
          cursor: 'pointer', background: 'var(--bg-secondary)', minHeight: '60px',
        }}
      >
        <Upload size={18} style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {file ? file.name : 'Cliquez pour sélectionner'}
        </span>
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(fileKey, e.target.files[0] || null)}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}

export default function StepCommercialization() {
  const { commercialization, files, errors, updateCommercialization, setFile } = useProjectFormStore();

  const isBlockSale = commercialization.exit_scenario === 'block_sale';

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.25rem' }}>Commercialisation & Sortie</h3>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Stratégie de remboursement des investisseurs.
      </p>

      {/* Pre-commercialization rate */}
      <div className="form-group">
        <label>Taux de pré-commercialisation actuel (%) *</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={commercialization.pre_commercialization_percent}
            onChange={(e) => updateCommercialization('pre_commercialization_percent', Number(e.target.value))}
            style={{ flex: 1, height: '6px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: '3rem', textAlign: 'right' }}>
            {commercialization.pre_commercialization_percent}%
          </span>
        </div>
      </div>

      {/* Price + Grid */}
      <div className="form-row">
        <div className="form-group">
          <label>Prix de sortie estimé (€ / m²)</label>
          <input
            type="number"
            value={commercialization.exit_price_per_sqm_cents}
            onChange={(e) => updateCommercialization('exit_price_per_sqm_cents', e.target.value)}
            placeholder="Ex: 4500"
          />
        </div>
        <FileUploadBox label="Grille de prix (Optionnel)" fileKey="price_grid" accept=".pdf,.xls,.xlsx" />
      </div>

      {/* Exit Scenario */}
      <div className="form-group">
        <label>Scénario de Sortie Principal *</label>
        <FormSelect
          value={commercialization.exit_scenario}
          onChange={(e) => updateCommercialization('exit_scenario', e.target.value)}
          name="exit_scenario"
          placeholder="Sélectionner..."
          options={EXIT_SCENARIO_OPTIONS}
          className={errors.exit_scenario ? 'error' : ''}
        />
        {errors.exit_scenario && <span className="error-message">{errors.exit_scenario}</span>}
      </div>

      {/* Conditional: Block sale LOI */}
      {isBlockSale && (
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <FileUploadBox label="Lettre d'intention acheteur en bloc (LOI)" fileKey="block_buyer_loi" />
        </div>
      )}

      <div className="divider" />

      {/* Documents */}
      <div className="form-section">
        <div className="form-section-title">Documents de sortie</div>
        <div className="form-row">
          <FileUploadBox label="Promesse de Vente (si disponible)" fileKey="sale_agreement" />
          <FileUploadBox label="Bilan Prévisionnel" fileKey="projected_balance_sheet" />
        </div>
      </div>

      <div className="divider" />

      {/* Planning */}
      <div className="form-section">
        <div className="form-section-title">Planning Prévisionnel</div>
        <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label>Date acquisition prévue</label>
            <input
              type="date"
              value={commercialization.planned_acquisition_date}
              onChange={(e) => updateCommercialization('planned_acquisition_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Date livraison prévue</label>
            <input
              type="date"
              value={commercialization.planned_delivery_date}
              onChange={(e) => updateCommercialization('planned_delivery_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Date remboursement prévue</label>
            <input
              type="date"
              value={commercialization.planned_repayment_date}
              onChange={(e) => updateCommercialization('planned_repayment_date', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
