import { MapPin } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';

export default function AssetDetails() {
  const assets = useProjectFormStore((s) => s.assets);
  const selectedAssetIndex = useProjectFormStore((s) => s.selectedAssetIndex);
  const updateAssetDetails = useProjectFormStore((s) => s.updateAssetDetails);
  const location = useProjectFormStore((s) => s.location);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  const asset = assets[selectedAssetIndex];
  if (!asset) return null;
  const details = asset.details;

  return (
    <div>
      <div className="pf-readonly-header">
        <MapPin size={20} />
        <div>
          <h3>{location.address || asset.label}</h3>
          <span className="pf-text-muted">Adresse validée à l'étape 1.2</span>
        </div>
      </div>

      <h3 className="pf-section-title">Acquisition et Calendrier</h3>
      <FormGrid>
        <FormField label="Êtes-vous déjà propriétaire de ce bien ? (Refinancement)">
          <div className="pf-checkbox-grid">
            <label>
              <input type="radio" name="refinancing" checked={details.isRefinancing === true} onChange={() => updateAssetDetails('isRefinancing', true)} />
              Oui
            </label>
            <label>
              <input type="radio" name="refinancing" checked={details.isRefinancing === false} onChange={() => updateAssetDetails('isRefinancing', false)} />
              Non
            </label>
          </div>
        </FormField>
        {!details.isRefinancing && (
          <FormField label="Date projetée pour la signature de l'acte authentique" error={flags['assetDetails.signatureDate']}>
            <input type="date" value={details.signatureDate} onChange={(e) => updateAssetDetails('signatureDate', e.target.value)} />
          </FormField>
        )}
      </FormGrid>
      <FormGrid>
        <FormField label="Nombre de lots pour cette adresse" error={flags['assetDetails.lotCount']}>
          <input type="number" min="1" value={details.lotCount} onChange={(e) => updateAssetDetails('lotCount', e.target.value)} placeholder="Ex: 4" />
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">Travaux et Rénovation</h3>
      <FormGrid>
        <FormField label="Des travaux sont-ils nécessaires ?">
          <div className="pf-checkbox-grid">
            <label>
              <input type="radio" name="worksNeeded" checked={details.worksNeeded === true} onChange={() => updateAssetDetails('worksNeeded', true)} />
              Oui
            </label>
            <label>
              <input type="radio" name="worksNeeded" checked={details.worksNeeded === false} onChange={() => updateAssetDetails('worksNeeded', false)} />
              Non
            </label>
          </div>
        </FormField>
        {details.worksNeeded && (
          <FormField label="Durée projetée des travaux (en mois)" error={flags['assetDetails.worksDuration']}>
            <input type="number" min="1" value={details.worksDuration} onChange={(e) => updateAssetDetails('worksDuration', e.target.value)} placeholder="Ex: 6" />
          </FormField>
        )}
      </FormGrid>
    </div>
  );
}
