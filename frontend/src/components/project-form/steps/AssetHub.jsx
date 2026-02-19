import { Check, Info, Plus } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';

export default function AssetHub() {
  const assets = useProjectFormStore((s) => s.assets);
  const addAsset = useProjectFormStore((s) => s.addAsset);
  const openAsset = useProjectFormStore((s) => s.openAsset);
  const updateAssetLabel = useProjectFormStore((s) => s.updateAssetLabel);

  return (
    <div>
      <div className="pf-hub-toolbar">
        <span className="pf-hub-count">Hub des adresses — {assets.length} adresse(s)</span>
        <button type="button" className="pf-action-btn-text" onClick={addAsset}>
          <Plus size={16} /> Ajouter une autre adresse
        </button>
      </div>

      <div className="pf-hub-grid">
        {assets.map((asset, index) => (
          <div key={asset.id} className={`pf-hub-card ${asset.completed ? 'complete' : 'incomplete'}`}>
            <div className="pf-hub-card-header">
              <input
                type="text"
                className="pf-hub-card-label"
                value={asset.label}
                onChange={(e) => updateAssetLabel(index, e.target.value)}
                placeholder="Nom de l'adresse"
              />
              <span className="pf-hub-card-id">Actif #{index + 1}</span>
            </div>
            <div className="pf-hub-card-body">
              <div className={`pf-status-badge ${asset.completed ? 'complete' : 'incomplete'}`}>
                {asset.completed ? <Check size={14} /> : <Info size={14} />}
                <span>{asset.completed ? 'Complet' : 'Incomplet'}</span>
              </div>
              <button type="button" className="pf-btn pf-btn-primary" onClick={() => openAsset(index)}>
                Ouvrir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
