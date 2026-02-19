import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, investmentProjectsApi } from '../../api/investments';
import toast from 'react-hot-toast';
import { formatCents as fmt } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investorDashboard, setInvestorDashboard] = useState(null);
  const [featuredProjects, setFeaturedProjects] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, projectsRes] = await Promise.allSettled([
        dashboardApi.get(),
        investmentProjectsApi.list({ status: 'funding_active', per_page: 6 }),
      ]);
      if (dashRes.status === 'fulfilled') {
        setInvestorDashboard(dashRes.value.data.data || dashRes.value.data);
      }
      if (projectsRes.status === 'fulfilled') {
        setFeaturedProjects(projectsRes.value.data.data || []);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalInvested = investorDashboard?.total_invested_cents ?? 0;
  const totalDividends = investorDashboard?.total_dividends_received_cents ?? 0;
  const avgYield = totalInvested > 0 ? ((totalDividends / totalInvested) * 100).toFixed(2) : '0.00';

  const profileCompletionScore = () => {
    let score = 0;
    if (user?.kyc_status === 'verified') score += 1;
    if (totalInvested > 0) score += 1;
    return score;
  };

  const completionSteps = profileCompletionScore();
  const needsCompletion = completionSteps < 2;

  return (
    <div className="simple-investor-dashboard">
      <h1 className="simple-greeting">Bonjour {user?.first_name} !</h1>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {needsCompletion && (
            <div className="profile-alert">
              <div className="alert-content">
                <h3>Votre profil n'est pas complet</h3>
                <p>Complétez toutes les étapes pour commencer à investir.</p>
                <div className="alert-progress">
                  <div className="progress-bar-simple">
                    <div className="progress-fill-simple" style={{ width: `${(completionSteps / 2) * 100}%` }} />
                  </div>
                  <span>{completionSteps} étape sur 2</span>
                </div>
              </div>
              <button className="btn-alert" onClick={() => navigate(user?.kyc_status !== 'verified' ? '/investor/kyc' : '/investor/projects')}>
                Compléter mon profil →
              </button>
            </div>
          )}

          <div className="stats-row">
            <div className="stat-simple">
              <h4>Investissements en cours</h4>
              <div className="stat-value-large">{fmt(totalInvested)}</div>
            </div>
            <div className="stat-simple">
              <h4>Gain total brut</h4>
              <div className="stat-value-large">{fmt(totalDividends)}</div>
            </div>
            <div className="stat-simple">
              <h4>Rendement moyen</h4>
              <div className="stat-value-large">{avgYield} %</div>
            </div>
          </div>

          <div className="chart-section">
            <div className="chart-placeholder">
              <div className="chart-curve">
                <svg viewBox="0 0 400 150" preserveAspectRatio="none">
                  <path d="M 0,100 Q 100,80 200,90 T 400,70" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                </svg>
              </div>
              <p className="chart-message">Vos données seront disponibles après votre premier investissement.</p>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/investor/projects')}>
              Voir nos projets
            </button>
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="sidebar-card">
            <h4>Les projets à la une</h4>
            {featuredProjects.length === 0 ? (
              <p className="no-projects">Aucun projet disponible</p>
            ) : (
              <div className="projects-list">
                {featuredProjects.slice(0, 4).map((project) => {
                  const p = project.attributes || project;
                  return (
                    <div key={project.id} className="project-item-simple" onClick={() => navigate(`/investor/projects/${project.id}`)}>
                      <div className="project-info-simple">
                        <h4>{p.title}</h4>
                        <span className="project-location-simple">📍 {p.property_city || 'France'}</span>
                      </div>
                      <span className={`project-status-badge ${p.status === 'funding_active' ? 'status-open' : 'status-coming'}`}>
                        {p.status === 'funding_active' ? 'Collecte en cours' : 'À venir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-link-simple" onClick={() => navigate('/investor/projects')}>
              Voir tous les projets
            </button>
          </div>

          <div className="sidebar-card">
            <h4>Statuts</h4>
            <div className="circular-chart">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="#f3f4f6" />
                <circle cx="60" cy="60" r="35" fill="white" />
                <text x="60" y="65" textAnchor="middle" fill="#6b7280" fontSize="24" fontWeight="600">0</text>
                <text x="60" y="80" textAnchor="middle" fill="#9ca3af" fontSize="12">projets</text>
              </svg>
            </div>
          </div>

          <div className="sidebar-card">
            <h4>Typologie</h4>
            <div className="circular-chart">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="#f3f4f6" />
                <circle cx="60" cy="60" r="35" fill="white" />
                <text x="60" y="65" textAnchor="middle" fill="#6b7280" fontSize="24" fontWeight="600">0</text>
                <text x="60" y="80" textAnchor="middle" fill="#9ca3af" fontSize="12">projets</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
