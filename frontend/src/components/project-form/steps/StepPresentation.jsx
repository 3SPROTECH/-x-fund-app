import { useMemo } from 'react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import FormSelect from '../../FormSelect';

const PROPERTY_TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'immeuble', label: 'Immeuble' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'mixte', label: 'Autre' },
];

const OPERATION_TYPES = [
  { value: 'marchand_de_biens', label: 'Achat-revente' },
  { value: 'immobilier_locatif', label: 'Investissement locatif' },
  { value: 'promotion_immobiliere', label: 'Promotion immobilière' },
  { value: 'marchand_de_biens', label: 'Marchand de biens' },
];

const PROGRESS_STATUSES = [
  { value: 'searching_funding', label: 'En recherche de financement' },
  { value: 'under_compromise', label: 'Sous compromis' },
  { value: 'purchase_done', label: 'Achat acté' },
  { value: 'works_starting', label: 'Travaux à démarrer' },
  { value: 'works_in_progress', label: 'Travaux en cours' },
];

const EXPLOITATION_STRATEGIES = [
  { value: 'seasonal_rental', label: 'Location saisonnière (Airbnb)' },
  { value: 'classic_rental', label: 'Location classique' },
  { value: 'resale', label: 'Vente (Revente)' },
  { value: 'colocation', label: 'Colocation' },
];

const REVENUE_PERIODS = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'annual', label: 'Annuel' },
];

export default function StepPresentation() {
  const presentation = useProjectFormStore((s) => s.presentation);
  const update = useProjectFormStore((s) => s.updatePresentation);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  const equity = useMemo(() => {
    const before = parseFloat(presentation.valBefore) || 0;
    const after = parseFloat(presentation.valAfter) || 0;
    if (before <= 0 || after <= 0) return null;
    return after - before;
  }, [presentation.valBefore, presentation.valAfter]);

  return (
    <div>
      {/* Section 1: General */}
      <h3 className="pf-section-title">Informations générales</h3>
      <FormGrid>
        <FormField label="Nom du projet" error={flags['presentation.title']}>
          <input type="text" value={presentation.title} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Résidence Les Oliviers" />
        </FormField>
        <FormField label="État d'avancement actuel">
          <FormSelect value={presentation.progressStatus} options={PROGRESS_STATUSES} onChange={(e) => update('progressStatus', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Type de bien" error={flags['presentation.propertyType']}>
          <FormSelect value={presentation.propertyType} options={PROPERTY_TYPES} onChange={(e) => update('propertyType', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Type d'opération" error={flags['presentation.operationType']}>
          <FormSelect value={presentation.operationType} options={OPERATION_TYPES} onChange={(e) => update('operationType', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
      </FormGrid>

      {/* Section 2: Pitch */}
      <h3 className="pf-section-title">Pitch &amp; Description</h3>
      <FormGrid full>
        <FormField label="Brève description du projet (Pitch)" error={flags['presentation.pitch']}>
          <textarea rows={3} maxLength={150} value={presentation.pitch} onChange={(e) => update('pitch', e.target.value)} placeholder="Décrivez votre projet en quelques mots..." />
          <span className="pf-char-count">{(presentation.pitch || '').length}/150</span>
        </FormField>
      </FormGrid>

      {/* Section 3: Valorisation */}
      <h3 className="pf-section-title">Valorisation et Experts</h3>
      <FormGrid>
        <FormField label="Valeur estimée avant travaux (€)" error={flags['presentation.valBefore']}>
          <input type="number" min="0" value={presentation.valBefore} onChange={(e) => update('valBefore', e.target.value)} placeholder="Montant (€)" />
        </FormField>
        <FormField label="Valeur estimée après travaux (€)" error={flags['presentation.valAfter']}>
          <input type="number" min="0" value={presentation.valAfter} onChange={(e) => update('valAfter', e.target.value)} placeholder="Montant (€)" />
        </FormField>
        <FormField label="Expert immobilier (Nom/Cabinet)">
          <input type="text" value={presentation.expertName} onChange={(e) => update('expertName', e.target.value)} placeholder="Nom ou cabinet" />
        </FormField>
        <FormField label="Date de l'expertise">
          <input type="date" value={presentation.expertDate} onChange={(e) => update('expertDate', e.target.value)} />
        </FormField>
      </FormGrid>

      {/* Equity bump display */}
      {equity !== null && (
        <div className={`pf-equity-container ${equity >= 0 ? 'positive' : 'negative'}`}>
          <span className="pf-equity-icon">{equity >= 0 ? '↗' : '↘'}</span>
          <div>
            <strong>{equity >= 0 ? 'Plus-value brute estimée' : 'Perte/Déficit estimé'}</strong>
            <span className="pf-equity-value">{Math.abs(equity).toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      )}

      <FormGrid>
        <FormField label="Durée estimée du projet (en mois)">
          <input type="number" min="1" value={presentation.durationMonths} onChange={(e) => update('durationMonths', e.target.value)} placeholder="Ex: 18" />
        </FormField>
      </FormGrid>

      {/* Section 4: Strategy */}
      <h3 className="pf-section-title">Stratégie et Marché</h3>
      <FormGrid>
        <FormField label="Stratégie d'exploitation">
          <FormSelect value={presentation.exploitationStrategy} options={EXPLOITATION_STRATEGIES} onChange={(e) => update('exploitationStrategy', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Segment de marché visé">
          <input type="text" value={presentation.marketSegment} onChange={(e) => update('marketSegment', e.target.value)} placeholder="Étudiants, Jeunes actifs, Familles" />
        </FormField>
        <FormField label="Revenus projetés (€)">
          <input type="number" min="0" value={presentation.projectedRevenue} onChange={(e) => update('projectedRevenue', e.target.value)} placeholder="Montant (€)" />
        </FormField>
        <FormField label="Période">
          <FormSelect value={presentation.revenuePeriod} options={REVENUE_PERIODS} onChange={(e) => update('revenuePeriod', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
      </FormGrid>

      <FormGrid full>
        <FormField label="Informations complémentaires">
          <textarea rows={3} value={presentation.additionalInfo} onChange={(e) => update('additionalInfo', e.target.value)} placeholder="Tout détail utile..." />
        </FormField>
      </FormGrid>
    </div>
  );
}
