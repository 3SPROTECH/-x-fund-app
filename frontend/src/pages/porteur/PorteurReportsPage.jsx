import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mvpReportsApi, investmentProjectsApi } from '../../api/investments';
import {
  FileText, Plus, Eye, Pencil, Send, Trash2, Save, X, Search,
  XCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormSelect from '../../components/FormSelect';
import { LoadingSpinner, Pagination } from '../../components/ui';
import { mvpApiToForm, mvpFormToApi } from '../../utils/mvpHelpers';
import {
  formatCents as fmt, formatDate as fmtDate,
  OPERATION_TYPES, OPERATION_TYPE_ICONS, OPERATION_STATUSES, getOperationStatusLabel,
  MVP_STATUS_BADGES as MVP_STATUS_BADGE, REVIEW_STATUS_LABELS, REVIEW_STATUS_BADGES as REVIEW_STATUS_BADGE,
  EMPTY_MVP_FORM,
} from '../../utils';

export default function PorteurReportsPage() {
  const { user } = useAuth();

  // List state
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ review_status: '', project_id: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  // Mode: list | create | edit | view
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState({ ...EMPTY_MVP_FORM });
  const [editingId, setEditingId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [viewReport, setViewReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadReports(); }, [page, filters]);
  useEffect(() => { loadProjects(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.review_status) params.review_status = filters.review_status;
      if (filters.project_id) params.project_id = filters.project_id;
      const res = await mvpReportsApi.listAll(params);
      setReports(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des rapports');
    } finally { setLoading(false); }
  };

  const loadProjects = async () => {
    try {
      const res = await investmentProjectsApi.list({ per_page: 100 });
      const allProjects = res.data.data || [];
      // Only show projects owned by current user with active statuses
      const owned = allProjects.filter((p) => {
        const a = p.attributes || p;
        const isOwner = String(a.owner_id) === String(user?.id);
        return isOwner && !['draft', 'rejected'].includes(a.status);
      });
      setProjects(owned);
    } catch { /* silent */ }
  };

  // Get project info for a report
  const getProjectForReport = (report) => {
    const ra = report.attributes || report;
    return projects.find((p) => String(p.id) === String(ra.investment_project_id));
  };

  const getProjectAttrs = (project) => project?.attributes || project || {};

  // Handlers
  const handleCreate = () => {
    if (projects.length === 0) {
      toast.error('Aucun projet disponible pour creer un rapport');
      return;
    }
    setForm({ ...EMPTY_MVP_FORM });
    setEditingId(null);
    setEditingProjectId(null);
    setSelectedProjectId(projects[0]?.id || '');
    setMode('create');
    window.scrollTo(0, 0);
  };

  const handleEdit = (report) => {
    const ra = report.attributes || report;
    setForm(mvpApiToForm(report));
    setEditingId(report.id);
    setEditingProjectId(ra.investment_project_id);
    setMode('edit');
    window.scrollTo(0, 0);
  };

  const handleView = (report) => {
    setViewReport(report);
    setMode('view');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (report) => {
    const ra = report.attributes || report;
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      await mvpReportsApi.delete(ra.investment_project_id, report.id);
      toast.success('Rapport supprime');
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = mvpFormToApi(form);
      const projectId = mode === 'create' ? selectedProjectId : editingProjectId;
      if (mode === 'create') {
        await mvpReportsApi.create(projectId, payload);
        toast.success('Rapport cree');
      } else {
        await mvpReportsApi.update(projectId, editingId, payload);
        toast.success('Rapport mis a jour');
      }
      setMode('list');
      window.scrollTo(0, 0);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setSubmitting(false); }
  };

  const handleSubmitForReview = async (report) => {
    const ra = report.attributes || report;
    if (!window.confirm("Soumettre ce rapport pour validation par l'admin ?")) return;
    setSubmitting(true);
    try {
      await mvpReportsApi.submit(ra.investment_project_id, report.id);
      toast.success('Rapport soumis pour validation');
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
    } finally { setSubmitting(false); }
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

  // Get operation type for current form context
  const getFormOperationType = () => {
    const pid = mode === 'create' ? selectedProjectId : editingProjectId;
    const proj = projects.find((p) => String(p.id) === String(pid));
    return getProjectAttrs(proj).operation_type;
  };

  // ────────────────────────── RENDER ──────────────────────────

  // === LIST MODE ===
  if (mode === 'list') {
    return (
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1> Rapports de suivi</h1>
            {meta.total_count != null && (
              <span className="badge badge-info" style={{ marginLeft: '.75rem' }}>{meta.total_count} rapport{meta.total_count !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={16} /> Nouveau rapport
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Projet</label>
              <FormSelect
                value={String(filters.project_id || '')}
                onChange={(e) => { setFilters((f) => ({ ...f, project_id: e.target.value })); setPage(1); }}
                placeholder="Tous les projets"
                options={[
                  { value: '', label: 'Tous les projets' },
                  ...projects.map((p) => ({ value: String(p.id), label: getProjectAttrs(p).title })),
                ]}
              />
            </div>
            <div className="form-group">
              <label>Statut validation</label>
              <FormSelect
                value={filters.review_status || ''}
                onChange={(e) => { setFilters((f) => ({ ...f, review_status: e.target.value })); setPage(1); }}
                placeholder="Tous"
                options={[
                  { value: '', label: 'Tous' },
                  ...Object.entries(REVIEW_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={48} style={{ opacity: 0.3 }} />
              <p>Aucun rapport trouve</p>
            </div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Projet</th>
                    <th>Date</th>
                    <th>Statut operation</th>
                    <th>Validation</th>
                    <th>Resume</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const ra = r.attributes || r;
                    const canEdit = ra.review_status === 'brouillon' || ra.review_status === 'rejete';
                    const canDelete = ra.review_status === 'brouillon';
                    const canSubmit = ra.review_status === 'brouillon';
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{ra.project_title || '\u2014'}</td>
                        <td>{fmtDate(ra.created_at)}</td>
                        <td>
                          <span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>
                            {getOperationStatusLabel(ra.project_operation_type, ra.operation_status)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>
                            {REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ra.summary || '\u2014'}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-icon" title="Voir" onClick={() => handleView(r)}><Eye size={16} /></button>
                            {canEdit && (
                              <button className="btn-icon" title="Modifier" onClick={() => handleEdit(r)}><Pencil size={16} /></button>
                            )}
                            {canSubmit && (
                              <button className="btn-icon btn-success" title="Soumettre" onClick={() => handleSubmitForReview(r)}><Send size={16} /></button>
                            )}
                            {canDelete && (
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {meta.total_pages > 1 && (
              <Pagination current={page} total={meta.total_pages} onChange={setPage} />
            )}
          </>
        )}
      </div>
    );
  }

  // === VIEW MODE ===
  if (mode === 'view' && viewReport) {
    const ra = viewReport.attributes || viewReport;
    const operationType = ra.project_operation_type;
    const viewIsWork = ra.operation_status === 'en_renovation';
    const viewIsSale = ['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(ra.operation_status);
    const canEditThis = ra.review_status === 'brouillon' || ra.review_status === 'rejete';

    return (
      <div className="admin-page">
        <div className="page-header">
          <button className="btn btn-sm btn-ghost" onClick={() => { setMode('list'); window.scrollTo(0, 0); }}><X size={14} /> Retour a la liste</button>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {canEditThis && (
              <button className="btn btn-sm" onClick={() => handleEdit(viewReport)}><Pencil size={14} /> Modifier</button>
            )}
            {ra.review_status === 'brouillon' && (
              <button className="btn btn-sm btn-primary" onClick={() => handleSubmitForReview(viewReport)}><Send size={14} /> Soumettre</button>
            )}
          </div>
        </div>

        <div className="card mvp-report-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
            <h3>Rapport du {fmtDate(ra.created_at)}</h3>
            <span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>{REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}</span>
          </div>

          {/* Rejection comment */}
          {ra.review_status === 'rejete' && ra.review_comment && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                <XCircle size={18} color="#EF4444" />
                <span style={{ fontWeight: 600, color: '#EF4444' }}>Rapport rejete</span>
              </div>
              <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                <strong>Commentaire :</strong> {ra.review_comment}
              </p>
              {ra.reviewed_at && (
                <p style={{ margin: '.25rem 0 0', fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                  Rejete le {fmtDate(ra.reviewed_at)} par {ra.reviewer_name || 'Admin'}
                </p>
              )}
            </div>
          )}

          {/* Validation info */}
          {ra.review_status === 'valide' && (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <CheckCircle size={18} color="#10B981" />
                <span style={{ fontWeight: 600, color: '#10B981' }}>Rapport valide</span>
              </div>
              {ra.reviewed_at && (
                <p style={{ margin: '.25rem 0 0', fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                  Valide le {fmtDate(ra.reviewed_at)} par {ra.reviewer_name || 'Admin'}
                </p>
              )}
            </div>
          )}

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
            <div className="detail-grid">
              <div className="detail-row"><span>Projet</span><span>{ra.project_title}</span></div>
              <div className="detail-row"><span>Type d'operation</span><span>{operationType ? `${OPERATION_TYPE_ICONS[operationType] || ''} ${OPERATION_TYPES[operationType] || operationType}` : '\u2014'}</span></div>
              <div className="detail-row"><span>Date remboursement previsionnelle</span><span>{fmtDate(ra.expected_repayment_date)}</span></div>
              <div className="detail-row"><span>Statut actuel</span><span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>{getOperationStatusLabel(operationType, ra.operation_status)}</span></div>
            </div>
          </div>

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{ra.summary || 'Aucun resume fourni.'}</p>
          </div>

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
            <table className="mvp-comparison-table">
              <thead><tr><th className="col-label">Element</th><th>Previsionnel</th><th>Realise</th><th>Ecart</th></tr></thead>
              <tbody>
                {[
                  ["Prix d'achat", ra.purchase_price_previsionnel_cents, ra.purchase_price_realise_cents],
                  ['Travaux', ra.works_previsionnel_cents, ra.works_realise_cents],
                  ['Cout total', ra.total_cost_previsionnel_cents, ra.total_cost_realise_cents],
                  ['Prix de vente cible', ra.target_sale_price_previsionnel_cents, ra.target_sale_price_realise_cents],
                  ['Meilleure offre', ra.best_offer_previsionnel_cents, ra.best_offer_realise_cents],
                ].map(([label, prev, real]) => {
                  const ecart = (prev && real) ? real - prev : null;
                  return (
                    <tr key={label}>
                      <td className="col-label">{label}</td>
                      <td className="col-previsionnel">{prev ? fmt(prev) : '\u2014'}</td>
                      <td className="col-realise">{real ? fmt(real) : '\u2014'}</td>
                      <td className={`col-ecart ${ecart > 0 ? 'ecart-negative' : ecart < 0 ? 'ecart-positive' : ''}`}>{ecart != null ? fmt(ecart) : '\u2014'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
            {viewIsWork && (
              <div className="detail-grid">
                <div className="detail-row"><span>% Travaux</span><span>{ra.works_progress_percent != null ? `${ra.works_progress_percent} %` : '\u2014'}</span></div>
                <div className="detail-row"><span>Ecart budget</span><span>{ra.budget_variance_percent != null ? `${ra.budget_variance_percent} %` : '\u2014'}</span></div>
              </div>
            )}
            {viewIsSale && (
              <div className="detail-grid">
                <div className="detail-row"><span>Date mise en vente</span><span>{fmtDate(ra.sale_start_date)}</span></div>
                <div className="detail-row"><span>Nombre de visites</span><span>{ra.visits_count ?? '\u2014'}</span></div>
                <div className="detail-row"><span>Nombre d'offres</span><span>{ra.offers_count ?? '\u2014'}</span></div>
                <div className="detail-row"><span>Prix affiche</span><span>{ra.listed_price_cents ? fmt(ra.listed_price_cents) : '\u2014'}</span></div>
              </div>
            )}
            {!viewIsWork && !viewIsSale && <p className="text-muted">Champs visibles selon le statut (en renovation ou en commercialisation).</p>}
          </div>

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
            <div className="detail-grid">
              <div className="detail-row"><span>Risque identifie</span><span>{ra.risk_identified || '\u2014'}</span></div>
              <div className="detail-row"><span>Impact</span><span>{ra.risk_impact || '\u2014'}</span></div>
              <div className="detail-row"><span>Action corrective</span><span>{ra.corrective_action || '\u2014'}</span></div>
            </div>
          </div>

          <div className="mvp-section">
            <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
            <div className="detail-grid">
              <div className="detail-row"><span>Date estimee compromis</span><span>{fmtDate(ra.estimated_compromise_date)}</span></div>
              <div className="detail-row"><span>Date estimee acte</span><span>{fmtDate(ra.estimated_deed_date)}</span></div>
              <div className="detail-row"><span>Date remboursement estimee</span><span>{fmtDate(ra.estimated_repayment_date)}</span></div>
              <div className="detail-row"><span>Sortie</span><span className={`badge ${ra.exit_confirmed ? 'badge-success' : 'badge-warning'}`}>{ra.exit_confirmed ? 'Confirmee' : 'Non confirmee'}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === CREATE / EDIT MODE ===
  const operationType = getFormOperationType();
  const selectedProject = projects.find((p) => String(p.id) === String(mode === 'create' ? selectedProjectId : editingProjectId));
  const pa = getProjectAttrs(selectedProject);

  return (
    <div className="admin-page">
      <div className="page-header">
        <button className="btn btn-sm btn-ghost" onClick={() => { setMode('list'); window.scrollTo(0, 0); }}><X size={14} /> Retour a la liste</button>
      </div>

      <form onSubmit={handleSubmitForm}>
        <div className="card mvp-report-card">
          <h3 style={{ marginBottom: '1.5rem' }}>{mode === 'create' ? 'Nouveau rapport' : 'Modifier le rapport'}</h3>

          {/* Project selection (create only) */}
          {mode === 'create' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Projet</label>
              <FormSelect
                value={String(selectedProjectId || '')}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                placeholder="Sélectionnez un projet"
                options={projects.map((p) => ({ value: String(p.id), label: getProjectAttrs(p).title }))}
              />
            </div>
          )}

          {/* Warn if no operation type set */}
          {!operationType && (
            <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <p className="text-muted">
                Ce projet n'a pas encore de type d'operation defini. Veuillez d'abord definir le type d'operation dans l'onglet "Rapports" de la page projet.
              </p>
            </div>
          )}

          {operationType && (
            <>
              {operationType !== 'marchand_de_biens' && (
                <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.875rem' }}>
                  Rapport de suivi pour <strong>{OPERATION_TYPES[operationType]}</strong>.
                </p>
              )}

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
                <div className="detail-grid" style={{ marginBottom: '1rem' }}>
                  <div className="detail-row"><span>Projet</span><span>{pa.title}</span></div>
                  <div className="detail-row"><span>Localisation</span><span>{pa.property_city || '\u2014'}</span></div>
                  <div className="detail-row"><span>Montant leve</span><span>{fmt(pa.amount_raised_cents)}</span></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Statut actuel</label>
                    <FormSelect
                      value={form.operation_status || ''}
                      onChange={updateField('operation_status')}
                      placeholder="Statut actuel"
                      options={Object.keys(OPERATION_STATUSES).map((k) => ({
                        value: k,
                        label: getOperationStatusLabel(operationType, k),
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date previsionnelle remboursement</label>
                    <input type="date" value={form.expected_repayment_date} onChange={updateField('expected_repayment_date')} />
                  </div>
                </div>
              </div>

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
                <div className="form-group">
                  <textarea value={form.summary} onChange={updateField('summary')} placeholder="Resume du projet (5 lignes max, 500 caracteres)" rows={5} maxLength={500} />
                  <span className="text-muted" style={{ fontSize: '.75rem' }}>{form.summary.length} / 500</span>
                </div>
              </div>

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
                <table className="mvp-comparison-table">
                  <thead><tr><th className="col-label">Element</th><th>Previsionnel (EUR)</th><th>Realise (EUR)</th></tr></thead>
                  <tbody>
                    {[
                      ["Prix d'achat", 'purchase_price_previsionnel', 'purchase_price_realise'],
                      ['Travaux', 'works_previsionnel', 'works_realise'],
                      ['Cout total', 'total_cost_previsionnel', 'total_cost_realise'],
                      ['Prix de vente cible', 'target_sale_price_previsionnel', 'target_sale_price_realise'],
                      ['Meilleure offre', 'best_offer_previsionnel', 'best_offer_realise'],
                    ].map(([label, prevF, realF]) => {
                      const isTotal = prevF === 'total_cost_previsionnel';
                      return (
                        <tr key={label}>
                          <td className="col-label">{label}</td>
                          <td><input type="number" step="0.01" value={form[prevF]} onChange={updateField(prevF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                          <td><input type="number" step="0.01" value={form[realF]} onChange={updateField(realF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
                {form.operation_status === 'en_renovation' && (
                  <div className="form-row">
                    <div className="form-group"><label>% Travaux</label><input type="number" step="0.01" min="0" max="100" value={form.works_progress_percent} onChange={updateField('works_progress_percent')} placeholder="0" /></div>
                    <div className="form-group"><label>Ecart budget (%)</label><input type="number" step="0.01" value={form.budget_variance_percent} onChange={updateField('budget_variance_percent')} placeholder="0" /></div>
                  </div>
                )}
                {['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(form.operation_status) && (
                  <>
                    <div className="form-row">
                      <div className="form-group"><label>Date mise en vente</label><input type="date" value={form.sale_start_date} onChange={updateField('sale_start_date')} /></div>
                      <div className="form-group"><label>Prix affiche (EUR)</label><input type="number" step="0.01" value={form.listed_price} onChange={updateField('listed_price')} placeholder="0.00" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Nombre de visites</label><input type="number" min="0" value={form.visits_count} onChange={updateField('visits_count')} placeholder="0" /></div>
                      <div className="form-group"><label>Nombre d'offres</label><input type="number" min="0" value={form.offers_count} onChange={updateField('offers_count')} placeholder="0" /></div>
                    </div>
                  </>
                )}
                {form.operation_status !== 'en_renovation' && !['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(form.operation_status) && (
                  <p className="text-muted">Selectionnez "En renovation" ou "En commercialisation" pour les champs d'avancement.</p>
                )}
              </div>

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Risque identifie</label><input type="text" value={form.risk_identified} onChange={updateField('risk_identified')} placeholder="Ex: Retard livraison materiaux" /></div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Impact</label><input type="text" value={form.risk_impact} onChange={updateField('risk_impact')} placeholder="Ex: Decalage de 2 semaines" /></div>
                <div className="form-group"><label>Action corrective</label><textarea value={form.corrective_action} onChange={updateField('corrective_action')} rows={3} placeholder="Ex: Relance fournisseur + plan B commande" /></div>
              </div>

              <div className="mvp-section">
                <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
                <div className="form-row">
                  <div className="form-group"><label>Date estimee compromis</label><input type="date" value={form.estimated_compromise_date} onChange={updateField('estimated_compromise_date')} /></div>
                  <div className="form-group"><label>Date estimee acte</label><input type="date" value={form.estimated_deed_date} onChange={updateField('estimated_deed_date')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Date remboursement estimee</label><input type="date" value={form.estimated_repayment_date} onChange={updateField('estimated_repayment_date')} /></div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
                    <input type="checkbox" id="mvp_exit_confirmed_porteur" checked={form.exit_confirmed} onChange={updateField('exit_confirmed')} style={{ width: 'auto' }} />
                    <label htmlFor="mvp_exit_confirmed_porteur" style={{ margin: 0, cursor: 'pointer' }}>Date confirmee</label>
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => { setMode('list'); window.scrollTo(0, 0); }}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={16} /> {submitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
