import { useState, useEffect } from 'react';
import { investmentProjectsApi, mvpReportsApi } from '../../api/investments';
import { adminApi } from '../../api/admin';
import { Plus, X, Eye, Pencil, Send, Check, XCircle, Trash2, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  formatCents as fmt, formatDate as fmtDate,
  OPERATION_TYPES, OPERATION_TYPE_ICONS, OPERATION_STATUSES, getOperationStatusLabel,
  MVP_STATUS_BADGES as MVP_STATUS_BADGE, REVIEW_STATUS_LABELS, REVIEW_STATUS_BADGES as REVIEW_STATUS_BADGE,
  EMPTY_MVP_FORM,
} from '../../utils';
import { LoadingSpinner } from '../../components/ui';

function mvpApiToForm(data) {
  const r = data.attributes || data;
  const c = (v) => v ? (v / 100).toString() : '';
  const s = (v) => v != null ? v.toString() : '';
  return {
    operation_status: r.operation_status || 'acquisition_en_cours', expected_repayment_date: r.expected_repayment_date || '',
    summary: r.summary || '',
    purchase_price_previsionnel: c(r.purchase_price_previsionnel_cents), purchase_price_realise: c(r.purchase_price_realise_cents),
    works_previsionnel: c(r.works_previsionnel_cents), works_realise: c(r.works_realise_cents),
    total_cost_previsionnel: c(r.total_cost_previsionnel_cents), total_cost_realise: c(r.total_cost_realise_cents),
    target_sale_price_previsionnel: c(r.target_sale_price_previsionnel_cents), target_sale_price_realise: c(r.target_sale_price_realise_cents),
    best_offer_previsionnel: c(r.best_offer_previsionnel_cents), best_offer_realise: c(r.best_offer_realise_cents),
    works_progress_percent: s(r.works_progress_percent), budget_variance_percent: s(r.budget_variance_percent),
    sale_start_date: r.sale_start_date || '', visits_count: s(r.visits_count), offers_count: s(r.offers_count),
    listed_price: c(r.listed_price_cents),
    risk_identified: r.risk_identified || '', risk_impact: r.risk_impact || '', corrective_action: r.corrective_action || '',
    estimated_compromise_date: r.estimated_compromise_date || '', estimated_deed_date: r.estimated_deed_date || '',
    estimated_repayment_date: r.estimated_repayment_date || '', exit_confirmed: r.exit_confirmed || false,
  };
}
function mvpFormToApi(f) {
  const toC = (v) => v ? Math.round(parseFloat(v) * 100) : null;
  const toN = (v) => v ? parseFloat(v) : null;
  const toI = (v) => v ? parseInt(v, 10) : null;
  return {
    operation_status: f.operation_status, expected_repayment_date: f.expected_repayment_date || null, summary: f.summary || null,
    purchase_price_previsionnel_cents: toC(f.purchase_price_previsionnel), purchase_price_realise_cents: toC(f.purchase_price_realise),
    works_previsionnel_cents: toC(f.works_previsionnel), works_realise_cents: toC(f.works_realise),
    total_cost_previsionnel_cents: toC(f.total_cost_previsionnel), total_cost_realise_cents: toC(f.total_cost_realise),
    target_sale_price_previsionnel_cents: toC(f.target_sale_price_previsionnel), target_sale_price_realise_cents: toC(f.target_sale_price_realise),
    best_offer_previsionnel_cents: toC(f.best_offer_previsionnel), best_offer_realise_cents: toC(f.best_offer_realise),
    works_progress_percent: toN(f.works_progress_percent), budget_variance_percent: toN(f.budget_variance_percent),
    sale_start_date: f.sale_start_date || null, visits_count: toI(f.visits_count), offers_count: toI(f.offers_count),
    listed_price_cents: toC(f.listed_price),
    risk_identified: f.risk_identified || null, risk_impact: f.risk_impact || null, corrective_action: f.corrective_action || null,
    estimated_compromise_date: f.estimated_compromise_date || null, estimated_deed_date: f.estimated_deed_date || null,
    estimated_repayment_date: f.estimated_repayment_date || null, exit_confirmed: f.exit_confirmed,
  };
}

export default function ProjectReportsTab({ project, projectId, isAdmin, isOwner, user, setProject, onRefresh }) {
  const a = project.attributes || project;

  const [mvpReports, setMvpReports] = useState([]);
  const [loadingMvpReports, setLoadingMvpReports] = useState(false);
  const [mvpMode, setMvpMode] = useState('list');
  const [mvpForm, setMvpForm] = useState({ ...EMPTY_MVP_FORM });
  const [mvpEditingId, setMvpEditingId] = useState(null);
  const [mvpViewReport, setMvpViewReport] = useState(null);
  const [mvpSubmitting, setMvpSubmitting] = useState(false);
  const [rejectModalReport, setRejectModalReport] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  // Load MVP reports on mount
  useEffect(() => { loadMvpReports(); }, []);

  const loadMvpReports = async () => {
    setLoadingMvpReports(true);
    try {
      const res = user?.role === 'administrateur'
        ? await adminApi.getMvpReports(projectId)
        : await mvpReportsApi.list(projectId);
      setMvpReports(res.data.data || []);
    } catch { /* silent - no access */ }
    finally { setLoadingMvpReports(false); }
  };

  const handleSetOperationType = async (type) => {
    try {
      if (user?.role === 'administrateur') {
        await adminApi.updateProject(projectId, { operation_type: type });
      } else {
        await investmentProjectsApi.update(projectId, { operation_type: type });
      }
      setProject((prev) => {
        const attrs = prev.attributes || prev;
        return prev.attributes
          ? { ...prev, attributes: { ...attrs, operation_type: type } }
          : { ...prev, operation_type: type };
      });
      toast.success("Type d'operation mis a jour");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur');
    }
  };

  const handleMvpCreate = () => { setMvpForm({ ...EMPTY_MVP_FORM }); setMvpEditingId(null); setMvpMode('create'); };
  const handleMvpEdit = (report) => { setMvpForm(mvpApiToForm(report)); setMvpEditingId(report.id); setMvpMode('edit'); };
  const handleMvpView = (report) => { setMvpViewReport(report); setMvpMode('view'); };

  const handleMvpDelete = async (reportId) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      if (isAdmin) {
        await adminApi.deleteMvpReport(projectId, reportId);
      } else {
        await mvpReportsApi.delete(projectId, reportId);
      }
      toast.success('Rapport supprime');
      loadMvpReports();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur lors de la suppression'); }
  };

  const handleMvpSubmit = async (e) => {
    e.preventDefault();
    setMvpSubmitting(true);
    try {
      const payload = mvpFormToApi(mvpForm);
      if (mvpMode === 'create') {
        if (isAdmin) {
          await adminApi.createMvpReport(projectId, payload);
        } else {
          await mvpReportsApi.create(projectId, payload);
        }
        toast.success('Rapport cree');
      } else {
        if (isAdmin) {
          await adminApi.updateMvpReport(projectId, mvpEditingId, payload);
        } else {
          await mvpReportsApi.update(projectId, mvpEditingId, payload);
        }
        toast.success('Rapport mis a jour');
      }
      setMvpMode('list');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setMvpSubmitting(false); }
  };

  const handleMvpSubmitForReview = async (reportId) => {
    if (!window.confirm('Soumettre ce rapport pour validation par l\'admin ?')) return;
    setMvpSubmitting(true);
    try {
      await mvpReportsApi.submit(projectId, reportId);
      toast.success('Rapport soumis pour validation');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
    } finally { setMvpSubmitting(false); }
  };

  const handleMvpValidate = async (reportId) => {
    if (!window.confirm('Valider ce rapport ? Le projet sera approuve et publie.')) return;
    setMvpSubmitting(true);
    try {
      await adminApi.validateMvpReport(projectId, reportId);
      toast.success('Rapport valide. Projet approuve et publie.');
      loadMvpReports();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la validation');
    } finally { setMvpSubmitting(false); }
  };

  const handleMvpReject = async () => {
    if (!rejectComment.trim()) { toast.error('Un commentaire est requis'); return; }
    setMvpSubmitting(true);
    try {
      await adminApi.rejectMvpReport(projectId, rejectModalReport.id, rejectComment);
      toast.success('Rapport rejete');
      setRejectModalReport(null);
      setRejectComment('');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du rejet');
    } finally { setMvpSubmitting(false); }
  };

  const updateMvpField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMvpForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-compute total cost for MVP
  useEffect(() => {
    const pp = parseFloat(mvpForm.purchase_price_previsionnel) || 0;
    const wp = parseFloat(mvpForm.works_previsionnel) || 0;
    if (pp || wp) setMvpForm((prev) => ({ ...prev, total_cost_previsionnel: (pp + wp).toString() }));
  }, [mvpForm.purchase_price_previsionnel, mvpForm.works_previsionnel]);

  useEffect(() => {
    const pr = parseFloat(mvpForm.purchase_price_realise) || 0;
    const wr = parseFloat(mvpForm.works_realise) || 0;
    if (pr || wr) setMvpForm((prev) => ({ ...prev, total_cost_realise: (pr + wr).toString() }));
  }, [mvpForm.purchase_price_realise, mvpForm.works_realise]);

  return (
    <div>
      {(isAdmin || isOwner) && (
        <div style={{ marginTop: '2rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {mvpMode === 'list' && a.operation_type && !isAdmin && (
              <button className="btn btn-sm btn-primary" onClick={handleMvpCreate}><Plus size={14} /> Nouveau rapport</button>
            )}
            {mvpMode !== 'list' && (
              <button className="btn btn-sm btn-ghost" onClick={() => setMvpMode('list')}><X size={14} /> Fermer</button>
            )}
          </div>

          {/* Operation Type Selection */}
          {!a.operation_type && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                Selectionnez le type d'operation pour ce projet :
              </p>
              <div className="operation-type-selector">
                {Object.entries(OPERATION_TYPES).map(([key, label]) => (
                  <div key={key} className="operation-type-option" onClick={() => handleSetOperationType(key)}>
                    <span className="type-emoji">{OPERATION_TYPE_ICONS[key]}</span>
                    <span className="type-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show current operation type */}
          {a.operation_type && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span className="badge badge-info">
                {OPERATION_TYPE_ICONS[a.operation_type]} {OPERATION_TYPES[a.operation_type]}
              </span>
              {(isAdmin || isOwner) && (
                <button className="btn btn-sm btn-ghost" style={{ fontSize: '.75rem' }}
                  onClick={() => setProject((prev) => {
                    const attrs = prev.attributes || prev;
                    return prev.attributes
                      ? { ...prev, attributes: { ...attrs, operation_type: null } }
                      : { ...prev, operation_type: null };
                  })}
                >Modifier le type</button>
              )}
            </div>
          )}

          {/* === LIST des rapports MVP === */}
          {a.operation_type && mvpMode === 'list' && (
            <>
              {loadingMvpReports ? (
                <LoadingSpinner />
              ) : mvpReports.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <p>Aucun rapport pour ce projet</p>
                    {!isAdmin && (
                      <button className="btn btn-primary btn-sm" onClick={handleMvpCreate} style={{ marginTop: '.75rem' }}>
                        <Plus size={14} /> Créer le premier rapport
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Statut operation</th><th>Validation</th><th>Resume</th><th>Auteur</th><th>Actions</th></tr></thead>
                    <tbody>
                      {mvpReports.map((r) => {
                        const ra = r.attributes || r;
                        const canEditReport = isAdmin || (isOwner && (ra.review_status === 'brouillon' || ra.review_status === 'rejete'));
                        const canDeleteReport = isAdmin || (isOwner && ra.review_status === 'brouillon');
                        const canSubmitReport = isOwner && ra.review_status === 'brouillon';
                        const canValidate = isAdmin && ra.review_status === 'soumis';
                        return (
                          <tr key={r.id}>
                            <td>{fmtDate(ra.created_at)}</td>
                            <td><span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>{getOperationStatusLabel(a.operation_type, ra.operation_status)}</span></td>
                            <td><span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>{REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}</span></td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ra.summary || '\u2014'}</td>
                            <td>{ra.author_name}</td>
                            <td>
                              <div className="actions-cell">
                                <button className="btn-icon" title="Voir" onClick={() => handleMvpView(r)}><Eye size={16} /></button>
                                {canEditReport && (
                                  <button className="btn-icon" title="Modifier" onClick={() => handleMvpEdit(r)}><Pencil size={16} /></button>
                                )}
                                {canSubmitReport && (
                                  <button className="btn-icon btn-success" title="Soumettre pour validation" onClick={() => handleMvpSubmitForReview(r.id)}><Send size={16} /></button>
                                )}
                                {canValidate && (
                                  <>
                                    <button className="btn-icon btn-success" title="Valider" onClick={() => handleMvpValidate(r.id)}><Check size={16} /></button>
                                    <button className="btn-icon btn-danger" title="Rejeter" onClick={() => { setRejectModalReport(r); setRejectComment(''); }}><XCircle size={16} /></button>
                                  </>
                                )}
                                {canDeleteReport && (
                                  <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleMvpDelete(r.id)}><Trash2 size={16} /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* === VIEW rapport MVP === */}
          {a.operation_type && mvpMode === 'view' && mvpViewReport && (() => {
            const ra = mvpViewReport.attributes || mvpViewReport;
            const viewIsWork = ra.operation_status === 'en_renovation';
            const viewIsSale = ['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(ra.operation_status);
            const canEditThis = isAdmin || (isOwner && (ra.review_status === 'brouillon' || ra.review_status === 'rejete'));
            return (
              <div className="card mvp-report-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <h3>Rapport du {fmtDate(ra.created_at)}</h3>
                    <span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>{REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    {canEditThis && (
                      <button className="btn btn-sm" onClick={() => handleMvpEdit(mvpViewReport)}><Pencil size={14} /> Modifier</button>
                    )}
                    {isOwner && ra.review_status === 'brouillon' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleMvpSubmitForReview(mvpViewReport.id)}><Send size={14} /> Soumettre</button>
                    )}
                    {isAdmin && ra.review_status === 'soumis' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleMvpValidate(mvpViewReport.id)}><Check size={14} /> Valider</button>
                        <button className="btn btn-sm btn-danger" onClick={() => { setRejectModalReport(mvpViewReport); setRejectComment(''); }}><XCircle size={14} /> Rejeter</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Show rejection comment if rejected */}
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

                {/* Show validation info if validated */}
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
                    <div className="detail-row"><span>Projet</span><span>{a.title}</span></div>
                    <div className="detail-row"><span>Localisation</span><span>{a.property_city || '\u2014'}</span></div>
                    <div className="detail-row"><span>Montant leve</span><span>{fmt(a.amount_raised_cents)}</span></div>
                    <div className="detail-row"><span>Taux</span><span>{a.gross_yield_percent ?? '\u2014'} %</span></div>
                    <div className="detail-row"><span>Date remboursement previsionnelle</span><span>{fmtDate(ra.expected_repayment_date)}</span></div>
                    <div className="detail-row"><span>Statut actuel</span><span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>{getOperationStatusLabel(a.operation_type, ra.operation_status)}</span></div>
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
            );
          })()}

          {/* === CREATE / EDIT rapport MVP === */}
          {a.operation_type && (mvpMode === 'create' || mvpMode === 'edit') && (
            <form onSubmit={handleMvpSubmit}>
              <div className="card mvp-report-card">
                <h3 style={{ marginBottom: '1.5rem' }}>{mvpMode === 'create' ? 'Nouveau rapport' : 'Modifier le rapport'}</h3>
                {a.operation_type !== 'marchand_de_biens' && (
                  <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.875rem' }}>
                    Rapport de suivi pour <strong>{OPERATION_TYPES[a.operation_type]}</strong>. Utilisez les champs prévisionnel / réalisé pour les montants clés de votre opération (acquisition, travaux, objectifs de sortie, etc.).
                  </p>
                )}

                <div className="mvp-section">
                  <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
                  <div className="detail-grid" style={{ marginBottom: '1rem' }}>
                    <div className="detail-row"><span>Projet</span><span>{a.title}</span></div>
                    <div className="detail-row"><span>Localisation</span><span>{a.property_city || '\u2014'}</span></div>
                    <div className="detail-row"><span>Montant leve</span><span>{fmt(a.amount_raised_cents)}</span></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Statut actuel</label>
                      <select value={mvpForm.operation_status} onChange={updateMvpField('operation_status')}>
                        {Object.keys(OPERATION_STATUSES).map((k) => <option key={k} value={k}>{getOperationStatusLabel(a.operation_type, k)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date previsionnelle remboursement</label>
                      <input type="date" value={mvpForm.expected_repayment_date} onChange={updateMvpField('expected_repayment_date')} />
                    </div>
                  </div>
                </div>

                <div className="mvp-section">
                  <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
                  <div className="form-group">
                    <textarea value={mvpForm.summary} onChange={updateMvpField('summary')} placeholder="Resume du projet (5 lignes max, 500 caracteres)" rows={5} maxLength={500} />
                    <span className="text-muted" style={{ fontSize: '.75rem' }}>{mvpForm.summary.length} / 500</span>
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
                            <td><input type="number" step="0.01" value={mvpForm[prevF]} onChange={updateMvpField(prevF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                            <td><input type="number" step="0.01" value={mvpForm[realF]} onChange={updateMvpField(realF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mvp-section">
                  <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
                  {mvpForm.operation_status === 'en_renovation' && (
                    <div className="form-row">
                      <div className="form-group"><label>% Travaux</label><input type="number" step="0.01" min="0" max="100" value={mvpForm.works_progress_percent} onChange={updateMvpField('works_progress_percent')} placeholder="0" /></div>
                      <div className="form-group"><label>Ecart budget (%)</label><input type="number" step="0.01" value={mvpForm.budget_variance_percent} onChange={updateMvpField('budget_variance_percent')} placeholder="0" /></div>
                    </div>
                  )}
                  {['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(mvpForm.operation_status) && (
                    <>
                      <div className="form-row">
                        <div className="form-group"><label>Date mise en vente</label><input type="date" value={mvpForm.sale_start_date} onChange={updateMvpField('sale_start_date')} /></div>
                        <div className="form-group"><label>Prix affiche (EUR)</label><input type="number" step="0.01" value={mvpForm.listed_price} onChange={updateMvpField('listed_price')} placeholder="0.00" /></div>
                      </div>
                      <div className="form-row">
                        <div className="form-group"><label>Nombre de visites</label><input type="number" min="0" value={mvpForm.visits_count} onChange={updateMvpField('visits_count')} placeholder="0" /></div>
                        <div className="form-group"><label>Nombre d'offres</label><input type="number" min="0" value={mvpForm.offers_count} onChange={updateMvpField('offers_count')} placeholder="0" /></div>
                      </div>
                    </>
                  )}
                  {mvpForm.operation_status !== 'en_renovation' && !['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(mvpForm.operation_status) && (
                    <p className="text-muted">Selectionnez "En renovation" ou "En commercialisation" pour les champs d'avancement.</p>
                  )}
                </div>

                <div className="mvp-section">
                  <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
                  <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Risque identifie</label><input type="text" value={mvpForm.risk_identified} onChange={updateMvpField('risk_identified')} placeholder="Ex: Retard livraison materiaux" /></div>
                  <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Impact</label><input type="text" value={mvpForm.risk_impact} onChange={updateMvpField('risk_impact')} placeholder="Ex: Decalage de 2 semaines" /></div>
                  <div className="form-group"><label>Action corrective</label><textarea value={mvpForm.corrective_action} onChange={updateMvpField('corrective_action')} rows={3} placeholder="Ex: Relance fournisseur + plan B commande" /></div>
                </div>

                <div className="mvp-section">
                  <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
                  <div className="form-row">
                    <div className="form-group"><label>Date estimee compromis</label><input type="date" value={mvpForm.estimated_compromise_date} onChange={updateMvpField('estimated_compromise_date')} /></div>
                    <div className="form-group"><label>Date estimee acte</label><input type="date" value={mvpForm.estimated_deed_date} onChange={updateMvpField('estimated_deed_date')} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Date remboursement estimee</label><input type="date" value={mvpForm.estimated_repayment_date} onChange={updateMvpField('estimated_repayment_date')} /></div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
                      <input type="checkbox" id="mvp_exit_confirmed" checked={mvpForm.exit_confirmed} onChange={updateMvpField('exit_confirmed')} style={{ width: 'auto' }} />
                      <label htmlFor="mvp_exit_confirmed" style={{ margin: 0, cursor: 'pointer' }}>Date confirmee</label>
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <button type="button" className="btn" onClick={() => setMvpMode('list')}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={mvpSubmitting}>
                    <Save size={16} /> {mvpSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal de rejet MVP */}
      {rejectModalReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}
          onClick={() => setRejectModalReport(null)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Rejeter le rapport MVP</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Veuillez indiquer la raison du rejet. Le porteur pourra corriger et resoumettre.
            </p>
            <div className="form-group">
              <label>Commentaire (obligatoire)</label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                placeholder="Expliquez pourquoi ce rapport est rejete..."
                required
              />
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button className="btn" onClick={() => setRejectModalReport(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleMvpReject} disabled={mvpSubmitting || !rejectComment.trim()}>
                <XCircle size={16} /> {mvpSubmitting ? 'Envoi...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
