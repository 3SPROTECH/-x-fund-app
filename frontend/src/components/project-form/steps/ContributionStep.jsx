import { AlertTriangle } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import DropZone from '../shared/DropZone';

export default function ContributionStep() {
  const projections = useProjectFormStore((s) => s.projections);
  const updateProjections = useProjectFormStore((s) => s.updateProjections);
  const getProjectionTotals = useProjectFormStore((s) => s.getProjectionTotals);

  const totals = getProjectionTotals();
  const showWarning = totals.warningRatio > 0 && totals.warningRatio < 1;

  return (
    <div>
      <div className="pf-power-card">
        <div className="pf-power-card-label">Engagement du porteur</div>
        <div className="pf-power-card-value">
          {totals.apport.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
        </div>
        <div className="pf-power-card-subtitle">
          {totals.contributionPct}% du coût total agrégé ({totals.totalCosts.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €)
        </div>
        <div className="pf-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={projections.contributionPct}
            onChange={(e) => updateProjections('contributionPct', parseInt(e.target.value))}
            className="pf-slider"
          />
          <div className="pf-slider-labels">
            <span>Minimum</span>
            <span>Auto-financement</span>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="pf-warning-alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Ajustez votre apport pour optimiser la rentabilité de l'opération.</strong>
            <div className="pf-text-muted">
              Indicateur revente / (coût - apport): {totals.warningRatio.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <h3 className="pf-section-title">Preuve des fonds propres</h3>
      <DropZone
        onFileSelect={(fileName) => updateProjections('proofFileName', fileName)}
        fileName={projections.proofFileName}
        placeholder="Déposez votre document ici ou cliquez pour sélectionner un fichier."
      />
    </div>
  );
}
