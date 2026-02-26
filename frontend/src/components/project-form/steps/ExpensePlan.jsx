import { Plus, Trash2, Paperclip } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import AccordionSection from '../shared/AccordionSection';

function CostRow({ item, onUpdate, onRemove, removable }) {
  const addDocumentFile = useProjectFormStore((s) => s.addDocumentFile);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate(item.id, 'hasJustificatif', true);
      onUpdate(item.id, 'justificatifName', file.name);
      addDocumentFile(file.name, file);
    }
  };

  return (
    <div className="pf-cost-row">
      {removable ? (
        <div className="pf-cost-row-label-col">
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate(item.id, 'label', e.target.value)}
            placeholder="Ex: Rénovation toiture"
            className="pf-cost-label-input"
          />
        </div>
      ) : (
        <div className="pf-cost-row-label-col">
          <span className="pf-cost-label">{item.label}</span>
        </div>
      )}
      <div className="pf-cost-row-amount-col">
        <input
          type="number"
          min="0"
          value={item.amount}
          onChange={(e) => onUpdate(item.id, 'amount', e.target.value)}
          placeholder="Montant (€)"
        />
      </div>
      {item.hasJustificatif && item.justificatifName ? (
        <div className="pf-file-upload-btn" style={{ borderStyle: 'solid', borderColor: '#86efac', background: '#f0fdf4', color: '#15803d' }}>
          <Paperclip size={14} />
          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.justificatifName}</span>
        </div>
      ) : (
        <label className="pf-file-upload-btn">
          <Paperclip size={14} />
          <span>Justificatif</span>
          <input type="file" onChange={handleFileChange} />
        </label>
      )}
      {removable && (
        <button type="button" className="pf-icon-btn pf-btn-remove" onClick={() => onRemove(item.id)}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function ExpensePlan() {
  const assets = useProjectFormStore((s) => s.assets);
  const selectedAssetIndex = useProjectFormStore((s) => s.selectedAssetIndex);
  const updateCostItem = useProjectFormStore((s) => s.updateCostItem);
  const addCostItem = useProjectFormStore((s) => s.addCostItem);
  const removeCostItem = useProjectFormStore((s) => s.removeCostItem);

  const asset = assets[selectedAssetIndex];
  if (!asset) return null;

  const { items, total } = asset.costs;
  const byCategory = (cat) => items.filter((i) => i.category === cat);

  const acqItems = byCategory('acquisition');
  const worksItems = byCategory('works');
  const expertItems = byCategory('expertise');
  const customItems = byCategory('custom');

  const subtotal = (cat) => byCategory(cat).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  // Auto-calculate notary fees when acquisition price changes
  const handleAcqUpdate = (id, field, value) => {
    updateCostItem(id, field, value);
    // If changing the acquisition price, auto-calc notary
    const isAcqPrice = acqItems[0]?.id === id && field === 'amount';
    if (isAcqPrice) {
      const notaryItem = acqItems[1];
      if (notaryItem) {
        const price = parseFloat(value) || 0;
        updateCostItem(notaryItem.id, 'amount', String(Math.round(price * 0.075)));
      }
    }
  };

  return (
    <div>
      <AccordionSection title="Coûts d'Acquisition" subtotal={subtotal('acquisition')} defaultOpen>
        {acqItems.map((item) => (
          <CostRow key={item.id} item={item} onUpdate={handleAcqUpdate} onRemove={removeCostItem} removable={false} />
        ))}
      </AccordionSection>

      <AccordionSection title="Budget Travaux" subtotal={subtotal('works')}>
        {worksItems.map((item) => (
          <CostRow key={item.id} item={item} onUpdate={updateCostItem} onRemove={removeCostItem} removable />
        ))}
        <button type="button" className="pf-action-btn-text" onClick={() => addCostItem('works')}>
          <Plus size={16} /> Ajouter un poste de travaux
        </button>
      </AccordionSection>

      <AccordionSection title="Honoraires & Expertise" subtotal={subtotal('expertise')}>
        {expertItems.map((item) => (
          <CostRow key={item.id} item={item} onUpdate={updateCostItem} onRemove={removeCostItem} removable={false} />
        ))}
      </AccordionSection>

      <AccordionSection title="Dépenses Supplémentaires" subtotal={subtotal('custom')}>
        {customItems.map((item) => (
          <CostRow key={item.id} item={item} onUpdate={updateCostItem} onRemove={removeCostItem} removable />
        ))}
        <button type="button" className="pf-action-btn-text" onClick={() => addCostItem('custom')}>
          <Plus size={16} /> Ajouter un poste
        </button>
      </AccordionSection>

      <div className="pf-floating-total">
        <span>Total des coûts du projet (Capex)</span>
        <strong>{total.toLocaleString('fr-FR')} €</strong>
      </div>
    </div>
  );
}
