import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Save, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { investmentProjectsApi } from '../../api/investments';
import { adminApi } from '../../api/admin';
import { LoadingSpinner } from '../../components/ui';
import { formatCents } from '../../utils';
import '../../styles/admin-project-review.css';

const PAYMENT_FREQUENCIES = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'annuel', label: 'Annuel' },
  { value: 'in_fine', label: 'In fine (a echeance)' },
];

function formatEur(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

// ─── Owner Terms (read-only column) ───
function OwnerColumn({ snapshot }) {
  const fin = snapshot.financialStructure || {};
  const proj = snapshot.projections || {};
  const assets = snapshot.assets || [];

  const totalCosts = assets.reduce((sum, a) => {
    const costs = a.costs?.items || [];
    return sum + costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  }, 0);

  const totalRecettes = assets.reduce((sum, a) => sum + (parseFloat(a.recettesTotal) || 0), 0);

  return (
    <div>
      <div className="apr-structuring-col-label">
        Demande du porteur <span className="apr-source-owner">Porteur</span>
      </div>

      <div className="apr-card apr-anim apr-d1">
        <div className="apr-card-title">Financement demande</div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Montant sollicite</span>
          <span className="apr-owner-value">{fin.totalFunding ? formatEur(parseFloat(fin.totalFunding)) : '—'}</span>
        </div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Marge brute</span>
          <span className="apr-owner-value">{fin.grossMargin ? `${fin.grossMargin}%` : '—'}</span>
        </div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Rendement net cible</span>
          <span className="apr-owner-value">{fin.netYield ? `${fin.netYield}%` : '—'}</span>
        </div>
        {fin.yieldJustification && (
          <>
            <div className="apr-owner-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="apr-owner-label">Justification du rendement</span>
            </div>
            <div className="apr-owner-justification">{fin.yieldJustification}</div>
          </>
        )}
      </div>

      <div className="apr-card apr-anim apr-d2">
        <div className="apr-card-title">Parametres de collecte</div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Apport porteur</span>
          <span className="apr-owner-value">{proj.contributionPct != null ? `${proj.contributionPct}%` : '—'}</span>
        </div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Duree souhaitee</span>
          <span className="apr-owner-value">{proj.durationMonths ? `${proj.durationMonths} mois` : '—'}</span>
        </div>
      </div>

      <div className="apr-card apr-anim apr-d3">
        <div className="apr-card-title">Budget de l&apos;operation</div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Total couts</span>
          <span className="apr-owner-value">{totalCosts > 0 ? formatEur(totalCosts) : '—'}</span>
        </div>
        <div className="apr-owner-row">
          <span className="apr-owner-label">Total recettes prevues</span>
          <span className="apr-owner-value">{totalRecettes > 0 ? formatEur(totalRecettes) : '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Proposition (editable column) ───
function PropositionColumn({ form, onChange, investmentFeePct }) {
  const totalShares = form.share_price_cents > 0
    ? Math.floor(form.total_amount_cents / form.share_price_cents)
    : 0;

  const field = (label, name, opts = {}) => (
    <div className="apr-field-group">
      <label className="apr-field-label">{label}</label>
      {opts.readOnly ? (
        <input className="apr-field-input" value={opts.display || ''} readOnly />
      ) : opts.type === 'select' ? (
        <select
          className="apr-field-input"
          value={form[name] || ''}
          onChange={(e) => onChange(name, e.target.value)}
        >
          {opts.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          className="apr-field-input"
          type={opts.type || 'number'}
          step={opts.step || 'any'}
          value={form[name] ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (opts.type === 'date') {
              onChange(name, raw);
            } else {
              const v = raw === '' ? '' : opts.cents ? Math.round(parseFloat(raw) * 100) : parseFloat(raw);
              onChange(name, v);
            }
          }}
          {...(opts.type === 'date' ? {} : { min: opts.min })}
        />
      )}
      {opts.suffix && <div className="apr-field-suffix">{opts.suffix}</div>}
    </div>
  );

  return (
    <div>
      <div className="apr-structuring-col-label">
        Proposition plateforme <span className="apr-source-platform">Plateforme</span>
      </div>

      <div className="apr-card apr-anim apr-d1">
        <div className="apr-card-title">Montant &amp; Parts</div>
        {field('Montant valide a lever (EUR)', 'total_amount_cents', { cents: true, min: 0, step: '100' })}
        <div className="apr-field-row">
          {field('Prix par part (EUR)', 'share_price_cents', { cents: true, min: 1 })}
          {field('Investissement minimum (EUR)', 'min_investment_cents', { cents: true, min: 1 })}
        </div>
        <div className="apr-field-group">
          <label className="apr-field-label">Nombre de parts</label>
          <div className="apr-field-computed">{totalShares.toLocaleString('fr-FR')}</div>
        </div>
      </div>

      <div className="apr-card apr-anim apr-d2">
        <div className="apr-card-title">Rendement &amp; Frais</div>
        <div className="apr-field-row">
          {field('Rendement brut (%)', 'gross_yield_percent', { step: '0.1', min: 0 })}
          {field('Rendement net investisseur (%)', 'net_yield_percent', { step: '0.1', min: 0 })}
        </div>
        {field('Commission plateforme (%)', 'investment_fee', {
          readOnly: true,
          display: `${investmentFeePct}% (parametre global)`,
        })}
        <div className="apr-field-row">
          {field('Duree du pret (mois)', 'duration_months', { step: '1', min: 1 })}
          {field('Frequence de remboursement', 'payment_frequency', {
            type: 'select',
            options: PAYMENT_FREQUENCIES,
          })}
        </div>
      </div>

      <div className="apr-card apr-anim apr-d3">
        <div className="apr-card-title">Calendrier</div>
        <div className="apr-field-row">
          {field('Debut de collecte', 'funding_start_date', { type: 'date' })}
          {field('Fin de collecte', 'funding_end_date', { type: 'date' })}
        </div>
        <div className="apr-field-row">
          {field('Acquisition prevue', 'planned_acquisition_date', { type: 'date' })}
          {field('Livraison prevue', 'planned_delivery_date', { type: 'date' })}
        </div>
        {field('Remboursement prevu', 'planned_repayment_date', { type: 'date' })}
      </div>
    </div>
  );
}

// ─── Simulation Panel ───
function SimulationPanel({ form, investmentFeePct }) {
  const totalEur = (form.total_amount_cents || 0) / 100;
  const feePct = parseFloat(investmentFeePct) || 0;
  const netYield = parseFloat(form.net_yield_percent) || 0;
  const months = parseInt(form.duration_months) || 0;
  const sharePriceEur = (form.share_price_cents || 0) / 100;

  const platformFee = totalEur * (feePct / 100);
  const interestReserve = totalEur * (netYield / 100 / 12) * months;
  const netToOwner = totalEur - platformFee - interestReserve;
  const totalShares = sharePriceEur > 0 ? Math.floor(totalEur / sharePriceEur) : 0;

  const start = form.funding_start_date ? new Date(form.funding_start_date) : null;
  const end = form.funding_end_date ? new Date(form.funding_end_date) : null;
  const fundingDays = start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : null;

  const items = [
    { label: 'Total collecte', value: formatEur(totalEur) },
    { label: `Commission plateforme (${feePct}%)`, value: formatEur(platformFee) },
    { label: 'Reserve d\'interets', value: formatEur(interestReserve), sub: `${netYield}% x ${months} mois` },
    { label: 'Montant net au porteur', value: formatEur(netToOwner), cls: netToOwner > 0 ? 'green' : 'red' },
    { label: 'Nombre de parts', value: totalShares.toLocaleString('fr-FR') },
    { label: 'Duree de collecte', value: fundingDays != null ? `${fundingDays} jours` : '—' },
  ];

  return (
    <div className="apr-simulation-panel apr-anim apr-d3">
      <div className="apr-simulation-title">
        <Calculator size={16} /> Simulation en temps reel
      </div>

      {netToOwner <= 0 && totalEur > 0 && (
        <div className="apr-structuring-warning">
          <AlertTriangle size={14} />
          Le montant net au porteur est negatif. Verifiez les parametres.
        </div>
      )}

      <div className="apr-simulation-grid">
        {items.map((it) => (
          <div className="apr-sim-item" key={it.label}>
            <div className="apr-sim-label">{it.label}</div>
            <div className={`apr-sim-value${it.cls ? ` ${it.cls}` : ''}`}>{it.value}</div>
            {it.sub && <div className="apr-sim-sub">{it.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function AdminProjectStructuringPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    total_amount_cents: 0,
    share_price_cents: 10000,
    min_investment_cents: 10000,
    gross_yield_percent: '',
    net_yield_percent: '',
    duration_months: '',
    payment_frequency: 'in_fine',
    funding_start_date: '',
    funding_end_date: '',
    planned_acquisition_date: '',
    planned_delivery_date: '',
    planned_repayment_date: '',
  });

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await investmentProjectsApi.get(id);
      const p = res.data.data || res.data;
      setProject(p);

      const a = p.attributes || p;
      const snapshot = a.form_snapshot || {};
      const fin = snapshot.financialStructure || {};
      const proj = snapshot.projections || {};

      // Pre-populate from model, falling back to snapshot
      setForm({
        total_amount_cents: a.total_amount_cents || (fin.totalFunding ? Math.round(parseFloat(fin.totalFunding) * 100) : 0),
        share_price_cents: a.share_price_cents || 10000,
        min_investment_cents: a.min_investment_cents || 10000,
        gross_yield_percent: a.gross_yield_percent ?? fin.grossMargin ?? '',
        net_yield_percent: a.net_yield_percent ?? fin.netYield ?? '',
        duration_months: a.duration_months ?? proj.durationMonths ?? '',
        payment_frequency: a.payment_frequency || 'in_fine',
        funding_start_date: a.funding_start_date || '',
        funding_end_date: a.funding_end_date || '',
        planned_acquisition_date: a.planned_acquisition_date || '',
        planned_delivery_date: a.planned_delivery_date || '',
        planned_repayment_date: a.planned_repayment_date || '',
      });
    } catch {
      toast.error('Erreur lors du chargement du projet');
      navigate(`/admin/projects/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const investmentFeePct = a.investment_fee_percent || 0;

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const sharePriceCents = parseInt(form.share_price_cents) || 10000;
    const totalAmountCents = parseInt(form.total_amount_cents) || 0;
    return {
      total_amount_cents: totalAmountCents,
      share_price_cents: sharePriceCents,
      total_shares: sharePriceCents > 0 ? Math.floor(totalAmountCents / sharePriceCents) : 0,
      min_investment_cents: parseInt(form.min_investment_cents) || 10000,
      gross_yield_percent: parseFloat(form.gross_yield_percent) || 0,
      net_yield_percent: parseFloat(form.net_yield_percent) || 0,
      duration_months: parseInt(form.duration_months) || 0,
      payment_frequency: form.payment_frequency,
      funding_start_date: form.funding_start_date || null,
      funding_end_date: form.funding_end_date || null,
      planned_acquisition_date: form.planned_acquisition_date || null,
      planned_delivery_date: form.planned_delivery_date || null,
      planned_repayment_date: form.planned_repayment_date || null,
    };
  };

  const validate = () => {
    const f = form;
    if (!f.total_amount_cents || f.total_amount_cents <= 0) return 'Le montant total est requis.';
    if (!f.share_price_cents || f.share_price_cents <= 0) return 'Le prix par part est requis.';
    if (!f.net_yield_percent || parseFloat(f.net_yield_percent) <= 0) return 'Le rendement net est requis.';
    if (!f.duration_months || parseInt(f.duration_months) <= 0) return 'La duree du pret est requise.';
    if (!f.funding_start_date) return 'La date de debut de collecte est requise.';
    if (!f.funding_end_date) return 'La date de fin de collecte est requise.';
    if (f.funding_end_date <= f.funding_start_date) return 'La date de fin doit etre apres la date de debut.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      await adminApi.updateProject(id, buildPayload());
      toast.success('Proposition enregistree');
      loadProject();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndProceed = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      await adminApi.updateProject(id, buildPayload());
      toast.success('Proposition enregistree');
      navigate(`/admin/projects/${id}`);
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  // Guard: only accessible when approved
  if (a.status !== 'approved') {
    navigate(`/admin/projects/${id}`);
    return null;
  }

  // Display cents as EUR in inputs
  const displayForm = {
    ...form,
    total_amount_cents: form.total_amount_cents ? form.total_amount_cents / 100 : '',
    share_price_cents: form.share_price_cents ? form.share_price_cents / 100 : '',
    min_investment_cents: form.min_investment_cents ? form.min_investment_cents / 100 : '',
  };

  return (
    <div className="apr-page">
      {/* Breadcrumb */}
      <nav className="apr-breadcrumb">
        <Link to="/admin/projects">Projets</Link>
        <span className="apr-sep">&rsaquo;</span>
        <Link to={`/admin/projects/${id}`}>{a.title}</Link>
        <span className="apr-sep">&rsaquo;</span>
        <span className="apr-current">Structuration financiere</span>
      </nav>

      {/* Header */}
      <div className="apr-structuring-header">
        <div>
          <h1>Structuration financiere</h1>
          <div className="apr-structuring-header-sub">{a.title}</div>
        </div>
        <button className="apr-structuring-back" onClick={() => navigate(`/admin/projects/${id}`)}>
          <ArrowLeft size={14} /> Retour au projet
        </button>
      </div>

      {/* Two-column grid */}
      <div className="apr-structuring-grid">
        <OwnerColumn snapshot={snapshot} />
        <PropositionColumn
          form={displayForm}
          onChange={onChange}
          investmentFeePct={investmentFeePct}
        />
      </div>

      {/* Simulation */}
      <SimulationPanel form={form} investmentFeePct={investmentFeePct} />

      {/* Sticky actions */}
      <div className="apr-structuring-actions">
        <button
          className="apr-btn apr-btn-secondary"
          onClick={() => navigate(`/admin/projects/${id}`)}
        >
          Annuler
        </button>
        <div className="apr-structuring-actions-right">
          <button
            className="apr-btn apr-btn-secondary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
          <button
            className="apr-btn apr-btn-approve"
            onClick={handleSaveAndProceed}
            disabled={saving}
          >
            <FileText size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer et generer le contrat'}
          </button>
        </div>
      </div>
    </div>
  );
}
