import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calculator, Save, ArrowRight, AlertTriangle,
  DollarSign, TrendingUp, Calendar, Coins,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { investmentProjectsApi } from '../../api/investments';
import { adminApi } from '../../api/admin';
import { LoadingSpinner } from '../../components/ui';
import '../../styles/admin-project-review.css';

const PAYMENT_FREQUENCIES = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'annuel', label: 'Annuel' },
  { value: 'in_fine', label: 'In fine (a echeance)' },
];

function fmtEur(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

/* ─────────────────────────────────────────────────────────
   Owner Column (left, read-only)
   ───────────────────────────────────────────────────────── */
function OwnerColumn({ snapshot }) {
  const fin = snapshot.financialStructure || {};
  const proj = snapshot.projections || {};
  const assets = snapshot.assets || [];

  const totalCosts = assets.reduce((sum, a) => {
    const items = a.costs?.items || [];
    return sum + items.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  }, 0);
  const totalRecettes = assets.reduce((sum, a) => sum + (parseFloat(a.recettesTotal) || 0), 0);

  const Row = ({ label, value }) => (
    <div className="apr-str-row">
      <span className="apr-str-row-label">{label}</span>
      <span className={`apr-str-row-value${value === '—' ? ' muted' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="apr-str-col">
      <div className="apr-str-col-head">
        Demande du porteur <span className="apr-tag-owner">Porteur</span>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><DollarSign size={14} /> Financement demande</div>
        <div className="apr-str-section-body">
          <Row label="Montant sollicite" value={fin.totalFunding ? fmtEur(parseFloat(fin.totalFunding)) : '—'} />
          <Row label="Marge brute" value={fin.grossMargin ? `${fin.grossMargin}%` : '—'} />
          <Row label="Rendement net cible" value={fin.netYield ? `${fin.netYield}%` : '—'} />
          {fin.yieldJustification && (
            <div className="apr-str-justification">
              <span className="apr-str-row-label" style={{ display: 'block', marginBottom: 4 }}>Justification du rendement</span>
              {fin.yieldJustification}
            </div>
          )}
        </div>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><Coins size={14} /> Parametres de collecte</div>
        <div className="apr-str-section-body">
          <Row label="Apport porteur" value={proj.contributionPct != null ? `${proj.contributionPct}%` : '—'} />
          <Row label="Duree souhaitee" value={proj.durationMonths ? `${proj.durationMonths} mois` : '—'} />
        </div>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><TrendingUp size={14} /> Budget de l&apos;operation</div>
        <div className="apr-str-section-body">
          <Row label="Total couts" value={totalCosts > 0 ? fmtEur(totalCosts) : '—'} />
          <Row label="Total recettes prevues" value={totalRecettes > 0 ? fmtEur(totalRecettes) : '—'} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Proposition Column (right, editable)
   ───────────────────────────────────────────────────────── */
function PropositionColumn({ form, onChange, platformCommissionPct, sharePriceCents }) {
  const sharePriceEur = (sharePriceCents || 10000) / 100;
  const totalShares = sharePriceCents > 0
    ? Math.floor(form.total_amount_cents / sharePriceCents)
    : 0;

  const Field = ({ label, name, opts = {} }) => (
    <div className="apr-str-field">
      <label className="apr-str-label">{label}</label>
      {opts.readOnly ? (
        <input className="apr-str-input" value={opts.display || ''} readOnly />
      ) : opts.type === 'select' ? (
        <select
          className="apr-str-input"
          value={form[name] || ''}
          onChange={(e) => onChange(name, e.target.value)}
        >
          {opts.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          className="apr-str-input"
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
    </div>
  );

  return (
    <div className="apr-str-col">
      <div className="apr-str-col-head">
        Proposition plateforme <span className="apr-tag-platform">Plateforme</span>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><DollarSign size={14} /> Montant &amp; Parts</div>
        <div className="apr-str-section-body">
          <Field label="Montant valide a lever (EUR)" name="total_amount_cents" opts={{ cents: true, min: 0, step: '100' }} />
          <div className="apr-str-input-row">
            <Field label="Prix par part (EUR)" name="_share_price" opts={{ readOnly: true, display: `${sharePriceEur.toLocaleString('fr-FR')} € (parametre global)` }} />
            <Field label="Investissement minimum (EUR)" name="min_investment_cents" opts={{ cents: true, min: 1 }} />
          </div>
          <div className="apr-str-field">
            <label className="apr-str-label">Nombre de parts</label>
            <div className="apr-str-computed">{totalShares.toLocaleString('fr-FR')}</div>
          </div>
        </div>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><TrendingUp size={14} /> Rendement &amp; Frais</div>
        <div className="apr-str-section-body">
          <div className="apr-str-input-row">
            <Field label="Rendement brut (%)" name="gross_yield_percent" opts={{ step: '0.1', min: 0 }} />
            <Field label="Rendement net investisseur (%)" name="net_yield_percent" opts={{ step: '0.1', min: 0 }} />
          </div>
          <Field label="Commission plateforme (%)" name="_fee" opts={{ readOnly: true, display: `${platformCommissionPct}% (parametre global)` }} />
          <div className="apr-str-input-row">
            <Field label="Duree du pret (mois)" name="duration_months" opts={{ step: '1', min: 1 }} />
            <Field label="Frequence de remboursement" name="payment_frequency" opts={{ type: 'select', options: PAYMENT_FREQUENCIES }} />
          </div>
        </div>
      </div>

      <div className="apr-str-section">
        <div className="apr-str-section-head"><Calendar size={14} /> Calendrier</div>
        <div className="apr-str-section-body">
          <div className="apr-str-input-row">
            <Field label="Debut de collecte" name="funding_start_date" opts={{ type: 'date' }} />
            <Field label="Fin de collecte" name="funding_end_date" opts={{ type: 'date' }} />
          </div>
          <div className="apr-str-input-row">
            <Field label="Acquisition prevue" name="planned_acquisition_date" opts={{ type: 'date' }} />
            <Field label="Livraison prevue" name="planned_delivery_date" opts={{ type: 'date' }} />
          </div>
          <Field label="Remboursement prevu" name="planned_repayment_date" opts={{ type: 'date' }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Simulation Panel
   ───────────────────────────────────────────────────────── */
function SimulationPanel({ form, platformCommissionPct, sharePriceCents }) {
  const totalEur = (form.total_amount_cents || 0) / 100;
  const feePct = parseFloat(platformCommissionPct) || 0;
  const netYield = parseFloat(form.net_yield_percent) || 0;
  const months = parseInt(form.duration_months) || 0;
  const sharePriceEur = (sharePriceCents || 10000) / 100;

  const platformFee = totalEur * (feePct / 100);
  const interestReserve = totalEur * (netYield / 100 / 12) * months;
  const netToOwner = totalEur - platformFee - interestReserve;
  const totalShares = sharePriceEur > 0 ? Math.floor(totalEur / sharePriceEur) : 0;

  const start = form.funding_start_date ? new Date(form.funding_start_date) : null;
  const end = form.funding_end_date ? new Date(form.funding_end_date) : null;
  const fundingDays = start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="apr-str-sim">
      <div className="apr-str-sim-head">
        <Calculator size={14} /> Simulation en temps reel
      </div>
      <div className="apr-str-sim-body">
        {netToOwner <= 0 && totalEur > 0 && (
          <div className="apr-str-warning">
            <AlertTriangle size={14} />
            Le montant net au porteur est negatif ou nul. Verifiez les parametres.
          </div>
        )}
        <div className="apr-str-sim-grid">
          <div className="apr-str-sim-item">
            <div className="apr-str-sim-label">Total collecte</div>
            <div className="apr-str-sim-value">{fmtEur(totalEur)}</div>
          </div>
          <div className="apr-str-sim-item">
            <div className="apr-str-sim-label">Commission plateforme ({feePct}%)</div>
            <div className="apr-str-sim-value">{fmtEur(platformFee)}</div>
          </div>
          <div className="apr-str-sim-item">
            <div className="apr-str-sim-label">Reserve d&apos;interets</div>
            <div className="apr-str-sim-value">{fmtEur(interestReserve)}</div>
            <div className="apr-str-sim-sub">{netYield}% &times; {months} mois</div>
          </div>
          <div className={`apr-str-sim-item${netToOwner > 0 ? ' highlight' : ''}`}>
            <div className="apr-str-sim-label">Montant net au porteur</div>
            <div className={`apr-str-sim-value${netToOwner > 0 ? ' green' : ' red'}`}>{fmtEur(netToOwner)}</div>
          </div>
          <div className="apr-str-sim-item">
            <div className="apr-str-sim-label">Nombre de parts</div>
            <div className="apr-str-sim-value">{totalShares.toLocaleString('fr-FR')}</div>
          </div>
          <div className="apr-str-sim-item">
            <div className="apr-str-sim-label">Duree de collecte</div>
            <div className="apr-str-sim-value">{fundingDays != null ? `${fundingDays} jours` : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────────────────── */
export default function AdminProjectStructuringPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    total_amount_cents: 0,
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

      setForm({
        total_amount_cents: a.total_amount_cents || (fin.totalFunding ? Math.round(parseFloat(fin.totalFunding) * 100) : 0),
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
  const platformCommissionPct = a.platform_commission_percent ?? 6;
  const sharePriceCents = a.default_share_price_cents || 10000;

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const sp = sharePriceCents;
    const ta = parseInt(form.total_amount_cents) || 0;
    return {
      total_amount_cents: ta,
      share_price_cents: sp,
      total_shares: sp > 0 ? Math.floor(ta / sp) : 0,
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
    if (!form.total_amount_cents || form.total_amount_cents <= 0) return 'Le montant total est requis.';
    if (!form.net_yield_percent || parseFloat(form.net_yield_percent) <= 0) return 'Le rendement net est requis.';
    if (!form.duration_months || parseInt(form.duration_months) <= 0) return 'La duree du pret est requise.';
    if (!form.funding_start_date) return 'La date de debut de collecte est requise.';
    if (!form.funding_end_date) return 'La date de fin de collecte est requise.';
    if (form.funding_end_date <= form.funding_start_date) return 'La date de fin doit etre apres la date de debut.';
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
      navigate(`/admin/projects/${id}/legal-documents`);
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  if (!['approved', 'signing', 'legal_structuring'].includes(a.status)) {
    navigate(`/admin/projects/${id}`);
    return null;
  }

  // Display cents as EUR in inputs
  const displayForm = {
    ...form,
    total_amount_cents: form.total_amount_cents ? form.total_amount_cents / 100 : '',
    min_investment_cents: form.min_investment_cents ? form.min_investment_cents / 100 : '',
  };

  return (
    <div className="apr-page">
      <nav className="apr-breadcrumb">
        <Link to="/admin/projects">Projets</Link>
        <span className="apr-sep">&rsaquo;</span>
        <Link to={`/admin/projects/${id}`}>{a.title}</Link>
        <span className="apr-sep">&rsaquo;</span>
        <span className="apr-current">Structuration financiere</span>
      </nav>

      <div className="apr-str-header">
        <div>
          <h1>Structuration financiere</h1>
          <div className="apr-str-header-sub">{a.title}</div>
        </div>
        <button className="apr-str-back" onClick={() => navigate(`/admin/projects/${id}`)}>
          <ArrowLeft size={14} /> Retour au projet
        </button>
      </div>

      <div className="apr-str-grid">
        <OwnerColumn snapshot={snapshot} />
        <PropositionColumn form={displayForm} onChange={onChange} platformCommissionPct={platformCommissionPct} sharePriceCents={sharePriceCents} />
      </div>

      <SimulationPanel form={form} platformCommissionPct={platformCommissionPct} sharePriceCents={sharePriceCents} />

      <div className="apr-str-actions">
        <button className="apr-btn apr-btn-secondary" onClick={() => navigate(`/admin/projects/${id}`)}>
          Annuler
        </button>
        <div className="apr-str-actions-right">
          <button className="apr-btn apr-btn-secondary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
          <button className="apr-btn apr-btn-approve" onClick={handleSaveAndProceed} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer et continuer'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
