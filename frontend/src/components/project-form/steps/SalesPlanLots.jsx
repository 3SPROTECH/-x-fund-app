import { Plus, Trash2, Paperclip } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormSelect from '../../FormSelect';

function LotCard({ lot, index, onUpdate, onRemove }) {
  const addDocumentFile = useProjectFormStore((s) => s.addDocumentFile);
  const isPrecom = lot.preCommercialized === 'oui';
  const isRented = lot.rented === 'oui';
  const showDocs = isPrecom || isRented;
  const showMetrics = !isPrecom && !isRented;

  return (
    <div className="pf-lot-card">
      <div className="pf-lot-card-header">
        <div>
          <div className="pf-lot-card-title">Lot {index + 1}</div>
          <div className="pf-lot-card-summary">
            {showDocs
              ? 'Justificatifs requis'
              : `${lot.surface || '—'} m² · ${(lot.prix || 0).toLocaleString('fr-FR')} €`
            }
          </div>
        </div>
        <button type="button" className="pf-icon-btn pf-btn-remove" onClick={() => onRemove(lot.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="pf-lot-card-body">
        <div className="pf-form-grid">
          <div className="pf-form-group">
            <label>Est-il pré-commercialisé ?</label>
            <FormSelect value={lot.preCommercialized} options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]} onChange={(e) => onUpdate(lot.id, 'preCommercialized', e.target.value)} />
          </div>
          <div className="pf-form-group">
            <label>Est-il loué ?</label>
            <FormSelect value={lot.rented} options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]} onChange={(e) => onUpdate(lot.id, 'rented', e.target.value)} />
          </div>
        </div>

        {isPrecom && (
          <div className="pf-form-grid">
            <div className="pf-form-group">
              <label>Promesse de vente (référence)</label>
              <input type="text" value={lot.promesseRef} onChange={(e) => onUpdate(lot.id, 'promesseRef', e.target.value)} placeholder="Référence du document" />
            </div>
            <div className="pf-form-group">
              {lot.promesseFileName ? (
                <div className="pf-file-upload-btn" style={{ borderStyle: 'solid', borderColor: '#86efac', background: '#f0fdf4', color: '#15803d' }}>
                  <Paperclip size={14} />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lot.promesseFileName}</span>
                </div>
              ) : (
                <label className="pf-file-upload-btn">
                  <Paperclip size={14} /> Fichier promesse de vente
                  <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpdate(lot.id, 'promesseFileName', f.name); addDocumentFile(f.name, f); } }} />
                </label>
              )}
            </div>
          </div>
        )}

        {isRented && (
          <div className="pf-form-grid">
            <div className="pf-form-group">
              <label>Bail (référence)</label>
              <input type="text" value={lot.bailRef} onChange={(e) => onUpdate(lot.id, 'bailRef', e.target.value)} placeholder="Référence du bail" />
            </div>
            <div className="pf-form-group">
              {lot.bailFileName ? (
                <div className="pf-file-upload-btn" style={{ borderStyle: 'solid', borderColor: '#86efac', background: '#f0fdf4', color: '#15803d' }}>
                  <Paperclip size={14} />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lot.bailFileName}</span>
                </div>
              ) : (
                <label className="pf-file-upload-btn">
                  <Paperclip size={14} /> Fichier bail
                  <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpdate(lot.id, 'bailFileName', f.name); addDocumentFile(f.name, f); } }} />
                </label>
              )}
            </div>
          </div>
        )}

        {showMetrics && (
          <div className="pf-form-grid">
            <div className="pf-form-group">
              <label>Superficie habitable (m²)</label>
              <input type="number" min="0" step="0.1" value={lot.surface} onChange={(e) => onUpdate(lot.id, 'surface', e.target.value)} placeholder="Ex: 64" />
            </div>
            <div className="pf-form-group">
              <label>Prix projeté de revente (€)</label>
              <div className="pf-readonly-chip">
                <small>Calculé automatiquement</small>
                {(lot.prix || 0).toLocaleString('fr-FR')} €
              </div>
            </div>
            <div className="pf-form-group">
              <label>Prix au m² (€)</label>
              <div className="pf-readonly-chip">
                <small>Calculé automatiquement</small>
                {(lot.prixM2 || 0).toLocaleString('fr-FR')} €/m²
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalesPlanLots() {
  const assets = useProjectFormStore((s) => s.assets);
  const selectedAssetIndex = useProjectFormStore((s) => s.selectedAssetIndex);
  const addLot = useProjectFormStore((s) => s.addLot);
  const removeLot = useProjectFormStore((s) => s.removeLot);
  const updateLot = useProjectFormStore((s) => s.updateLot);
  const getAggregatedCosts = useProjectFormStore((s) => s.getAggregatedCosts);

  const asset = assets[selectedAssetIndex];
  if (!asset) return null;

  const lots = asset.lots;
  const totalRecettes = asset.recettesTotal || 0;
  const totalCosts = getAggregatedCosts();
  const bilan = totalRecettes - totalCosts;

  return (
    <div>
      <div className="pf-lots-toolbar">
        <span className="pf-lots-meta">Lot Gallery — {lots.length} lot(s)</span>
        <button type="button" className="pf-action-btn-text" onClick={addLot}>
          <Plus size={16} /> Ajouter un lot
        </button>
      </div>

      <div className="pf-lot-grid">
        {lots.map((lot, index) => (
          <LotCard key={lot.id} lot={lot} index={index} onUpdate={updateLot} onRemove={removeLot} />
        ))}
      </div>

      <div className="pf-floating-total pf-floating-total--split">
        <div className="pf-floating-total-block">
          <span>Total des recettes</span>
          <strong>{totalRecettes.toLocaleString('fr-FR')} €</strong>
        </div>
        <div className="pf-floating-total-separator" />
        <div className="pf-floating-total-block">
          <span>Bilan prévisionnel (Recettes - Coûts)</span>
          <strong className={bilan >= 0 ? 'positive' : 'negative'}>{bilan.toLocaleString('fr-FR')} €</strong>
        </div>
      </div>
    </div>
  );
}
