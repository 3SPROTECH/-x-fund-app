import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, porteurDashboardApi, investmentProjectsApi } from '../../api/investments';
import { walletApi } from '../../api/wallet';
import {
  Wallet, TrendingUp, FileCheck, Building, Briefcase, ArrowRight,
  ArrowDownCircle, ArrowUpCircle, PieChart, Users, DollarSign, AlertCircle, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const KYC_LABELS = { pending: 'En attente', submitted: 'Soumis', verified: 'Vérifié', rejected: 'Rejeté' };
const KYC_BADGE = { pending: 'kyc-pending', submitted: 'kyc-submitted', verified: 'kyc-verified', rejected: 'kyc-rejected' };
const fmt = (c) => (c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100));
const STATUS_LABELS = {
  draft: 'Brouillon', pending_analysis: 'En Analyse', info_requested: 'Compléments requis',
  rejected: 'Refusé', approved: 'Approuvé', legal_structuring: 'Montage Juridique',
  signing: 'En Signature', funding_active: 'En Collecte', funded: 'Financé',
  under_construction: 'En Travaux', operating: 'En Exploitation', repaid: 'Remboursé',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const isPorteur = user?.role === 'porteur_de_projet';
  const isInvestisseur = user?.role === 'investisseur';

  // Données communes (wallet pour les deux)
  const [wallet, setWallet] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  // Investisseur
  const [investorDashboard, setInvestorDashboard] = useState(null);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  // Porteur
  const [porteurDashboard, setPorteurDashboard] = useState(null);

  useEffect(() => {
    if (user?.role === 'administrateur') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    loadData();
  }, [user?.role]);

  const loadData = async () => {
    if (user?.role === 'administrateur') return;
    setLoading(true);
    try {
      const promises = [walletApi.getWallet(), walletApi.getTransactions({ page: 1 })];
      if (isPorteur) {
        promises.push(porteurDashboardApi.get());
      } else {
        promises.push(dashboardApi.get());
        promises.push(investmentProjectsApi.list({ status: 'funding_active', per_page: 6 }));
      }
      const results = await Promise.allSettled(promises);
      const [walletRes, txRes, dashRes, projectsRes] = results;

      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
      if (txRes.status === 'fulfilled') setRecentTx((txRes.value.data.data || []).slice(0, 5));
      if (dashRes.status === 'fulfilled') {
        const data = dashRes.value.data.data || dashRes.value.data;
        if (isPorteur) setPorteurDashboard(data);
        else setInvestorDashboard(data);
      }
      if (projectsRes && projectsRes.status === 'fulfilled') {
        setFeaturedProjects(projectsRes.value.data.data || []);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'administrateur') return null;
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const roleLabel = { investisseur: 'Investisseur', porteur_de_projet: 'Porteur de projet', administrateur: 'Administrateur' };

  // ——— Dashboard PORTEUR ———
  if (isPorteur && porteurDashboard) {
    const props = porteurDashboard.properties || {};
    const proj = porteurDashboard.projects || {};
    const inv = porteurDashboard.investments_received || {};
    const recentProps = porteurDashboard.recent_properties || [];
    const recentProj = porteurDashboard.recent_projects || [];

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Bonjour, {user?.first_name} !</h1>
            <p className="text-muted">Tableau de bord porteur de projet</p>
          </div>
          <span className="badge badge-primary">{roleLabel[user?.role] || user?.role}</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/properties')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-icon-primary"><Building size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{props.total ?? 0}</span>
              <span className="stat-label">Biens immobiliers</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-icon-success"><TrendingUp size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{proj.total ?? 0}</span>
              <span className="stat-label">Projets</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-info"><Users size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{inv.total_investors ?? 0}</span>
              <span className="stat-label">Investisseurs</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-warning"><DollarSign size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{fmt(inv.total_amount_cents)}</span>
              <span className="stat-label">Montants levés</span>
            </div>
          </div>
        </div>

        <div className="two-col">
          <div className="two-col-main">
            <div className="card">
              <div className="card-header">
                <h3>Projets récents</h3>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/projects')}>
                  Voir tout <ArrowRight size={14} />
                </button>
              </div>
              {recentProj.length === 0 ? (
                <p className="text-muted" style={{ padding: '1rem 0' }}>Aucun projet. Créez un bien puis un projet depuis Biens immobiliers.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr><th>Projet</th><th>Statut</th><th>Avancement</th><th>Levé</th></tr>
                    </thead>
                    <tbody>
                      {recentProj.map((p) => (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                          <td data-label="Projet">{p.title}</td>
                          <td data-label="Statut"><span className="badge">{STATUS_LABELS[p.status] || p.status}</span></td>
                          <td data-label="Avancement">{p.funding_progress_percent?.toFixed(0) ?? 0}%</td>
                          <td data-label="Levé">{fmt(p.amount_raised_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-header">
                <h3>Biens récents</h3>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/properties')}>
                  Voir tout <ArrowRight size={14} />
                </button>
              </div>
              {recentProps.length === 0 ? (
                <p className="text-muted" style={{ padding: '1rem 0' }}>Aucun bien. Ajoutez un bien immobilier pour créer un projet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentProps.map((p) => (
                    <li key={p.id} style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/properties')}>
                      <strong>{p.title}</strong> — {p.city} <span className="badge" style={{ marginLeft: '.5rem' }}>{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="two-col-side">
            <div className="card">
              <h3>Actions rapides</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <button type="button" className="btn btn-block" onClick={() => navigate('/properties')} style={{ justifyContent: 'flex-start' }}>
                  <Building size={16} /> Mes biens immobiliers
                </button>
                <button type="button" className="btn btn-block" onClick={() => navigate('/projects')} style={{ justifyContent: 'flex-start' }}>
                  <TrendingUp size={16} /> Projets
                </button>
                <button type="button" className="btn btn-block" onClick={() => navigate('/wallet')} style={{ justifyContent: 'flex-start' }}>
                  <Wallet size={16} /> Portefeuille
                </button>
              </div>
            </div>
            {user?.kyc_status !== 'verified' && (
              <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
                <h3>KYC</h3>
                <p className="text-muted" style={{ fontSize: '.9rem' }}>Complétez votre vérification si nécessaire.</p>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/kyc')}>Compléter le KYC</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ——— Dashboard INVESTISSEUR ———
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
              <button className="btn-alert" onClick={() => navigate(user?.kyc_status !== 'verified' ? '/kyc' : '/projects')}>
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
            <button className="btn-secondary" onClick={() => navigate('/projects')}>
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
                    <div key={project.id} className="project-item-simple" onClick={() => navigate(`/projects/${project.id}`)}>
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
            <button className="btn-link-simple" onClick={() => navigate('/projects')}>
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
