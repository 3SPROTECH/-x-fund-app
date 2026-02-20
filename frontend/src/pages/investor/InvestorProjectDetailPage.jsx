import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import { useAuth } from '../../context/AuthContext';
import useWalletStore from '../../stores/useWalletStore';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_DETAIL_STATUS_LABELS as STATUS_LABELS, PROJECT_DETAIL_STATUS_BADGES as STATUS_BADGE } from '../../utils';
import { LoadingSpinner } from '../../components/ui';
import ProjectDetailsTab from '../../components/project-tabs/ProjectDetailsTab';
import ProjectPhotosTab from '../../components/project-tabs/ProjectPhotosTab';
import ProjectDividendsTab from '../../components/project-tabs/ProjectDividendsTab';
import ProjectReportsTab from '../../components/project-tabs/ProjectReportsTab';
import ProjectInvestorsTab from '../../components/project-tabs/ProjectInvestorsTab';

export default function InvestorProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
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

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;
  const isOwner = user?.id === a.owner_id;
  const canViewInvestors = false;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/investor/projects')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Retour aux projets
      </button>

      <div className="page-header">
        <div>
          <h1>{a.title}</h1>
          {a.property_city && <p className="text-muted">{a.property_title} — {a.property_city}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Détails</button>
        <button className={`tab${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
        <button className={`tab${tab === 'dividends' ? ' active' : ''}`} onClick={() => setTab('dividends')}>Dividendes ({dividends.length})</button>
        <button className={`tab${tab === 'statements' ? ' active' : ''}`} onClick={() => setTab('statements')}>Rapports ({statements.length})</button>
        <button className={`tab${tab === 'investors' ? ' active' : ''}`} onClick={() => setTab('investors')}>Associés ({investorsMeta?.total_investors || 0})</button>
      </div>

      {tab === 'details' && <ProjectDetailsTab project={project} projectId={id} wallet={wallet} user={user} onRefresh={loadAll} basePath="/investor" />}
      {tab === 'photos' && <ProjectPhotosTab project={project} projectId={id} isAdmin={false} onRefresh={loadAll} basePath="/investor" />}
      {tab === 'dividends' && <ProjectDividendsTab project={project} projectId={id} dividends={dividends} isAdmin={false} onRefresh={loadAll} basePath="/investor" />}
      {tab === 'statements' && <ProjectReportsTab project={project} projectId={id} isAdmin={false} isOwner={isOwner} user={user} setProject={setProject} onRefresh={loadAll} basePath="/investor" />}
      {tab === 'investors' && <ProjectInvestorsTab investors={investors} investorsMeta={investorsMeta} canViewInvestors={canViewInvestors} basePath="/investor" />}
    </div>
  );
}
