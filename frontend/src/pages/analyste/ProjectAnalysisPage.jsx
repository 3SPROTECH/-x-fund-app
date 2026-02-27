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
import ReadOnlyAnalysisView from '../../components/analysis/ReadOnlyAnalysisView';
import '../../components/analysis/analysis.css';

const EDITABLE_STATUSES = ['pending_analysis', 'info_requested', 'info_resubmitted'];

export default function ProjectAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [infoRequests, setInfoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportAnalysis, setReportAnalysis] = useState(null);
  const [reportReady, setReportReady] = useState(false);

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

  // Fetch submitted analysis data from report when needed (read-only view or redo)
  useEffect(() => {
    if (!project) return;
    const a = project.attributes || project;
    const needsReport = a.has_analyst_report && (
      !EDITABLE_STATUSES.includes(a.status) || // read-only
      (EDITABLE_STATUSES.includes(a.status) && a.review_comment) // redo
    );
    if (!needsReport) {
      setReportReady(true);
      return;
    }

    analysteApi.getReport(id)
      .then((res) => {
        const report = res.data.report?.attributes || res.data.report?.data?.attributes;
        if (report?.report_data?.analysis) {
          setReportAnalysis(report.report_data.analysis);
        }
      })
      .catch(() => {})
      .finally(() => setReportReady(true));
  }, [project, id]);

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const a = project.attributes || project;
  const isReadOnly = !EDITABLE_STATUSES.includes(a.status);
  const isRedoMode = EDITABLE_STATUSES.includes(a.status) && !!a.review_comment && a.has_analyst_report;

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
        <ProjectDataViewer project={project} infoRequests={infoRequests} onRefresh={loadProject} />
        {isReadOnly ? (
          <ReadOnlyAnalysisView formData={reportAnalysis} loading={!reportReady} />
        ) : (isRedoMode && !reportReady) ? (
          <div className="an-stepper">
            <div className="an-stepper-loading">Chargement de l&apos;analyse precedente...</div>
          </div>
        ) : (
          <AnalysisStepper
            project={project}
            redoComment={isRedoMode ? a.review_comment : null}
            previousAnalysisData={isRedoMode ? reportAnalysis : null}
          />
        )}
      </div>
    </div>
  );
}
