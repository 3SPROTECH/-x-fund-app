import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysteApi } from '../../api/analyste';
import {
  BarChart3, Briefcase, CheckCircle, AlertCircle, XCircle, Clock, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGES, ANALYST_OPINION_LABELS, ANALYST_OPINION_BADGES } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function AnalysteDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analysteApi.getProjects({ per_page: 10 });
      setProjects(res.data.data || []);
      setStats(res.data.meta?.stats || {});
    } catch {
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const kpis = [
    { label: 'Projets assignes', value: stats.total || 0, icon: Briefcase, iconClass: 'stat-icon-primary' },
    { label: 'En attente', value: stats.pending || 0, icon: Clock, iconClass: 'stat-icon-warning' },
    { label: 'Valides', value: stats.approved || 0, icon: CheckCircle, iconClass: 'stat-icon-success' },
    { label: 'Infos demandees', value: stats.info_requested || 0, icon: AlertCircle, iconClass: 'stat-icon-info' },
    { label: 'Refuses', value: stats.rejected || 0, icon: XCircle, iconClass: 'stat-icon-danger' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tableau de bord Analyste</h1>
          <p className="text-muted">Vue d'ensemble de vos projets a analyser</p>
        </div>
      </div>

      <div className="stats-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className={`stat-icon ${kpi.iconClass}`}>
              <kpi.icon size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{kpi.value}</span>
              <span className="stat-label">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Projets recents</h3>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/analyste/projects')}>
            Voir tout
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
            Aucun projet assigne pour le moment.
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Porteur</th>
                  <th>Statut projet</th>
                  <th>Avis</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const a = p.attributes || p;
                  return (
                    <tr key={p.id}>
                      <td data-label="Titre">{a.title}</td>
                      <td data-label="Porteur">{a.owner_name || '—'}</td>
                      <td data-label="Statut">
                        <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || ''}`}>
                          {PROJECT_STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td data-label="Avis">
                        <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
                          {ANALYST_OPINION_LABELS[a.analyst_opinion] || 'En attente'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button className="btn-icon" title="Analyser" onClick={() => navigate(`/analyste/projects/${p.id}`)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
