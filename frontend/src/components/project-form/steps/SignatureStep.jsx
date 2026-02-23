import { useState } from 'react';
import { Paperclip, FileText, Download, CheckCircle, XCircle, Users, DollarSign, Shield, Calendar } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import { generateContractPdf } from '../../../utils/contractGenerator';

const fmtCents = (v) =>
  v != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v / 100)
    : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return '—'; }
};

const OPERATION_LABELS = {
  promotion_immobiliere: 'Promotion immobiliere',
  marchand_de_biens: 'Marchand de biens',
  rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere',
  immobilier_locatif: 'Immobilier locatif',
  transformation_usage: "Transformation d'usage",
  refinancement: 'Refinancement',
  amenagement_foncier: 'Amenagement foncier',
};

const GUARANTEE_ITEMS = [
  { key: 'has_first_rank_mortgage', label: 'Hypotheque de 1er rang' },
  { key: 'has_share_pledge', label: 'Nantissement de parts' },
  { key: 'has_fiducie', label: 'Fiducie' },
  { key: 'has_interest_escrow', label: 'Sequestre interets' },
  { key: 'has_works_escrow', label: 'Sequestre travaux' },
  { key: 'has_personal_guarantee', label: 'Caution personnelle' },
  { key: 'has_gfa', label: 'GFA' },
  { key: 'has_open_banking', label: 'Open Banking' },
];

const GUARANTEE_TYPE_LABELS = {
  hypotheque: 'Hypothèque',
  fiducie: 'Fiducie',
  garantie_premiere_demande: 'Garantie à première demande',
  caution_personnelle: 'Caution personnelle',
  garantie_corporate: 'Garantie corporate',
  aucune: 'Aucune',
};

const RISK_LEVEL_LABELS = {
  low: 'Faible risque',
  moderate: 'Risque modéré',
  high: 'Risque élevé',
  critical: 'Risque très élevé',
};

export default function SignatureStep() {
  const consentGiven = useProjectFormStore((s) => s.consentGiven);
  const setConsentGiven = useProjectFormStore((s) => s.setConsentGiven);
  const flags = useProjectFormStore((s) => s.flaggedFields);
  const projectStatus = useProjectFormStore((s) => s.projectStatus);
  const projectAttrs = useProjectFormStore((s) => s.projectAttributes);

  if (projectStatus === 'signing' && projectAttrs) {
    return <ContractView projectAttrs={projectAttrs} />;
  }

  return (
    <div>
      <h3 className="pf-section-title">Telechargement des documents</h3>
      <div className="pf-dropzone">
        <label className="pf-file-upload-btn" style={{ width: '100%', justifyContent: 'center', padding: '20px', borderWidth: '2px' }}>
          <Paperclip size={16} />
          <span>Deposez vos documents ici ou cliquez pour selectionner</span>
          <input type="file" multiple />
        </label>
      </div>

      <h3 className="pf-section-title">Consentement</h3>
      <div className={`pf-consent-box ${flags['signature.consent'] ? 'error' : ''}`}>
        <label className="pf-consent-label">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          <span>Je certifie l'exactitude des informations fournies.</span>
        </label>
        {flags['signature.consent'] && (
          <div className="pf-error-message">{flags['signature.consent']}</div>
        )}
      </div>
    </div>
  );
}

function ContractView({ projectAttrs }) {
  const [downloading, setDownloading] = useState(false);
  const a = projectAttrs;

  const handleDownload = () => {
    setDownloading(true);
    try {
      generateContractPdf(a);
    } catch (e) {
      console.error('Contract PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const guaranteeSummary = a.guarantee_type_summary || [];
  const hasNewGuarantees = guaranteeSummary.length > 0;
  const activeGuarantees = hasNewGuarantees ? guaranteeSummary.filter(g => g.type !== 'aucune').length : GUARANTEE_ITEMS.filter((g) => a[g.key]).length;

  return (
    <div className="contract-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="pf-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} /> Contrat d'investissement
        </h3>
        <button
          type="button"
          className="pf-nav-btn pf-btn-next"
          onClick={handleDownload}
          disabled={downloading}
          style={{ padding: '0.5rem 1rem' }}
        >
          <Download size={16} /> {downloading ? 'Generation...' : 'Telecharger PDF'}
        </button>
      </div>

      {/* Article 1 - Parties */}
      <div className="cv-section">
        <h4 className="cv-section-title"><Users size={16} /> Article 1 — Les Parties</h4>
        <div className="cv-grid cv-grid-2">
          <div className="cv-card">
            <span className="cv-label">Plateforme</span>
            <span className="cv-value">X-Fund</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Porteur de Projet</span>
            <span className="cv-value">{a.owner_name || '—'}</span>
          </div>
        </div>
      </div>

      {/* Article 2 - Objet */}
      <div className="cv-section">
        <h4 className="cv-section-title"><FileText size={16} /> Article 2 — Objet du Projet</h4>
        <div className="cv-grid cv-grid-2">
          <div className="cv-card">
            <span className="cv-label">Titre</span>
            <span className="cv-value">{a.title || '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Type d'operation</span>
            <span className="cv-value">{OPERATION_LABELS[a.operation_type] || a.operation_type || '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Bien</span>
            <span className="cv-value">{a.property_title || '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Localisation</span>
            <span className="cv-value">{a.property_city || '—'}</span>
          </div>
        </div>
        {a.description && (
          <div className="cv-description">{a.description}</div>
        )}
      </div>

      {/* Article 3 - Conditions Financieres */}
      <div className="cv-section">
        <h4 className="cv-section-title"><DollarSign size={16} /> Article 3 — Conditions Financieres</h4>
        <div className="cv-grid">
          <div className="cv-card">
            <span className="cv-label">Montant total</span>
            <span className="cv-value">{fmtCents(a.total_amount_cents)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Prix par part</span>
            <span className="cv-value">{fmtCents(a.share_price_cents)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Nombre de parts</span>
            <span className="cv-value">{a.total_shares ?? '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Fonds propres</span>
            <span className="cv-value">{fmtCents(a.equity_cents)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Pret bancaire</span>
            <span className="cv-value">{fmtCents(a.bank_loan_cents)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Duree</span>
            <span className="cv-value">{a.duration_months ? `${a.duration_months} mois` : '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Rendement brut</span>
            <span className="cv-value">{a.gross_yield_percent != null ? `${Number(a.gross_yield_percent).toFixed(2)}%` : '—'}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Rendement net</span>
            <span className="cv-value">{a.net_yield_percent != null ? `${Number(a.net_yield_percent).toFixed(2)}%` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Article 4 - Garanties */}
      <div className="cv-section">
        <h4 className="cv-section-title">
          <Shield size={16} /> Article 4 — Garanties ({activeGuarantees}/{hasNewGuarantees ? guaranteeSummary.length : GUARANTEE_ITEMS.length})
          {a.overall_protection_score != null && (
            <span style={{ marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 600 }}>
              Score global: {Number(a.overall_protection_score).toFixed(0)}%
            </span>
          )}
        </h4>
        {hasNewGuarantees ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {guaranteeSummary.map((g, idx) => (
              <div key={idx} className="cv-card" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="cv-label" style={{ fontWeight: 600 }}>{g.asset_label || `Actif ${idx + 1}`}</span>
                  <span className={`pf-risk-badge risk-${g.risk_level || 'critical'}`}>
                    {RISK_LEVEL_LABELS[g.risk_level] || g.risk_level}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <span className="cv-label">Type</span>
                    <span className="cv-value">{GUARANTEE_TYPE_LABELS[g.type] || g.type}{g.rank ? ` (${g.rank.replace('_', ' ')})` : ''}</span>
                  </div>
                  <div>
                    <span className="cv-label">LTV</span>
                    <span className="cv-value">{g.ltv != null ? `${Number(g.ltv).toFixed(1)}%` : '—'}</span>
                  </div>
                  <div>
                    <span className="cv-label">Score</span>
                    <span className="cv-value" style={{ fontWeight: 700 }}>{g.protection_score != null ? `${Number(g.protection_score).toFixed(0)}%` : '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cv-guarantees">
            {GUARANTEE_ITEMS.map((g) => (
              <div key={g.key} className={`cv-guarantee ${a[g.key] ? 'cv-guarantee--yes' : 'cv-guarantee--no'}`}>
                {a[g.key] ? <CheckCircle size={15} /> : <XCircle size={15} />}
                <span>{g.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article 5 - Calendrier */}
      <div className="cv-section">
        <h4 className="cv-section-title"><Calendar size={16} /> Article 5 — Calendrier</h4>
        <div className="cv-grid cv-grid-2">
          <div className="cv-card">
            <span className="cv-label">Acquisition prevue</span>
            <span className="cv-value">{fmtDate(a.planned_acquisition_date)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Livraison prevue</span>
            <span className="cv-value">{fmtDate(a.planned_delivery_date)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Remboursement prevu</span>
            <span className="cv-value">{fmtDate(a.planned_repayment_date)}</span>
          </div>
          <div className="cv-card">
            <span className="cv-label">Periode de collecte</span>
            <span className="cv-value">{fmtDate(a.funding_start_date)} — {fmtDate(a.funding_end_date)}</span>
          </div>
        </div>
      </div>

      {/* Article 6 - Signatures */}
      <div className="cv-section">
        <h4 className="cv-section-title"><FileText size={16} /> Article 6 — Signatures</h4>
        <div className="cv-grid cv-grid-2">
          <div className="cv-signature-box">
            <p className="cv-signature-title">Le Porteur de Projet</p>
            <p className="cv-signature-name">{a.owner_name || '—'}</p>
            <p className="cv-signature-field">Date : _______________</p>
            <p className="cv-signature-field">Signature : _______________</p>
          </div>
          <div className="cv-signature-box">
            <p className="cv-signature-title">X-Fund</p>
            <p className="cv-signature-name">Representant habilite</p>
            <p className="cv-signature-field">Date : _______________</p>
            <p className="cv-signature-field">Signature : _______________</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="cv-disclaimer">
        Ce contrat est etabli sous reserve de la realisation effective de la collecte de fonds.
        En cas de non-atteinte du montant minimum de collecte, les fonds seront restitues aux investisseurs.
        Le porteur de projet s'engage a respecter l'ensemble des conditions definies dans le present contrat.
      </div>
    </div>
  );
}
