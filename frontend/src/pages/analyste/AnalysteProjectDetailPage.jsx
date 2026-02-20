import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysteApi } from '../../api/analyste';
import {
  ArrowLeft, CheckCircle, AlertCircle, XCircle, FileText, DollarSign, Shield,
  Building, User, Calendar, TrendingUp, Scale, AlertTriangle, MessageSquare, Upload,
  FileBarChart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents, PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGES, ANALYST_OPINION_LABELS, ANALYST_OPINION_BADGES } from '../../utils';
import { LoadingSpinner } from '../../components/ui';
import InfoRequestForm from '../../components/InfoRequestForm';
import ReportViewerModal from '../../components/ReportViewerModal';

export default function AnalysteProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Analysis form state
  const [legalCheck, setLegalCheck] = useState(false);
  const [financialCheck, setFinancialCheck] = useState(false);
  const [riskCheck, setRiskCheck] = useState(false);
  const [comment, setComment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [infoRequests, setInfoRequests] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await analysteApi.getProject(id);
      const p = res.data.data;
      const a = p.attributes || p;
      setProject(p);
      setLegalCheck(a.analyst_legal_check || false);
      setFinancialCheck(a.analyst_financial_check || false);
      setRiskCheck(a.analyst_risk_check || false);
      setComment(a.analyst_comment || '');
      setInfoRequests(res.data.info_requests || []);
    } catch {
      toast.error('Erreur lors du chargement du projet');
      navigate('/analyste/projects');
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const handleSubmitOpinion = async () => {
    if (!comment.trim()) {
      toast.error('Le commentaire est obligatoire');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        comment,
        legal_check: legalCheck,
        financial_check: financialCheck,
        risk_check: riskCheck,
      };
      if (modalAction === 'opinion_rejected') {
        await analysteApi.rejectProject(id, data);
      }
      const labels = {
        opinion_rejected: 'Projet refuse',
      };
      toast.success(labels[modalAction] || 'Avis soumis');
      setShowModal(false);
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!comment.trim()) {
      toast.error('Le commentaire est obligatoire pour generer le rapport');
      return;
    }
    setGeneratingReport(true);
    try {
      const data = {
        comment,
        legal_check: legalCheck,
        financial_check: financialCheck,
        risk_check: riskCheck,
      };
      const res = await analysteApi.generateReport(id, data);
      const report = res.data.report;
      setReportData(report);
      setShowReport(true);
      toast.success('Rapport genere et projet pre-approuve');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la generation du rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleViewReport = async () => {
    try {
      const res = await analysteApi.getReport(id);
      setReportData(res.data.report);
      setShowReport(true);
    } catch {
      toast.error('Erreur lors du chargement du rapport');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const a = project.attributes || project;
  const alreadyReviewed = a.analyst_opinion && a.analyst_opinion !== 'opinion_pending' && a.status !== 'info_resubmitted';

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/analyste/projects')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{a.title}</h1>
            <p className="text-muted">Analyse du projet</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || ''}`}>
            {PROJECT_STATUS_LABELS[a.status] || a.status}
          </span>
          <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
            {ANALYST_OPINION_LABELS[a.analyst_opinion] || 'En attente'}
          </span>
        </div>
      </div>

      <div className="two-col">
        {/* Left: Project Info */}
        <div className="two-col-main">
          {/* Project Overview */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <Building size={18} /> Informations du projet
            </h3>
            <div className="detail-grid">
              <div className="detail-row"><span>Titre</span><span>{a.title}</span></div>
              <div className="detail-row"><span>Porteur</span><span>{a.owner_name || '—'}</span></div>
              <div className="detail-row"><span>Ville</span><span>{a.property_city || '—'}</span></div>
              <div className="detail-row"><span>Type d'operation</span><span>{a.operation_type || '—'}</span></div>
              {a.description && (
                <div className="detail-row" style={{ flexDirection: 'column' }}>
                  <span>Description</span>
                  <span style={{ marginTop: '.25rem', whiteSpace: 'pre-wrap' }}>{a.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <DollarSign size={18} /> Informations financieres
            </h3>
            <div className="detail-grid">
              <div className="detail-row"><span>Montant total</span><span>{formatCents(a.total_amount_cents)}</span></div>
              <div className="detail-row"><span>Prix par part</span><span>{formatCents(a.share_price_cents)}</span></div>
              <div className="detail-row"><span>Nombre de parts</span><span>{a.total_shares}</span></div>
              <div className="detail-row"><span>Investissement min.</span><span>{formatCents(a.min_investment_cents)}</span></div>
              {a.gross_yield_percent && <div className="detail-row"><span>Rendement brut</span><span>{a.gross_yield_percent}%</span></div>}
              {a.net_yield_percent && <div className="detail-row"><span>Rendement net</span><span>{a.net_yield_percent}%</span></div>}
              {a.equity_cents && <div className="detail-row"><span>Fonds propres</span><span>{formatCents(a.equity_cents)}</span></div>}
              {a.bank_loan_cents && <div className="detail-row"><span>Pret bancaire</span><span>{formatCents(a.bank_loan_cents)}</span></div>}
              {a.notary_fees_cents && <div className="detail-row"><span>Frais de notaire</span><span>{formatCents(a.notary_fees_cents)}</span></div>}
              {a.works_budget_cents && <div className="detail-row"><span>Budget travaux</span><span>{formatCents(a.works_budget_cents)}</span></div>}
            </div>
          </div>

          {/* Dates */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <Calendar size={18} /> Calendrier
            </h3>
            <div className="detail-grid">
              <div className="detail-row"><span>Debut collecte</span><span>{a.funding_start_date || '—'}</span></div>
              <div className="detail-row"><span>Fin collecte</span><span>{a.funding_end_date || '—'}</span></div>
              {a.planned_acquisition_date && <div className="detail-row"><span>Acquisition prevue</span><span>{a.planned_acquisition_date}</span></div>}
              {a.planned_delivery_date && <div className="detail-row"><span>Livraison prevue</span><span>{a.planned_delivery_date}</span></div>}
              {a.planned_repayment_date && <div className="detail-row"><span>Remboursement prevu</span><span>{a.planned_repayment_date}</span></div>}
            </div>
          </div>

          {/* Guarantees */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <Shield size={18} /> Garanties
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {a.has_first_rank_mortgage && <span className="badge badge-success">Hypotheque 1er rang</span>}
              {a.has_share_pledge && <span className="badge badge-success">Nantissement de parts</span>}
              {a.has_fiducie && <span className="badge badge-success">Fiducie</span>}
              {a.has_interest_escrow && <span className="badge badge-success">Sequestre interets</span>}
              {a.has_works_escrow && <span className="badge badge-success">Sequestre travaux</span>}
              {a.has_personal_guarantee && <span className="badge badge-success">Caution personnelle</span>}
              {a.has_gfa && <span className="badge badge-success">GFA</span>}
              {a.has_open_banking && <span className="badge badge-success">Open Banking</span>}
              {!a.has_first_rank_mortgage && !a.has_share_pledge && !a.has_fiducie &&
                !a.has_interest_escrow && !a.has_works_escrow && !a.has_personal_guarantee &&
                !a.has_gfa && !a.has_open_banking && (
                  <span className="text-muted">Aucune garantie renseignee</span>
                )}
            </div>
            {a.risk_description && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Description des risques :</strong>
                <p style={{ marginTop: '.25rem', whiteSpace: 'pre-wrap' }}>{a.risk_description}</p>
              </div>
            )}
          </div>

          {/* Info Request History */}
          {infoRequests.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                <MessageSquare size={18} /> Historique des demandes de complements
              </h3>
              {infoRequests.map((ir) => {
                const irAttr = ir.attributes || ir;
                const fields = irAttr.fields || [];
                const responses = irAttr.responses || {};
                const hasResponses = Object.keys(responses).length > 0;
                return (
                  <div key={ir.id} style={{ padding: '1rem', borderRadius: '8px', background: '#f8f9fa', marginBottom: '.75rem', border: '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span className={`badge ${irAttr.status === 'submitted' ? 'badge-success' : irAttr.status === 'reviewed' ? 'badge-info' : 'badge-warning'}`}>
                          {irAttr.status === 'pending' ? 'En attente' : irAttr.status === 'submitted' ? 'Soumis' : 'Examine'}
                        </span>
                        {irAttr.requested_by_name && <span className="text-muted" style={{ fontSize: '.85rem' }}>par {irAttr.requested_by_name}</span>}
                      </div>
                      <span className="text-muted" style={{ fontSize: '.85rem' }}>
                        {new Date(irAttr.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Fields + Responses */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {fields.map((field, idx) => {
                        const response = responses[String(idx)];
                        return (
                          <div key={idx} style={{ padding: '.5rem .75rem', background: '#fff', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
                                {field.label}
                                {field.required && <span style={{ color: '#dc3545' }}> *</span>}
                              </span>
                              <span className="text-muted" style={{ fontSize: '.75rem' }}>
                                {field.field_type === 'text' ? 'Texte' : field.field_type === 'textarea' ? 'Texte long' : field.field_type === 'number' ? 'Nombre' : 'Fichier'}
                              </span>
                            </div>
                            {field.comment && (
                              <p style={{ fontSize: '.8rem', color: '#6c757d', margin: '.25rem 0 0' }}>{field.comment}</p>
                            )}
                            {hasResponses && (
                              <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid #e9ecef' }}>
                                {response ? (
                                  field.field_type === 'file' ? (
                                    <a
                                      href={response}
                                      download
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.85rem', color: '#0d6efd', textDecoration: 'none' }}
                                    >
                                      <Upload size={14} /> {response}
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap' }}>{response}</span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '.85rem', color: '#adb5bd', fontStyle: 'italic' }}>Non renseigne</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {hasResponses && irAttr.submitted_at && (
                      <div style={{ marginTop: '.5rem', fontSize: '.8rem', color: '#6c757d', textAlign: 'right' }}>
                        Reponses soumises le {new Date(irAttr.submitted_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Analysis Form */}
        <div className="two-col-side">
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.5rem' }}>
              <Scale size={18} /> Formulaire d'analyse
            </h3>

            {alreadyReviewed && (
              <div className={`analyste-review-banner analyste-review-${a.analyst_opinion}`}>
                <strong>Avis deja soumis :</strong> {ANALYST_OPINION_LABELS[a.analyst_opinion]}
                {a.analyst_reviewed_at && (
                  <span> le {new Date(a.analyst_reviewed_at).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            )}

            {/* Legal Check */}
            <div className="analyste-check-section">
              <label className="analyste-check-label">
                <input
                  type="checkbox"
                  checked={legalCheck}
                  onChange={(e) => setLegalCheck(e.target.checked)}
                  disabled={alreadyReviewed}
                />
                <FileText size={16} />
                <span>Verification juridique du dossier</span>
              </label>
              <p className="analyste-check-desc">
                Verifier la conformite des documents juridiques : statuts, PV, contrats, permis, etc.
              </p>
            </div>

            {/* Financial Check */}
            <div className="analyste-check-section">
              <label className="analyste-check-label">
                <input
                  type="checkbox"
                  checked={financialCheck}
                  onChange={(e) => setFinancialCheck(e.target.checked)}
                  disabled={alreadyReviewed}
                />
                <TrendingUp size={16} />
                <span>Analyse financiere du projet et du porteur</span>
              </label>
              <p className="analyste-check-desc">
                Evaluer la viabilite financiere : rendements, couts, marges, solvabilite du porteur.
              </p>
            </div>

            {/* Risk Check */}
            <div className="analyste-check-section">
              <label className="analyste-check-label">
                <input
                  type="checkbox"
                  checked={riskCheck}
                  onChange={(e) => setRiskCheck(e.target.checked)}
                  disabled={alreadyReviewed}
                />
                <AlertTriangle size={16} />
                <span>Analyse des risques lies au projet immobilier</span>
              </label>
              <p className="analyste-check-desc">
                Identifier et evaluer les risques : marche, construction, reglementaire, sortie.
              </p>
            </div>

            {/* Comment */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Commentaire detaille</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Redigez votre analyse detaillee ici..."
                rows={6}
                disabled={alreadyReviewed}
              />
            </div>

            {/* Actions */}
            {!alreadyReviewed && (
              <div className="analyste-actions">
                <button
                  className="btn btn-success"
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                >
                  <FileBarChart size={16} /> {generatingReport ? 'Generation...' : 'Generer le rapport d\'analyse'}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => setShowInfoForm(true)}
                >
                  <AlertCircle size={16} /> Demander des complements
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => openSubmitModal('opinion_rejected')}
                >
                  <XCircle size={16} /> Refuser le projet
                </button>
              </div>
            )}

            {/* View existing report */}
            {a.has_analyst_report && (
              <div style={{ marginTop: alreadyReviewed ? 0 : '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleViewReport} style={{ width: '100%' }}>
                  <FileBarChart size={16} /> Voir le rapport d'analyse
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal (for reject only now) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalAction === 'opinion_rejected' && 'Confirmer le refus'}
            </h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              {modalAction === 'opinion_rejected' && 'Vous etes sur le point de refuser ce projet. Votre avis sera transmis a l\'administrateur.'}
            </p>

            <div className="detail-grid" style={{ marginBottom: '1rem' }}>
              <div className="detail-row"><span>Juridique</span><span>{legalCheck ? 'Conforme' : 'Non conforme'}</span></div>
              <div className="detail-row"><span>Financier</span><span>{financialCheck ? 'Conforme' : 'Non conforme'}</span></div>
              <div className="detail-row"><span>Risques</span><span>{riskCheck ? 'Conforme' : 'Non conforme'}</span></div>
            </div>

            <div className="form-group">
              <label>Commentaire (obligatoire)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Votre commentaire..."
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowModal(false)} disabled={submitting}>
                Annuler
              </button>
              <button
                className={`btn ${modalAction === 'opinion_approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleSubmitOpinion}
                disabled={submitting}
              >
                {submitting ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Request Form Modal */}
      {showInfoForm && (
        <InfoRequestForm
          projectId={id}
          onClose={() => setShowInfoForm(false)}
          onSubmitted={() => {
            setShowInfoForm(false);
            loadProject();
          }}
        />
      )}

      {/* Report Viewer Modal */}
      {showReport && reportData && (
        <ReportViewerModal
          report={reportData}
          projectAttrs={a}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
