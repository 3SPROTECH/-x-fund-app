import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import CheckboxGrid from '../shared/CheckboxGrid';

const COMMERCIALIZATION_OPTIONS = [
  { value: 'vefa', label: 'Vente sur plan (VEFA)' },
  { value: 'agences_locales', label: 'Agences immobilières locales' },
  { value: 'marketing_digital', label: 'Marketing digital ciblé' },
  { value: 'vente_decoupe', label: 'Vente à la découpe' },
  { value: 'pre_commercialisation', label: 'Pré-commercialisation réseau privé' },
];

const DOSSIER_STATUS_OPTIONS = [
  { value: 'etude_marche', label: 'Étude de marché réalisée' },
  { value: 'previsionnel', label: 'Prévisionnel financier détaillé disponible' },
  { value: 'devis_valides', label: 'Devis de travaux validés' },
  { value: 'permis_purge', label: 'Permis de construire purgé' },
];

export default function StepFinancialStructure() {
  const finance = useProjectFormStore((s) => s.financialStructure);
  const update = useProjectFormStore((s) => s.updateFinancialStructure);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  return (
    <div>
      <h3 className="pf-section-title">Demande de Financement</h3>
      <FormGrid>
        <FormField label="Montant total du financement recherché (€)" error={flags['financialStructure.totalFunding']}>
          <input type="number" min="0" value={finance.totalFunding} onChange={(e) => update('totalFunding', e.target.value)} placeholder="Ex: 500000" />
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">Rentabilité et Objectifs</h3>
      <FormGrid>
        <FormField label="Marge brute prévisionnelle (%)" error={flags['financialStructure.grossMargin']}>
          <input type="number" min="0" max="100" step="0.1" value={finance.grossMargin} onChange={(e) => update('grossMargin', e.target.value)} placeholder="Ex: 20" />
        </FormField>
        <FormField label="Rentabilité nette cible pour l'investisseur (% annuelle)" error={flags['financialStructure.netYield']}>
          <input type="number" min="0" max="100" step="0.1" value={finance.netYield} onChange={(e) => update('netYield', e.target.value)} placeholder="Ex: 8.5" />
        </FormField>
      </FormGrid>
      <FormGrid full>
        <FormField label="Justification du rendement">
          <textarea rows={2} maxLength={300} value={finance.yieldJustification} onChange={(e) => update('yieldJustification', e.target.value)} placeholder="Expliquez comment ce rendement sera atteint..." />
          <span className="pf-char-count">{(finance.yieldJustification || '').length}/300</span>
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">État d'Avancement</h3>
      <FormGrid>
        <FormField label="Stratégie de commercialisation">
          <CheckboxGrid
            options={COMMERCIALIZATION_OPTIONS}
            selected={finance.commercializationStrategy}
            onChange={(vals) => update('commercializationStrategy', vals)}
            name="commercialization"
          />
        </FormField>
        <FormField label="État du dossier financier">
          <CheckboxGrid
            options={DOSSIER_STATUS_OPTIONS}
            selected={finance.financialDossierStatus}
            onChange={(vals) => update('financialDossierStatus', vals)}
            name="dossier"
          />
        </FormField>
      </FormGrid>

      <FormGrid full>
        <FormField label="Informations complémentaires">
          <textarea rows={3} value={finance.additionalInfo} onChange={(e) => update('additionalInfo', e.target.value)} placeholder="Tout détail utile..." />
        </FormField>
      </FormGrid>
    </div>
  );
}
