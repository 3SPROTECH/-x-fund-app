import { useState } from 'react';
import {
  X, Download, FileText, Send, CheckCircle, XCircle, Calendar, Users, DollarSign, Shield,
} from 'lucide-react';
import { generateContractPdf } from '../utils/contractGenerator';
import '../styles/report-viewer.css';

const fmtCents = (v) =>
  v != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v / 100)
    : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
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

export default function ContractViewerModal({ projectAttrs, onClose, onSendToOwner, showSendButton = false }) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  if (!projectAttrs) return null;

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

  const handleSend = async () => {
    if (!window.confirm('Envoyer le contrat au porteur ? Le statut du projet sera mis a jour en "En Signature".')) return;
    setSending(true);
    try {
      await onSendToOwner();
    } finally {
      setSending(false);
    }
  };

  const activeGuarantees = GUARANTEE_ITEMS.filter((g) => a[g.key]).length;

  return (
    <div className="rv-overlay" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rv-header">
          <div className="rv-header-left">
            <FileText size={20} />
            <div>
              <h2 className="rv-title">Contrat d'investissement</h2>
              <p className="rv-subtitle">{a.title || 'Projet'}</p>
            </div>
          </div>
          <div className="rv-header-actions">
            <button className="rv-btn rv-btn-gold" onClick={handleDownload} disabled={downloading}>
              <Download size={16} />
              {downloading ? 'Generation...' : 'Telecharger PDF'}
            </button>
            {showSendButton && onSendToOwner && (
              <button
                className="rv-btn rv-btn-gold"
                onClick={handleSend}
                disabled={sending}
                style={{ background: 'var(--rv-emerald, #10b981)' }}
              >
                <Send size={16} />
                {sending ? 'Envoi...' : 'Envoyer au Porteur'}
              </button>
            )}
            <button className="rv-btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="rv-content">
          {/* Article 1 - Parties */}
          <div className="rv-section">
            <h3 className="rv-section-title"><Users size={18} /> Article 1 — Les Parties</h3>
            <div className="rv-metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Plateforme</span>
                <span className="rv-metric-value">X-Fund</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Porteur de Projet</span>
                <span className="rv-metric-value">{a.owner_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Article 2 - Objet */}
          <div className="rv-section">
            <h3 className="rv-section-title"><FileText size={18} /> Article 2 — Objet du Projet</h3>
            <div className="rv-metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Titre</span>
                <span className="rv-metric-value">{a.title || '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Type d'operation</span>
                <span className="rv-metric-value">{OPERATION_LABELS[a.operation_type] || a.operation_type || '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Bien</span>
                <span className="rv-metric-value">{a.property_title || '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Localisation</span>
                <span className="rv-metric-value">{a.property_city || '—'}</span>
              </div>
            </div>
            {a.description && (
              <div className="rv-comment-box" style={{ marginTop: '0.75rem' }}>
                {a.description}
              </div>
            )}
          </div>

          {/* Article 3 - Conditions Financieres */}
          <div className="rv-section">
            <h3 className="rv-section-title"><DollarSign size={18} /> Article 3 — Conditions Financieres</h3>
            <div className="rv-metrics-grid">
              <div className="rv-metric-card">
                <span className="rv-metric-label">Montant total</span>
                <span className="rv-metric-value">{fmtCents(a.total_amount_cents)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Prix par part</span>
                <span className="rv-metric-value">{fmtCents(a.share_price_cents)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Nombre de parts</span>
                <span className="rv-metric-value">{a.total_shares ?? '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Fonds propres</span>
                <span className="rv-metric-value">{fmtCents(a.equity_cents)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Pret bancaire</span>
                <span className="rv-metric-value">{fmtCents(a.bank_loan_cents)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Duree</span>
                <span className="rv-metric-value">{a.duration_months ? `${a.duration_months} mois` : '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Rendement brut</span>
                <span className="rv-metric-value">{a.gross_yield_percent != null ? `${Number(a.gross_yield_percent).toFixed(2)}%` : '—'}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Rendement net</span>
                <span className="rv-metric-value">{a.net_yield_percent != null ? `${Number(a.net_yield_percent).toFixed(2)}%` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Article 4 - Garanties */}
          <div className="rv-section">
            <h3 className="rv-section-title"><Shield size={18} /> Article 4 — Garanties ({activeGuarantees}/{GUARANTEE_ITEMS.length})</h3>
            <div className="rv-guarantees-grid">
              {GUARANTEE_ITEMS.map((g) => (
                <div key={g.key} className={`rv-guarantee-item ${a[g.key] ? 'rv-guarantee-yes' : 'rv-guarantee-no'}`}>
                  {a[g.key] ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Article 5 - Calendrier */}
          <div className="rv-section">
            <h3 className="rv-section-title"><Calendar size={18} /> Article 5 — Calendrier</h3>
            <div className="rv-metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Acquisition prevue</span>
                <span className="rv-metric-value">{fmtDate(a.planned_acquisition_date)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Livraison prevue</span>
                <span className="rv-metric-value">{fmtDate(a.planned_delivery_date)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Remboursement prevu</span>
                <span className="rv-metric-value">{fmtDate(a.planned_repayment_date)}</span>
              </div>
              <div className="rv-metric-card">
                <span className="rv-metric-label">Periode de collecte</span>
                <span className="rv-metric-value">{fmtDate(a.funding_start_date)} — {fmtDate(a.funding_end_date)}</span>
              </div>
            </div>
          </div>

          {/* Article 6 - Signatures */}
          <div className="rv-section">
            <h3 className="rv-section-title"><FileText size={18} /> Article 6 — Signatures</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ border: '2px dashed rgba(128,128,128,0.3)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--rv-navy, #1a1a2e)' }}>Le Porteur de Projet</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--rv-slate, #64748b)' }}>{a.owner_name || '—'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--rv-slate, #64748b)', marginTop: '1.5rem' }}>Date : _______________</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--rv-slate, #64748b)', marginTop: '0.5rem' }}>Signature : _______________</p>
              </div>
              <div style={{ border: '2px dashed rgba(128,128,128,0.3)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--rv-navy, #1a1a2e)' }}>X-Fund</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--rv-slate, #64748b)' }}>Representant habilite</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--rv-slate, #64748b)', marginTop: '1.5rem' }}>Date : _______________</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--rv-slate, #64748b)', marginTop: '0.5rem' }}>Signature : _______________</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rv-comment-box" style={{ fontSize: '0.75rem', color: 'var(--rv-slate, #64748b)' }}>
            Ce contrat est etabli sous reserve de la realisation effective de la collecte de fonds.
            En cas de non-atteinte du montant minimum de collecte, les fonds seront restitues aux investisseurs.
            Le porteur de projet s'engage a respecter l'ensemble des conditions definies dans le present contrat.
          </div>
        </div>
      </div>
    </div>
  );
}
