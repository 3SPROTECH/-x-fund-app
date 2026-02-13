import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Save, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OPERATION_TYPES = {
  promotion_immobiliere: 'Promotion immobiliere (construction neuve)',
  marchand_de_biens: 'Marchand de biens (achat / revente)',
  rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere',
  immobilier_locatif: 'Immobilier locatif',
  transformation_usage: "Transformation d'usage",
};

const OPERATION_TYPE_ICONS = {
  promotion_immobiliere: '\u{1F3D7}',
  marchand_de_biens: '\u{1F3E1}',
  rehabilitation_lourde: '\u{1F6E0}',
  division_fonciere: '\u{1F3D8}',
  immobilier_locatif: '\u{1F3E2}',
  transformation_usage: '\u{1F504}',
};

const OPERATION_STATUSES = {
  acquisition_en_cours: 'Acquisition en cours',
  acte_signe: 'Acte signe',
  en_renovation: 'En renovation',
  en_commercialisation: 'En commercialisation',
  sous_offre: 'Sous offre',
  sous_compromis: 'Sous compromis',
  vendu: 'Vendu',
};

const STATUS_BADGE_MAP = {
  acquisition_en_cours: 'badge-warning',
  acte_signe: 'badge-info',
  en_renovation: 'badge-warning',
  en_commercialisation: 'badge-info',
  sous_offre: 'badge-info',
  sous_compromis: 'badge-success',
  vendu: 'badge-success',
};

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '\u2014';

const EMPTY_FORM = {
  operation_status: 'acquisition_en_cours',
  expected_repayment_date: '',
  summary: '',
  purchase_price_previsionnel: '',
  purchase_price_realise: '',
  works_previsionnel: '',
  works_realise: '',
  total_cost_previsionnel: '',
  total_cost_realise: '',
  target_sale_price_previsionnel: '',
  target_sale_price_realise: '',
  best_offer_previsionnel: '',
  best_offer_realise: '',
  works_progress_percent: '',
  budget_variance_percent: '',
  sale_start_date: '',
  visits_count: '',
  offers_count: '',
  listed_price: '',
  risk_identified: '',
  risk_impact: '',
  corrective_action: '',
  estimated_compromise_date: '',
  estimated_deed_date: '',
  estimated_repayment_date: '',
  exit_confirmed: false,
};

// Convert API data (cents) to form data (EUR)
function apiToForm(data) {
  const a = data.attributes || data;
  return {
    operation_status: a.operation_status || 'acquisition_en_cours',
    expected_repayment_date: a.expected_repayment_date || '',
    summary: a.summary || '',
    purchase_price_previsionnel: a.purchase_price_previsionnel_cents ? (a.purchase_price_previsionnel_cents / 100).toString() : '',
    purchase_price_realise: a.purchase_price_realise_cents ? (a.purchase_price_realise_cents / 100).toString() : '',
    works_previsionnel: a.works_previsionnel_cents ? (a.works_previsionnel_cents / 100).toString() : '',
    works_realise: a.works_realise_cents ? (a.works_realise_cents / 100).toString() : '',
    total_cost_previsionnel: a.total_cost_previsionnel_cents ? (a.total_cost_previsionnel_cents / 100).toString() : '',
    total_cost_realise: a.total_cost_realise_cents ? (a.total_cost_realise_cents / 100).toString() : '',
    target_sale_price_previsionnel: a.target_sale_price_previsionnel_cents ? (a.target_sale_price_previsionnel_cents / 100).toString() : '',
    target_sale_price_realise: a.target_sale_price_realise_cents ? (a.target_sale_price_realise_cents / 100).toString() : '',
    best_offer_previsionnel: a.best_offer_previsionnel_cents ? (a.best_offer_previsionnel_cents / 100).toString() : '',
    best_offer_realise: a.best_offer_realise_cents ? (a.best_offer_realise_cents / 100).toString() : '',
    works_progress_percent: a.works_progress_percent != null ? a.works_progress_percent.toString() : '',
    budget_variance_percent: a.budget_variance_percent != null ? a.budget_variance_percent.toString() : '',
    sale_start_date: a.sale_start_date || '',
    visits_count: a.visits_count != null ? a.visits_count.toString() : '',
    offers_count: a.offers_count != null ? a.offers_count.toString() : '',
    listed_price: a.listed_price_cents ? (a.listed_price_cents / 100).toString() : '',
    risk_identified: a.risk_identified || '',
    risk_impact: a.risk_impact || '',
    corrective_action: a.corrective_action || '',
    estimated_compromise_date: a.estimated_compromise_date || '',
    estimated_deed_date: a.estimated_deed_date || '',
    estimated_repayment_date: a.estimated_repayment_date || '',
    exit_confirmed: a.exit_confirmed || false,
  };
}

// Convert form data (EUR) to API payload (cents)
function formToApi(form) {
  const toC = (v) => v ? Math.round(parseFloat(v) * 100) : null;
  const toN = (v) => v ? parseFloat(v) : null;
  const toI = (v) => v ? parseInt(v, 10) : null;
  return {
    operation_status: form.operation_status,
    expected_repayment_date: form.expected_repayment_date || null,
    summary: form.summary || null,
    purchase_price_previsionnel_cents: toC(form.purchase_price_previsionnel),
    purchase_price_realise_cents: toC(form.purchase_price_realise),
    works_previsionnel_cents: toC(form.works_previsionnel),
    works_realise_cents: toC(form.works_realise),
    total_cost_previsionnel_cents: toC(form.total_cost_previsionnel),
    total_cost_realise_cents: toC(form.total_cost_realise),
    target_sale_price_previsionnel_cents: toC(form.target_sale_price_previsionnel),
    target_sale_price_realise_cents: toC(form.target_sale_price_realise),
    best_offer_previsionnel_cents: toC(form.best_offer_previsionnel),
    best_offer_realise_cents: toC(form.best_offer_realise),
    works_progress_percent: toN(form.works_progress_percent),
    budget_variance_percent: toN(form.budget_variance_percent),
    sale_start_date: form.sale_start_date || null,
    visits_count: toI(form.visits_count),
    offers_count: toI(form.offers_count),
    listed_price_cents: toC(form.listed_price),
    risk_identified: form.risk_identified || null,
    risk_impact: form.risk_impact || null,
    corrective_action: form.corrective_action || null,
    estimated_compromise_date: form.estimated_compromise_date || null,
    estimated_deed_date: form.estimated_deed_date || null,
    estimated_repayment_date: form.estimated_repayment_date || null,
    exit_confirmed: form.exit_confirmed,
  };
}

export default function AdminMvpReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Project data
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // Reports list
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  // Form state
  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  useEffect(() => { loadProject(); }, [id]);
  useEffect(() => { if (project) loadReports(); }, [id, page, project]);

  const loadProject = async () => {
    setLoadingProject(true);
    try {
      const res = await adminApi.getProject(id);
      const d = res.data.data;
      setProject(d.attributes || d);
    } catch {
      toast.error('Erreur lors du chargement du projet');
    } finally {
      setLoadingProject(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await adminApi.getMvpReports(id, { page });
      setReports(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSetOperationType = async (type) => {
    try {
      await adminApi.updateProject(id, { operation_type: type });
      setProject((prev) => ({ ...prev, operation_type: type }));
      toast.success('Type d\'operation mis a jour');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la mise a jour');
    }
  };

  const handleCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode('create');
  };

  const handleEdit = (report) => {
    const a = report.attributes || report;
    setForm(apiToForm(report));
    setEditingId(report.id);
    setMode('edit');
  };

  const handleView = (report) => {
    setViewReport(report);
    setMode('view');
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      await adminApi.deleteMvpReport(id, reportId);
      toast.success('Rapport supprime');
      loadReports();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = formToApi(form);
      if (mode === 'create') {
        await adminApi.createMvpReport(id, payload);
        toast.success('Rapport cree');
      } else {
        await adminApi.updateMvpReport(id, editingId, payload);
        toast.success('Rapport mis a jour');
      }
      setMode('list');
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-compute total cost
  useEffect(() => {
    const pp = parseFloat(form.purchase_price_previsionnel) || 0;
    const wp = parseFloat(form.works_previsionnel) || 0;
    if (pp || wp) setForm((prev) => ({ ...prev, total_cost_previsionnel: (pp + wp).toString() }));
  }, [form.purchase_price_previsionnel, form.works_previsionnel]);

  useEffect(() => {
    const pr = parseFloat(form.purchase_price_realise) || 0;
    const wr = parseFloat(form.works_realise) || 0;
    if (pr || wr) setForm((prev) => ({ ...prev, total_cost_realise: (pr + wr).toString() }));
  }, [form.purchase_price_realise, form.works_realise]);

  if (loadingProject) {
    return <div className="page"><div className="page-loading"><div className="spinner" /></div></div>;
  }

  if (!project) {
    return (
      <div className="page">
        <div className="card"><div className="empty-state"><p>Projet introuvable</p></div></div>
      </div>
    );
  }

  const isWorkPhase = form.operation_status === 'en_renovation';
  const isSalePhase = ['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(form.operation_status);
  const isMarchand = project.operation_type === 'marchand_de_biens';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/admin/projects')}>
            <ArrowLeft size={16} /> Retour
          </button>
          <div>
            <h1>Rapport MVP</h1>
            <p className="text-muted">{project.title} &mdash; {project.property_city || 'N/A'}</p>
          </div>
        </div>
        {mode === 'list' && isMarchand && (
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={16} /> Nouveau rapport
          </button>
        )}
      </div>

      {/* Operation Type Selection */}
      {!project.operation_type && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '.5rem' }}>Type d'operation</h3>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Selectionnez le type d'operation pour ce projet. Cela determine le modele de rapport.
          </p>
          <div className="operation-type-selector">
            {Object.entries(OPERATION_TYPES).map(([key, label]) => (
              <div
                key={key}
                className="operation-type-option"
                onClick={() => handleSetOperationType(key)}
              >
                <span className="type-emoji">{OPERATION_TYPE_ICONS[key]}</span>
                <span className="type-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show current operation type */}
      {project.operation_type && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge badge-info">
            {OPERATION_TYPE_ICONS[project.operation_type]} {OPERATION_TYPES[project.operation_type]}
          </span>
          <button
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '.75rem' }}
            onClick={() => setProject((prev) => ({ ...prev, operation_type: null }))}
          >
            Modifier le type
          </button>
        </div>
      )}

      {/* If not Marchand de Biens */}
      {project.operation_type && !isMarchand && (
        <div className="card">
          <div className="empty-state">
            <p>Le template de rapport pour <strong>{OPERATION_TYPES[project.operation_type]}</strong> sera disponible prochainement.</p>
          </div>
        </div>
      )}

      {/* Marchand de Biens content */}
      {isMarchand && mode === 'list' && (
        <>
          {/* Project summary card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="detail-grid">
              <div className="detail-row"><span>Montant leve</span><span>{fmt(project.amount_raised_cents)}</span></div>
              <div className="detail-row"><span>Montant total</span><span>{fmt(project.total_amount_cents)}</span></div>
              <div className="detail-row"><span>Taux brut</span><span>{project.gross_yield_percent ?? '\u2014'} %</span></div>
              <div className="detail-row"><span>Duree</span><span>{project.funding_start_date && project.funding_end_date ? `${fmtDate(project.funding_start_date)} \u2192 ${fmtDate(project.funding_end_date)}` : '\u2014'}</span></div>
              <div className="detail-row"><span>Statut</span><span className={`badge ${project.status === 'ouvert' ? 'badge-info' : project.status === 'finance' ? 'badge-success' : 'badge-warning'}`}>{project.status}</span></div>
            </div>
          </div>

          {/* Reports list */}
          {loadingReports ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : reports.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>Aucun rapport pour ce projet</p>
                <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: '1rem' }}>
                  <Plus size={16} /> Creer le premier rapport
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Statut</th><th>Resume</th><th>Auteur</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const a = r.attributes || r;
                      return (
                        <tr key={r.id}>
                          <td>{fmtDate(a.created_at)}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGE_MAP[a.operation_status] || ''}`}>
                              {OPERATION_STATUSES[a.operation_status] || a.operation_status}
                            </span>
                          </td>
                          <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.summary || '\u2014'}
                          </td>
                          <td>{a.author_name}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => handleView(r)}><Eye size={16} /></button>
                              <button className="btn-icon" title="Modifier" onClick={() => handleEdit(r)}><Pencil size={16} /></button>
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDelete(r.id)}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {meta.total_pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm"><ChevronLeft size={16} /></button>
                  <span>Page {page} / {meta.total_pages}</span>
                  <button disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)} className="btn btn-sm"><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* View mode */}
      {isMarchand && mode === 'view' && viewReport && (() => {
        const a = viewReport.attributes || viewReport;
        const viewIsWork = a.operation_status === 'en_renovation';
        const viewIsSale = ['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(a.operation_status);
        return (
          <div className="card mvp-report-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Rapport du {fmtDate(a.created_at)}</h3>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-sm" onClick={() => handleEdit(viewReport)}><Pencil size={14} /> Modifier</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setMode('list')}><X size={14} /> Fermer</button>
              </div>
            </div>

            {/* A. General Info */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
              <div className="detail-grid">
                <div className="detail-row"><span>Projet</span><span>{project.title}</span></div>
                <div className="detail-row"><span>Localisation</span><span>{project.property_city || '\u2014'}</span></div>
                <div className="detail-row"><span>Montant leve</span><span>{fmt(project.amount_raised_cents)}</span></div>
                <div className="detail-row"><span>Taux</span><span>{project.gross_yield_percent ?? '\u2014'} %</span></div>
                <div className="detail-row"><span>Date remboursement previsionnelle</span><span>{fmtDate(a.expected_repayment_date)}</span></div>
                <div className="detail-row">
                  <span>Statut actuel</span>
                  <span className={`badge ${STATUS_BADGE_MAP[a.operation_status] || ''}`}>
                    {OPERATION_STATUSES[a.operation_status] || a.operation_status}
                  </span>
                </div>
              </div>
            </div>

            {/* B. Summary */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{a.summary || 'Aucun resume fourni.'}</p>
            </div>

            {/* C. Key Data */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
              <table className="mvp-comparison-table">
                <thead>
                  <tr><th className="col-label">Element</th><th>Previsionnel</th><th>Realise</th><th>Ecart</th></tr>
                </thead>
                <tbody>
                  {[
                    ['Prix d\'achat', a.purchase_price_previsionnel_cents, a.purchase_price_realise_cents],
                    ['Travaux', a.works_previsionnel_cents, a.works_realise_cents],
                    ['Cout total', a.total_cost_previsionnel_cents, a.total_cost_realise_cents],
                    ['Prix de vente cible', a.target_sale_price_previsionnel_cents, a.target_sale_price_realise_cents],
                    ['Meilleure offre', a.best_offer_previsionnel_cents, a.best_offer_realise_cents],
                  ].map(([label, prev, real]) => {
                    const ecart = (prev && real) ? real - prev : null;
                    return (
                      <tr key={label}>
                        <td className="col-label">{label}</td>
                        <td className="col-previsionnel">{prev ? fmt(prev) : '\u2014'}</td>
                        <td className="col-realise">{real ? fmt(real) : '\u2014'}</td>
                        <td className={`col-ecart ${ecart > 0 ? 'ecart-negative' : ecart < 0 ? 'ecart-positive' : ''}`}>
                          {ecart != null ? fmt(ecart) : '\u2014'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* D. Progress */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
              {viewIsWork && (
                <div className="detail-grid">
                  <div className="detail-row"><span>% Travaux</span><span>{a.works_progress_percent != null ? `${a.works_progress_percent} %` : '\u2014'}</span></div>
                  <div className="detail-row"><span>Ecart budget</span><span>{a.budget_variance_percent != null ? `${a.budget_variance_percent} %` : '\u2014'}</span></div>
                </div>
              )}
              {viewIsSale && (
                <div className="detail-grid">
                  <div className="detail-row"><span>Date mise en vente</span><span>{fmtDate(a.sale_start_date)}</span></div>
                  <div className="detail-row"><span>Nombre de visites</span><span>{a.visits_count ?? '\u2014'}</span></div>
                  <div className="detail-row"><span>Nombre d'offres</span><span>{a.offers_count ?? '\u2014'}</span></div>
                  <div className="detail-row"><span>Prix affiche</span><span>{a.listed_price_cents ? fmt(a.listed_price_cents) : '\u2014'}</span></div>
                </div>
              )}
              {!viewIsWork && !viewIsSale && (
                <p className="text-muted">Les champs d'avancement s'affichent selon le statut (en renovation ou en commercialisation).</p>
              )}
            </div>

            {/* E. Risk */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
              <div className="detail-grid">
                <div className="detail-row"><span>Risque identifie</span><span>{a.risk_identified || '\u2014'}</span></div>
                <div className="detail-row"><span>Impact</span><span>{a.risk_impact || '\u2014'}</span></div>
                <div className="detail-row"><span>Action corrective</span><span>{a.corrective_action || '\u2014'}</span></div>
              </div>
            </div>

            {/* F. Exit Forecast */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
              <div className="detail-grid">
                <div className="detail-row"><span>Date estimee compromis</span><span>{fmtDate(a.estimated_compromise_date)}</span></div>
                <div className="detail-row"><span>Date estimee acte</span><span>{fmtDate(a.estimated_deed_date)}</span></div>
                <div className="detail-row"><span>Date remboursement estimee</span><span>{fmtDate(a.estimated_repayment_date)}</span></div>
                <div className="detail-row">
                  <span>Date</span>
                  <span className={`badge ${a.exit_confirmed ? 'badge-success' : 'badge-warning'}`}>
                    {a.exit_confirmed ? 'Confirmee' : 'Non confirmee'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create / Edit form */}
      {isMarchand && (mode === 'create' || mode === 'edit') && (
        <form onSubmit={handleSubmit}>
          <div className="card mvp-report-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{mode === 'create' ? 'Nouveau rapport ' : 'Modifier le rapport'}</h3>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('list')}><X size={14} /> Annuler</button>
            </div>

            {/* A. General Info */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
              <div className="detail-grid" style={{ marginBottom: '1rem' }}>
                <div className="detail-row"><span>Projet</span><span>{project.title}</span></div>
                <div className="detail-row"><span>Localisation</span><span>{project.property_city || '\u2014'}</span></div>
                <div className="detail-row"><span>Montant leve</span><span>{fmt(project.amount_raised_cents)}</span></div>
                <div className="detail-row"><span>Taux</span><span>{project.gross_yield_percent ?? '\u2014'} %</span></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Statut actuel</label>
                  <select value={form.operation_status} onChange={updateField('operation_status')}>
                    {Object.entries(OPERATION_STATUSES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date previsionnelle remboursement</label>
                  <input type="date" value={form.expected_repayment_date} onChange={updateField('expected_repayment_date')} />
                </div>
              </div>
            </div>

            {/* B. Summary */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
              <div className="form-group">
                <textarea
                  value={form.summary}
                  onChange={updateField('summary')}
                  placeholder="Resume du projet (5 lignes max, 500 caracteres)"
                  rows={5}
                  maxLength={500}
                />
                <span className="text-muted" style={{ fontSize: '.75rem' }}>{form.summary.length} / 500</span>
              </div>
            </div>

            {/* C. Key Data */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
              <table className="mvp-comparison-table">
                <thead>
                  <tr><th className="col-label">Element</th><th>Previsionnel (EUR)</th><th>Realise (EUR)</th></tr>
                </thead>
                <tbody>
                  {[
                    ['Prix d\'achat', 'purchase_price_previsionnel', 'purchase_price_realise'],
                    ['Travaux', 'works_previsionnel', 'works_realise'],
                    ['Cout total', 'total_cost_previsionnel', 'total_cost_realise'],
                    ['Prix de vente cible', 'target_sale_price_previsionnel', 'target_sale_price_realise'],
                    ['Meilleure offre', 'best_offer_previsionnel', 'best_offer_realise'],
                  ].map(([label, prevField, realField]) => {
                    const isTotal = prevField === 'total_cost_previsionnel';
                    return (
                      <tr key={label}>
                        <td className="col-label">{label}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={form[prevField]}
                            onChange={updateField(prevField)}
                            placeholder="0.00"
                            readOnly={isTotal}
                            style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={form[realField]}
                            onChange={updateField(realField)}
                            placeholder="0.00"
                            readOnly={isTotal}
                            style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* D. Progress */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
              {isWorkPhase && (
                <div className="form-row">
                  <div className="form-group">
                    <label>% Travaux</label>
                    <input type="number" step="0.01" min="0" max="100" value={form.works_progress_percent} onChange={updateField('works_progress_percent')} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Ecart budget (%)</label>
                    <input type="number" step="0.01" value={form.budget_variance_percent} onChange={updateField('budget_variance_percent')} placeholder="0" />
                  </div>
                </div>
              )}
              {isSalePhase && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date mise en vente</label>
                      <input type="date" value={form.sale_start_date} onChange={updateField('sale_start_date')} />
                    </div>
                    <div className="form-group">
                      <label>Prix affiche (EUR)</label>
                      <input type="number" step="0.01" value={form.listed_price} onChange={updateField('listed_price')} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre de visites</label>
                      <input type="number" min="0" value={form.visits_count} onChange={updateField('visits_count')} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label>Nombre d'offres</label>
                      <input type="number" min="0" value={form.offers_count} onChange={updateField('offers_count')} placeholder="0" />
                    </div>
                  </div>
                </>
              )}
              {!isWorkPhase && !isSalePhase && (
                <p className="text-muted">Selectionnez le statut "En renovation" ou "En commercialisation" pour afficher les champs d'avancement.</p>
              )}
            </div>

            {/* E. Risk */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
              <div className="form-group" style={{ marginBottom: '.75rem' }}>
                <label>Risque identifie</label>
                <input type="text" value={form.risk_identified} onChange={updateField('risk_identified')} placeholder="Ex: Retard livraison materiaux" />
              </div>
              <div className="form-group" style={{ marginBottom: '.75rem' }}>
                <label>Impact</label>
                <input type="text" value={form.risk_impact} onChange={updateField('risk_impact')} placeholder="Ex: Decalage de 2 semaines" />
              </div>
              <div className="form-group">
                <label>Action corrective</label>
                <textarea value={form.corrective_action} onChange={updateField('corrective_action')} rows={3} placeholder="Ex: Relance fournisseur + plan B commande" />
              </div>
            </div>

            {/* F. Exit Forecast */}
            <div className="mvp-section">
              <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date estimee compromis</label>
                  <input type="date" value={form.estimated_compromise_date} onChange={updateField('estimated_compromise_date')} />
                </div>
                <div className="form-group">
                  <label>Date estimee acte</label>
                  <input type="date" value={form.estimated_deed_date} onChange={updateField('estimated_deed_date')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date remboursement estimee</label>
                  <input type="date" value={form.estimated_repayment_date} onChange={updateField('estimated_repayment_date')} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="exit_confirmed"
                    checked={form.exit_confirmed}
                    onChange={updateField('exit_confirmed')}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="exit_confirmed" style={{ margin: 0, cursor: 'pointer' }}>Date confirmee</label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button type="button" className="btn" onClick={() => setMode('list')}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
