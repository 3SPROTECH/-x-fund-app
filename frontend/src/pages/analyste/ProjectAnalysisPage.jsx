import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { analysteApi } from '../../api/analyste';
import { LoadingSpinner } from '../../components/ui';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGES,
  ANALYST_OPINION_LABELS,
  ANALYST_OPINION_BADGES,
} from '../../utils';
import ProjectDataViewer from '../../components/analysis/ProjectDataViewer';
import AnalysisStepper from '../../components/analysis/AnalysisStepper';
import '../../components/analysis/analysis.css';

export default function ProjectAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [infoRequests, setInfoRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await analysteApi.getProject(id);
      const p = res.data.data;
      setProject(p);
      setInfoRequests(res.data.info_requests || []);
    } catch {
      toast.error('Erreur lors du chargement du projet');
      navigate('/analyste/projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const a = project.attributes || project;

  return (
    <div className="an-page">
      {/* Header */}
      <div className="an-header">
        <button
          className="an-header-back"
          onClick={() => navigate('/analyste/projects')}
        >
          <ChevronLeft size={16} /> Projets
        </button>
        <span className="an-header-title">{a.title}</span>
        <div className="an-header-badges">
          <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || ''}`}>
            {PROJECT_STATUS_LABELS[a.status] || a.status}
          </span>
          <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
            {ANALYST_OPINION_LABELS[a.analyst_opinion] || 'En attente'}
          </span>
        </div>
      </div>

      {/* Split layout */}
      <div className="an-split">
        <ProjectDataViewer project={project} infoRequests={infoRequests} />
        <AnalysisStepper project={project} />
      </div>
    </div>
  );
}
