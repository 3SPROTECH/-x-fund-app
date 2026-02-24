import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';

export default function FinancingSimulation({ defaultSharePriceCents = 10000 }) {
  const projections = useProjectFormStore((s) => s.projections);
  const updateProjections = useProjectFormStore((s) => s.updateProjections);
  const getProjectionTotals = useProjectFormStore((s) => s.getProjectionTotals);
  const consentGiven = useProjectFormStore((s) => s.consentGiven);
  const setConsentGiven = useProjectFormStore((s) => s.setConsentGiven);
  const submitted = useProjectFormStore((s) => s.submitted);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  const totals = getProjectionTotals();
  const fmt = (v) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  return (
    <div>
      <h3 className="pf-section-title">Configuration</h3>
      <FormGrid>
        <FormField label="Taux d'intérêt">
          <input type="text" disabled value="11% / an" />
        </FormField>
        <FormField label="Durée d'emprunt (mois)">
          <input
            type="number"
            min="1"
            value={projections.durationMonths}
            onChange={(e) => updateProjections('durationMonths', parseInt(e.target.value) || 12)}
          />
        </FormField>
      </FormGrid>

      <div className="pf-disclaimer">
        Ces modalités sont susceptibles d'évoluer suite à la phase d'analyse.
      </div>

      <div className="pf-receipt-card">
        <div className="pf-receipt-row">
          <span>Coûts de l'opération</span>
          <span>{fmt(totals.totalCosts)} €</span>
        </div>
        <div className="pf-receipt-row pf-receipt-highlight">
          <span>Apport (soustrait)</span>
          <span>-{fmt(totals.apport)} €</span>
        </div>
        <div className="pf-receipt-row">
          <span>Frais de collecte (6%)</span>
          <span>{fmt(totals.platformFee)} €</span>
        </div>
        <div className="pf-receipt-row">
          <span>Séquestre d'intérêts</span>
          <span>{fmt(totals.interestReserve)} €</span>
        </div>
        <div className="pf-receipt-divider" />
        <div className="pf-receipt-row pf-receipt-total">
          <span>Total Collecte</span>
          <span>{fmt(totals.totalCollecte)} €</span>
        </div>
      </div>

      <div className="pf-receipt-card" style={{ marginTop: 12 }}>
        <div className="pf-receipt-row">
          <span>Prix par part</span>
          <span>{fmt(defaultSharePriceCents / 100)} €</span>
        </div>
        <div className="pf-receipt-row">
          <span>Nombre de parts</span>
          <span>{fmt(Math.max(1, Math.floor((totals.totalCollecte * 100) / defaultSharePriceCents)))}</span>
        </div>
      </div>

      <div className="pf-payout-card">
        <div className="pf-payout-label">Montant qui vous sera reversé</div>
        <div className="pf-payout-value">{fmt(totals.montantReverse)} €</div>
      </div>

      {!submitted && (
        <>
          <h3 className="pf-section-title">Consentement</h3>
          <div className={`pf-consent-box ${flags['signature.consent'] ? 'error' : ''}`}>
            <label className="pf-consent-label">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
              />
              <span>Je certifie l'exactitude des informations fournies et souhaite soumettre mon dossier en analyse.</span>
            </label>
            {flags['signature.consent'] && (
              <div className="pf-error-message">{flags['signature.consent']}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
