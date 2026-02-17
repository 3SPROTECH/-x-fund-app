import useProjectFormStore from '../../stores/useProjectFormStore';
import FormSelect from '../FormSelect';

const BANK_STATUS_OPTIONS = [
  { value: 'en_negociation', label: 'En négociation' },
  { value: 'accord_principe', label: 'Accord de principe' },
  { value: 'offre_editee', label: 'Offre de prêt éditée' },
  { value: 'offre_signee', label: 'Offre signée' },
];

const FREQUENCY_OPTIONS = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'annuel', label: 'Annuel' },
  { value: 'in_fine', label: 'In Fine (Au terme)' },
];

export default function StepFinance() {
  const { finance, errors, updateFinance, getTotalCost } = useProjectFormStore();

  const totalCost = getTotalCost();
  const showBankDetails = parseFloat(finance.bank_loan_cents) > 0;

  // Parsed values for shares
  const totalAmount = parseFloat(finance.total_amount_cents) || 0;
  const sharePrice = parseFloat(finance.share_price_cents) || 0;
  const totalShares = parseInt(finance.total_shares) || 0;
  const minInvestment = parseFloat(finance.min_investment_cents) || 0;
  const minSharesRequired = (sharePrice > 0 && minInvestment > 0) ? Math.ceil(minInvestment / sharePrice) : null;

  // Bidirectional auto-calculation handlers
  const handleTotalAmountChange = (value) => {
    updateFinance('total_amount_cents', value);
    const amount = parseFloat(value) || 0;
    const sp = parseFloat(finance.share_price_cents) || 0;
    if (amount > 0 && sp > 0) {
      updateFinance('total_shares', String(Math.floor(amount / sp)));
    }
  };

  const handleSharePriceChange = (value) => {
    updateFinance('share_price_cents', value);
    const sp = parseFloat(value) || 0;
    if (sp > 0 && totalAmount > 0) {
      updateFinance('total_shares', String(Math.floor(totalAmount / sp)));
    }
  };

  const handleTotalSharesChange = (value) => {
    updateFinance('total_shares', value);
    const shares = parseInt(value) || 0;
    if (shares > 0 && totalAmount > 0) {
      const computed = parseFloat((totalAmount / shares).toFixed(2));
      updateFinance('share_price_cents', String(computed));
    }
  };

  const minInvestWarning = (() => {
    if (minInvestment > 0 && sharePrice > 0 && minInvestment < sharePrice) {
      return `L'investissement minimum doit être ≥ au prix d'une part (${sharePrice.toLocaleString('fr-FR')} €)`;
    }
    if (minInvestment > 0 && totalAmount > 0 && minInvestment > totalAmount) {
      return `L'investissement minimum ne peut pas dépasser le montant total`;
    }
    return null;
  })();

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.25rem' }}>Montage Financier</h3>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Structure détaillée des coûts et ressources.
      </p>

      {/* Costs Section */}
      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <div className="form-section-title">Besoins (Dépenses)</div>

        <div className="form-row">
          <div className="form-group">
            <label>Prix d'Acquisition (Foncier) (€)</label>
            <input
              type="number"
              value={finance.acquisition_price_cents}
              onChange={(e) => updateFinance('acquisition_price_cents', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Frais de Notaire (€)</label>
            <input
              type="number"
              value={finance.notary_fees_cents}
              onChange={(e) => updateFinance('notary_fees_cents', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Budget Travaux / Construction (€)</label>
            <input
              type="number"
              value={finance.works_budget_cents}
              onChange={(e) => updateFinance('works_budget_cents', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Frais Financiers & Honoraires (€)</label>
            <input
              type="number"
              value={finance.financial_fees_cents}
              onChange={(e) => updateFinance('financial_fees_cents', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Coût de Revient Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            {totalCost.toLocaleString('fr-FR')} €
          </span>
        </div>
      </div>

      {/* Resources */}
      <div className="form-row">
        <div className="form-group">
          <label>Montant Recherché (Crowdfunding) *</label>
          <input
            type="number"
            max="5000000"
            value={finance.total_amount_cents}
            onChange={(e) => handleTotalAmountChange(e.target.value)}
            placeholder="500000"
            className={errors.total_amount_cents ? 'error' : ''}
          />
          <span className="form-hint">Max 5M€ (Règlementation ECSP)</span>
          {errors.total_amount_cents && <span className="error-message">{errors.total_amount_cents}</span>}
        </div>
        <div className="form-group">
          <label>Fonds Propres Opérateur (€)</label>
          <input
            type="number"
            value={finance.equity_cents}
            onChange={(e) => updateFinance('equity_cents', e.target.value)}
            placeholder="100000"
          />
          <span className="form-hint">10% min. recommandé</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Crédit Bancaire Senior (€)</label>
          <input
            type="number"
            value={finance.bank_loan_cents}
            onChange={(e) => updateFinance('bank_loan_cents', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="form-group">
          <label>Chiffre d'Affaires Prévisionnel (HT) *</label>
          <input
            type="number"
            value={finance.projected_revenue_cents}
            onChange={(e) => updateFinance('projected_revenue_cents', e.target.value)}
            placeholder="Valeur de revente totale"
            className={errors.projected_revenue_cents ? 'error' : ''}
          />
          {errors.projected_revenue_cents && <span className="error-message">{errors.projected_revenue_cents}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Marge Opérationnelle Attendue (€)</label>
          <input
            type="number"
            value={finance.projected_margin_cents}
            onChange={(e) => updateFinance('projected_margin_cents', e.target.value)}
            placeholder="Ex: 170000"
          />
        </div>
      </div>

      {/* Conditional Bank Details */}
      {showBankDetails && (
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
          <div className="form-section-title">Détails Bancaires</div>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de la Banque</label>
              <input
                type="text"
                value={finance.bank_name}
                onChange={(e) => updateFinance('bank_name', e.target.value)}
                placeholder="Ex: BNP, CIC..."
              />
            </div>
            <div className="form-group">
              <label>État d'avancement</label>
              <FormSelect
                value={finance.bank_loan_status}
                onChange={(e) => updateFinance('bank_loan_status', e.target.value)}
                name="bank_loan_status"
                placeholder="Sélectionner..."
                options={BANK_STATUS_OPTIONS}
              />
            </div>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Shares / Parts Structure */}
      <div className="form-section">
        <div className="form-section-title">Structuration des Parts *</div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          Modifiez le prix par part ou le nombre de parts — l'autre champ se recalcule automatiquement.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Prix par Part (€) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={finance.share_price_cents}
              onChange={(e) => handleSharePriceChange(e.target.value)}
              placeholder="Ex: 100"
              className={errors.share_price_cents ? 'error' : ''}
            />
            {errors.share_price_cents && <span className="error-message">{errors.share_price_cents}</span>}
          </div>
          <div className="form-group">
            <label>Nombre de Parts</label>
            <input
              type="number"
              min="1"
              value={finance.total_shares}
              onChange={(e) => handleTotalSharesChange(e.target.value)}
              placeholder="Auto-calculé"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Investissement Minimum (€) *</label>
            <input
              type="number"
              min="1"
              value={finance.min_investment_cents}
              onChange={(e) => updateFinance('min_investment_cents', e.target.value)}
              placeholder={sharePrice > 0 ? String(sharePrice) : 'Ex: 100'}
              className={errors.min_investment_cents ? 'error' : ''}
            />
            {minSharesRequired && minInvestment > 0 && (
              <span className="form-hint">
                = {minSharesRequired} part{minSharesRequired > 1 ? 's' : ''} minimum
              </span>
            )}
            {minInvestWarning && (
              <span className="error-message">{minInvestWarning}</span>
            )}
            {errors.min_investment_cents && <span className="error-message">{errors.min_investment_cents}</span>}
          </div>
          <div className="form-group">
            <label>Investissement Maximum (€)</label>
            <input
              type="number"
              min="0"
              value={finance.max_investment_cents}
              onChange={(e) => updateFinance('max_investment_cents', e.target.value)}
              placeholder="Optionnel"
            />
            <span className="form-hint">Laisser vide = pas de limite</span>
          </div>
        </div>

        {/* Summary card */}
        {sharePrice > 0 && totalAmount > 0 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Montant total</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {totalAmount.toLocaleString('fr-FR')} €
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nombre de parts</div>
                <div style={{ fontWeight: 700 }}>
                  {totalShares.toLocaleString('fr-FR')}
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Prix / part</div>
                <div style={{ fontWeight: 700 }}>
                  {sharePrice.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Investor Proposition */}
      <div className="form-section">
        <div className="form-section-title">Proposition aux Investisseurs</div>
        <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label>Taux Annuel (%)</label>
            <input
              type="number"
              step="0.1"
              value={finance.gross_yield_percent}
              onChange={(e) => updateFinance('gross_yield_percent', e.target.value)}
              placeholder="10.0"
            />
          </div>
          <div className="form-group">
            <label>Durée (Mois)</label>
            <input
              type="number"
              value={finance.duration_months}
              onChange={(e) => updateFinance('duration_months', e.target.value)}
              placeholder="24"
            />
          </div>
          <div className="form-group">
            <label>Périodicité</label>
            <FormSelect
              value={finance.payment_frequency}
              onChange={(e) => updateFinance('payment_frequency', e.target.value)}
              name="payment_frequency"
              placeholder="Sélectionner..."
              options={FREQUENCY_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
