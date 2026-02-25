import { formatCents } from '../../../utils';

const COMMERCIALIZATION_LABELS = {
  vefa: 'Vente sur plan (VEFA)', agences_locales: 'Agences immobilieres locales',
  marketing_digital: 'Marketing digital cible', vente_decoupe: 'Vente a la decoupe',
  pre_commercialisation: 'Pre-commercialisation reseau prive',
  vente_lots: 'Vente par lots', mandat_agence: 'Mandat agence',
};

const DOSSIER_LABELS = {
  etude_marche: 'Etude de marche realisee', previsionnel: 'Previsionnel financier disponible',
  devis_valides: 'Devis de travaux valides', permis_purge: 'Permis de construire purge',
  business_plan_valide: 'Business plan valide', financement_bancaire_obtenu: 'Financement bancaire obtenu',
};

function Field({ label, value, full, pre }) {
  return (
    <div className={`an-field${full ? ' full' : ''}`}>
      <span className="an-field-label">{label}</span>
      {value ? (
        <span className={`an-field-value${pre ? ' pre' : ''}`}>{value}</span>
      ) : (
        <span className="an-field-value muted">Non renseigne</span>
      )}
    </div>
  );
}

function Structure({ fin, attrs }) {
  const totalFunding = fin.totalFunding
    ? `${parseFloat(fin.totalFunding).toLocaleString('fr-FR')} €`
    : formatCents(attrs.total_amount_cents);
  const strategies = fin.commercializationStrategy || attrs.commercialization_strategy || [];
  const dossierStatus = fin.financialDossierStatus || attrs.financial_dossier_status || [];

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Financement</div>
        <div className="an-kpi-row">
          <div className="an-kpi">
            <div className="an-kpi-label">Montant recherche</div>
            <div className="an-kpi-value">{totalFunding}</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-label">Marge brute</div>
            <div className="an-kpi-value">{fin.grossMargin || attrs.gross_yield_percent || '—'}%</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-label">Rendement net</div>
            <div className="an-kpi-value success">{fin.netYield || attrs.net_yield_percent || '—'}%</div>
          </div>
        </div>
        <div className="an-fields">
          <Field label="Justification du rendement" value={fin.yieldJustification || attrs.yield_justification} full pre />
        </div>
      </div>

      {strategies.length > 0 && (
        <div className="an-section">
          <div className="an-section-title">Strategie de commercialisation</div>
          <div className="an-badge-list">
            {strategies.map((s) => (
              <span key={s} className="an-badge">{COMMERCIALIZATION_LABELS[s] || s}</span>
            ))}
          </div>
        </div>
      )}

      {dossierStatus.length > 0 && (
        <div className="an-section">
          <div className="an-section-title">Etat du dossier</div>
          <div className="an-badge-list">
            {dossierStatus.map((d) => (
              <span key={d} className="an-badge green">{DOSSIER_LABELS[d] || d}</span>
            ))}
          </div>
        </div>
      )}

      {fin.additionalInfo && (
        <div className="an-section">
          <div className="an-section-title">Complements</div>
          <span className="an-field-value pre">{fin.additionalInfo}</span>
        </div>
      )}
    </>
  );
}

function Projections({ snapshot, attrs }) {
  const proj = snapshot.projections || {};

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Parametres de collecte</div>
        <div className="an-kpi-row">
          <div className="an-kpi">
            <div className="an-kpi-label">Apport porteur</div>
            <div className="an-kpi-value">{proj.contributionPct != null ? `${proj.contributionPct}%` : '—'}</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-label">Duree</div>
            <div className="an-kpi-value">{proj.durationMonths || attrs.duration_months || '—'} mois</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-label">Prix par part</div>
            <div className="an-kpi-value">{formatCents(attrs.share_price_cents)}</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-label">Nombre de parts</div>
            <div className="an-kpi-value">{attrs.total_shares || '—'}</div>
          </div>
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">Montants cles</div>
        <div className="an-fields">
          <Field label="Montant total" value={formatCents(attrs.total_amount_cents)} />
          <Field label="Investissement minimum" value={formatCents(attrs.min_investment_cents)} />
          <Field label="Fonds propres" value={formatCents(attrs.equity_cents)} />
          <Field label="Pret bancaire" value={formatCents(attrs.bank_loan_cents)} />
          <Field label="Frais de notaire" value={formatCents(attrs.notary_fees_cents)} />
          <Field label="Budget travaux" value={formatCents(attrs.works_budget_cents)} />
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">Calendrier</div>
        <div className="an-fields">
          <Field label="Debut collecte" value={attrs.funding_start_date ? new Date(attrs.funding_start_date).toLocaleDateString('fr-FR') : null} />
          <Field label="Fin collecte" value={attrs.funding_end_date ? new Date(attrs.funding_end_date).toLocaleDateString('fr-FR') : null} />
          <Field label="Acquisition prevue" value={attrs.planned_acquisition_date ? new Date(attrs.planned_acquisition_date).toLocaleDateString('fr-FR') : null} />
          <Field label="Livraison prevue" value={attrs.planned_delivery_date ? new Date(attrs.planned_delivery_date).toLocaleDateString('fr-FR') : null} />
          <Field label="Remboursement prevu" value={attrs.planned_repayment_date ? new Date(attrs.planned_repayment_date).toLocaleDateString('fr-FR') : null} />
        </div>
      </div>
    </>
  );
}

export default function TabFinances({ subTab, project }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};
  const fin = snapshot.financialStructure || {};

  switch (subTab) {
    case 0: return <Structure fin={fin} attrs={attrs} />;
    case 1: return <Projections snapshot={snapshot} attrs={attrs} />;
    default: return <Structure fin={fin} attrs={attrs} />;
  }
}
