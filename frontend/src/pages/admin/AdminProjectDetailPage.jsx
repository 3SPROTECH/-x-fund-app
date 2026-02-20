import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import useWalletStore from '../../stores/useWalletStore';
import { ArrowLeft, Edit, Trash2, Scale, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_DETAIL_STATUS_LABELS as STATUS_LABELS, PROJECT_DETAIL_STATUS_BADGES as STATUS_BADGE, ANALYST_OPINION_LABELS, ANALYST_OPINION_BADGES } from '../../utils';
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
          <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
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
        </div>
      )}

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
    </div>
  );
}
