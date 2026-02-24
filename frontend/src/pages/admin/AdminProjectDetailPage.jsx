import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import useWalletStore from '../../stores/useWalletStore';
import { adminApi } from '../../api/admin';
import { ArrowLeft, Edit, Trash2, Scale, CheckCircle, XCircle, AlertCircle, FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_DETAIL_STATUS_LABELS as STATUS_LABELS, PROJECT_DETAIL_STATUS_BADGES as STATUS_BADGE, PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGES, ANALYST_OPINION_LABELS, ANALYST_OPINION_BADGES } from '../../utils';
import ReportViewerModal from '../../components/ReportViewerModal';
import ContractViewerModal from '../../components/ContractViewerModal';
import { LoadingSpinner } from '../../components/ui';
import ProjectDetailsTab from '../../components/project-tabs/ProjectDetailsTab';
import ProjectPhotosTab from '../../components/project-tabs/ProjectPhotosTab';
import ProjectDividendsTab from '../../components/project-tabs/ProjectDividendsTab';
import ProjectReportsTab from '../../components/project-tabs/ProjectReportsTab';
import ProjectInvestorsTab from '../../components/project-tabs/ProjectInvestorsTab';

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, fetchWallet } = useWalletStore();
  const [project, setProject] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [statements, setStatements] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [investorsMeta, setInvestorsMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showContract, setShowContract] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, divRes, stmtRes, investorsRes] = await Promise.allSettled([
        investmentProjectsApi.get(id),
        dividendsApi.list(id),
        financialStatementsApi.list(id),
        projectInvestorsApi.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data || projRes.value.data);
      if (divRes.status === 'fulfilled') setDividends(divRes.value.data.data || []);
      if (stmtRes.status === 'fulfilled') setStatements(stmtRes.value.data.data || []);
      if (investorsRes.status === 'fulfilled') {
        setInvestors(investorsRes.value.data.data || []);
        setInvestorsMeta(investorsRes.value.data.meta || null);
      }
      fetchWallet();
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.')) return;

    try {
      await investmentProjectsApi.delete(id);
      toast.success('Projet supprimé avec succès');
      navigate('/admin/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleViewReport = async () => {
    try {
      const res = await adminApi.getProjectReport(id);
      setReportData(res.data.report);
      setShowReport(true);
    } catch {
      toast.error('Erreur lors du chargement du rapport');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Voulez-vous approuver ce projet ?')) return;
    try {
      await adminApi.approveProject(id);
      toast.success('Projet approuve avec succes');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    const comment = window.prompt('Raison du rejet :');
    if (comment === null) return;
    if (!comment.trim()) { toast.error('Veuillez fournir une raison'); return; }
    try {
      await adminApi.rejectProject(id, comment);
      toast.success('Projet rejete');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors du rejet');
    }
  };

  const handleSendContract = async (pdfBase64) => {
    try {
      await adminApi.sendContract(id, pdfBase64);
      toast.success('Contrat envoye au porteur via YouSign');
      setShowContract(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi du contrat via YouSign");
    }
  };

  const handleCheckSignatureStatus = async () => {
    try {
      const res = await adminApi.checkSignatureStatus(id);
      const status = res.data.yousign_status;
      if (status === 'done') {
        toast.success('Le contrat a ete signe ! Statut mis a jour.');
      } else {
        toast('Statut de la signature : ' + (status || 'en attente'), { icon: 'ℹ️' });
      }
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la verification');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;
  const isAdmin = true;
  const canEdit = true;
  const canDelete = true;
  const canViewInvestors = true;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/admin/projects')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Retour aux projets
      </button>

      <div className="page-header">
        <div>
          <h1>{a.title}</h1>
          {a.property_city && <p className="text-muted">{a.property_title} — {a.property_city}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || STATUS_BADGE[a.status] || ''}`}>{PROJECT_STATUS_LABELS[a.status] || STATUS_LABELS[a.status] || a.status}</span>
          {canEdit && (
            <button
              className="btn btn-sm"
              onClick={() => navigate(`/admin/projects/${id}/edit`)}
              title="Modifier le projet"
            >
              <Edit size={16} /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={handleDeleteProject}
              title="Supprimer le projet"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Analyst Review Banner */}
      {a.analyst_id && (
        <div className={`card analyste-review-section ${a.analyst_opinion !== 'opinion_pending' ? 'has-opinion' : ''}`} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <Scale size={18} /> Avis de l'analyste
          </h3>
          <div className="detail-grid">
            <div className="detail-row">
              <span>Analyste assigne</span>
              <span style={{ fontWeight: 600 }}>{a.analyst_name}</span>
            </div>
            <div className="detail-row">
              <span>Avis</span>
              <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
                {ANALYST_OPINION_LABELS[a.analyst_opinion] || 'En attente'}
              </span>
            </div>
            {a.analyst_reviewed_at && (
              <div className="detail-row">
                <span>Date de l'avis</span>
                <span>{new Date(a.analyst_reviewed_at).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Juridique</span>
              <span>{a.analyst_legal_check ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <XCircle size={16} style={{ color: 'var(--danger)' }} />}</span>
            </div>
            <div className="detail-row">
              <span>Financier</span>
              <span>{a.analyst_financial_check ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <XCircle size={16} style={{ color: 'var(--danger)' }} />}</span>
            </div>
            <div className="detail-row">
              <span>Risques</span>
              <span>{a.analyst_risk_check ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <XCircle size={16} style={{ color: 'var(--danger)' }} />}</span>
            </div>
            {a.analyst_comment && (
              <div className="detail-row" style={{ flexDirection: 'column' }}>
                <span>Commentaire</span>
                <p style={{ marginTop: '.25rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.03)', padding: '.75rem', borderRadius: '8px' }}>
                  {a.analyst_comment}
                </p>
              </div>
            )}
          </div>
          {a.has_analyst_report && (
            <button className="btn btn-sm" onClick={handleViewReport} style={{ marginTop: '1rem' }}>
              <FileText size={16} /> Voir le rapport d'analyse
            </button>
          )}
        </div>
      )}

      {/* Admin Decision Banner for pre-approved projects */}
      {a.status === 'analyst_approved' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '2px solid var(--gold-color, #DAA520)' }}>
          <div>
            <h3 style={{ margin: 0 }}>Decision requise</h3>
            <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
              Ce projet a ete pre-approuve par l'analyste. Veuillez examiner le rapport et prendre une decision.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
            {a.has_analyst_report && (
              <button className="btn" onClick={handleViewReport}>
                <FileText size={16} /> Rapport
              </button>
            )}
            <button className="btn btn-success" onClick={handleApprove}>
              <CheckCircle size={16} /> Approuver
            </button>
            <button className="btn btn-danger" onClick={handleReject}>
              <XCircle size={16} /> Rejeter
            </button>
          </div>
        </div>
      )}

      {/* Contract Banner for approved projects */}
      {a.status === 'approved' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '2px solid var(--gold-color, #DAA520)' }}>
          <div>
            <h3 style={{ margin: 0 }}>Contrat d'investissement</h3>
            <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
              Le projet est approuve. Generez et envoyez le contrat au porteur pour signature.
            </p>
          </div>
          <button className="btn btn-success" onClick={() => setShowContract(true)}>
            <FileText size={16} /> Generer le contrat
          </button>
        </div>
      )}

      {/* Signing status banner */}
      {a.status === 'signing' && (() => {
        const ownerSigned = ['owner_signed', 'done'].includes(a.yousign_status);
        const adminSigned = ['admin_signed', 'done'].includes(a.yousign_status);
        const allDone = a.yousign_status === 'done';
        const adminSignLink = a.yousign_admin_signature_link;

        return (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', border: `2px solid ${allDone ? 'var(--success-color, #10b981)' : 'var(--info-color, #3498db)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{allDone ? 'Contrat signe par les deux parties' : 'En attente de signatures (YouSign)'}</h3>
                <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                  {allDone
                    ? 'Le contrat a ete signe par le porteur et la plateforme.'
                    : 'Le contrat requiert la signature du porteur et de la plateforme.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <button className="btn btn-sm" onClick={() => setShowContract(true)}>
                  <FileText size={16} /> Voir le contrat
                </button>
                <button className="btn btn-sm" onClick={handleCheckSignatureStatus}>
                  <CheckCircle size={16} /> Verifier le statut
                </button>
              </div>
            </div>

            {/* Two-party signing progress */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Owner signing status */}
              <div style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
                background: ownerSigned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                border: `1px solid ${ownerSigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                display: 'flex', alignItems: 'center', gap: '0.75rem'
              }}>
                {ownerSigned
                  ? <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                  : <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Porteur de projet</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    {ownerSigned ? 'Signe ✓' : 'En attente de signature'}
                  </div>
                </div>
              </div>

              {/* Admin signing status */}
              <div style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
                background: adminSigned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.06)',
                border: `1px solid ${adminSigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {adminSigned
                    ? <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    : <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plateforme (Admin)</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {adminSigned ? 'Signe ✓' : 'En attente de votre signature'}
                    </div>
                  </div>
                </div>
                {!adminSigned && adminSignLink && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => window.open(adminSignLink, '_blank', 'noopener,noreferrer')}
                    style={{ flexShrink: 0 }}
                  >
                    <Send size={14} /> Signer le contrat
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="tabs">
        <button className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`tab${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
        <button className={`tab${tab === 'dividends' ? ' active' : ''}`} onClick={() => setTab('dividends')}>Dividendes ({dividends.length})</button>
        <button className={`tab${tab === 'statements' ? ' active' : ''}`} onClick={() => setTab('statements')}>Rapports ({statements.length})</button>
        <button className={`tab${tab === 'investors' ? ' active' : ''}`} onClick={() => setTab('investors')}>Associes ({investorsMeta?.total_investors || 0})</button>
      </div>

      {tab === 'details' && <ProjectDetailsTab project={project} projectId={id} wallet={wallet} isAdmin={true} basePath="/admin" onRefresh={loadAll} />}
      {tab === 'photos' && <ProjectPhotosTab project={project} projectId={id} isAdmin={true} onRefresh={loadAll} />}
      {tab === 'dividends' && <ProjectDividendsTab project={project} projectId={id} dividends={dividends} isAdmin={true} basePath="/admin" onRefresh={loadAll} />}
      {tab === 'statements' && <ProjectReportsTab project={project} projectId={id} isAdmin={true} isOwner={false} setProject={setProject} onRefresh={loadAll} />}
      {tab === 'investors' && <ProjectInvestorsTab investors={investors} investorsMeta={investorsMeta} canViewInvestors={true} />}

      {showReport && reportData && (
        <ReportViewerModal
          report={reportData}
          projectAttrs={a}
          onClose={() => setShowReport(false)}
        />
      )}

      {showContract && (
        <ContractViewerModal
          projectAttrs={a}
          onClose={() => setShowContract(false)}
          onSendToOwner={handleSendContract}
          showSendButton={a.status === 'approved'}
        />
      )}
    </div>
  );
}
