import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, porteurDashboardApi, investmentProjectsApi } from '../../api/investments';
import { projectDraftsApi } from '../../api/projectDrafts';
import { walletApi } from '../../api/wallet';
import { getImageUrl } from '../../api/client';
import {
  Wallet, TrendingUp, FileCheck, Building, Briefcase, ArrowRight,
  ArrowDownCircle, ArrowUpCircle, PieChart, Users, DollarSign, AlertCircle, ChevronRight,
  Plus, MapPin, Tag, Calendar, Clock, MessageCircle, X, Send, FileEdit, Trash2, Eye,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';

const KYC_LABELS = { pending: 'En attente', submitted: 'Soumis', verified: 'Vérifié', rejected: 'Rejeté' };
const KYC_BADGE = { pending: 'kyc-pending', submitted: 'kyc-submitted', verified: 'kyc-verified', rejected: 'kyc-rejected' };
const fmt = (c) => (c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100));
const STATUS_LABELS = {
  draft: 'Brouillon', pending_analysis: 'En Analyse', info_requested: 'Compléments requis',
  rejected: 'Refusé', approved: 'Approuvé', legal_structuring: 'Montage Juridique',
  signing: 'En Signature', funding_active: 'En Collecte', funded: 'Financé',
  under_construction: 'En Travaux', operating: 'En Exploitation', repaid: 'Remboursé',
};
const STATUS_BADGE = {
  draft: 'badge-warning', pending_analysis: 'badge-info', info_requested: 'badge-warning',
  rejected: 'badge-danger', approved: 'badge-success', legal_structuring: 'badge-info',
  signing: 'badge-info', funding_active: 'badge-success', funded: 'badge-success',
  under_construction: 'badge-warning', operating: 'badge-info', repaid: 'badge-success',
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
  const [porteurProjects, setPorteurProjects] = useState([]);
  const [porteurDrafts, setPorteurDrafts] = useState([]);
  const [otherProjects, setOtherProjects] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [porteurStatusFilter, setPorteurStatusFilter] = useState('');

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
        promises.push(investmentProjectsApi.list({ per_page: 50 }));
        promises.push(projectDraftsApi.list());
      } else {
        promises.push(dashboardApi.get());
        promises.push(investmentProjectsApi.list({ status: 'funding_active', per_page: 6 }));
      }
      const results = await Promise.allSettled(promises);

      if (isPorteur) {
        const [walletRes, txRes, dashRes, allProjectsRes, draftsRes] = results;
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
        if (txRes.status === 'fulfilled') setRecentTx((txRes.value.data.data || []).slice(0, 5));
        if (dashRes.status === 'fulfilled') {
          setPorteurDashboard(dashRes.value.data.data || dashRes.value.data);
        }
        if (allProjectsRes && allProjectsRes.status === 'fulfilled') {
          const all = allProjectsRes.value.data.data || [];
          const uid = String(user?.id);
          const mine = all.filter(p => String((p.attributes || p).owner_id) === uid);
          const fundedStatuses = ['funded', 'under_construction', 'operating', 'repaid'];
          const others = all.filter(p => {
            const a = p.attributes || p;
            return String(a.owner_id) !== uid && fundedStatuses.includes(a.status);
          });
          setPorteurProjects(mine);
          setOtherProjects(others.slice(0, 6));
        }
        if (draftsRes && draftsRes.status === 'fulfilled') {
          setPorteurDrafts(draftsRes.value.data.data || []);
        }
      } else {
        const [walletRes, txRes, dashRes, projectsRes] = results;
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
        if (txRes.status === 'fulfilled') setRecentTx((txRes.value.data.data || []).slice(0, 5));
        if (dashRes.status === 'fulfilled') {
          setInvestorDashboard(dashRes.value.data.data || dashRes.value.data);
        }
        if (projectsRes && projectsRes.status === 'fulfilled') {
          setFeaturedProjects(projectsRes.value.data.data || []);
        }
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId, e) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment supprimer ce brouillon ?')) return;
    try {
      await projectDraftsApi.delete(draftId);
      setPorteurDrafts((prev) => prev.filter((d) => d.id !== draftId));
      toast.success('Brouillon supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteProject = async (projectId, projectTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Voulez-vous vraiment supprimer "${projectTitle}" ?`)) return;
    try {
      await investmentProjectsApi.delete(projectId);
      setPorteurProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success('Projet supprimé');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  if (user?.role === 'administrateur') return null;
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const roleLabel = { investisseur: 'Investisseur', porteur_de_projet: 'Porteur de projet', administrateur: 'Administrateur' };

  // ——— Dashboard PORTEUR ———
  if (isPorteur) {
    const formatCents = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);

    // Status → button label
    const STATUS_ACTION = {
      draft: 'Compléter',
      pending_analysis: 'Consulter',
      info_requested: 'Compléter',
      rejected: 'Voir le refus',
      approved: 'Voir',
      legal_structuring: 'Voir',
      signing: 'Signer',
      funding_active: 'Suivre la collecte',
      funded: 'Voir',
      under_construction: 'Voir',
      operating: 'Voir',
      repaid: 'Voir',
    };

    // Merge drafts + projects, apply filter
    const allItems = [
      ...porteurDrafts.map(d => ({ type: 'draft', id: `draft-${d.id}`, raw: d, status: 'draft' })),
      ...porteurProjects.map(p => {
        const a = p.attributes || p;
        return { type: 'project', id: p.id, raw: p, status: a.status, attrs: a };
      }),
    ];
    const filteredItems = porteurStatusFilter
      ? allItems.filter(item => item.status === porteurStatusFilter)
      : allItems;

    return (
      <div className="porteur-dashboard">
        {/* Welcome */}
        <div className="porteur-welcome">
          <div>
            <h1 className="porteur-welcome-title">Bonjour, {user?.first_name} !</h1>
            <p className="porteur-welcome-sub">Bienvenue sur votre espace porteur de projet</p>
          </div>
        </div>

        {/* My Projects + CTA */}
        <section className="porteur-section">
          <h2 className="porteur-section-title">Mes projets</h2>

          <TableFilters
            filters={[
              { key: 'status', label: 'Statut', value: porteurStatusFilter, options: [
                { value: '', label: 'Tous' },
                { value: 'draft', label: 'Brouillon' },
                { value: 'pending_analysis', label: 'En Analyse' },
                { value: 'info_requested', label: 'Compléments requis' },
                { value: 'funding_active', label: 'En Collecte' },
                { value: 'funded', label: 'Financé' },
                { value: 'under_construction', label: 'En Travaux' },
                { value: 'operating', label: 'En Exploitation' },
                { value: 'repaid', label: 'Remboursé' },
              ]},
            ]}
            onFilterChange={(key, value) => setPorteurStatusFilter(value)}
          />

          <div className="porteur-projects-row">
            {filteredItems.map((item) => {
              if (item.type === 'draft') {
                const draft = item.raw;
                const fd = draft.form_data || {};
                const title = fd.presentation?.title || 'Projet sans nom';
                const subtitle = fd.presentation?.project_type || 'Brouillon';

                return (
                  <div key={item.id} className="pcard" onClick={() => navigate(`/projects/new?draft=${draft.id}`)}>
                    <div className="pcard-top">
                      <span className="badge badge-warning">Brouillon</span>
                    </div>
                    <div className="pcard-info">
                      <h4 className="pcard-title">{title}</h4>
                      <p className="pcard-subtitle">{subtitle}</p>
                    </div>
                    <div className="pcard-bottom">
                      <button
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="porteur-delete-btn"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button type="button" className="pcard-action-btn">
                        Compléter <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              // Published project
              const p = item.raw;
              const a = item.attrs;
              const progress = Math.min(a.funding_progress_percent || 0, 100);
              const isOwner = user?.id === a.owner_id;
              const canDelete = isOwner && a.status === 'draft';
              const showForm = isOwner && (a.status === 'draft' || a.status === 'pending_analysis');
              const cardHref = showForm ? `/projects/new?project=${p.id}` : `/projects/${p.id}`;
              const actionLabel = STATUS_ACTION[a.status] || 'Voir';
              const isFunding = a.status === 'funding_active';
              const isAnalysis = a.status === 'pending_analysis';

              return (
                <div key={p.id} className="pcard" onClick={() => navigate(cardHref)}>
                  <div className="pcard-top">
                    <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                  </div>
                  <div className="pcard-info">
                    <h4 className="pcard-title">{a.title}</h4>
                    <p className="pcard-subtitle">{a.property_city || 'Projet'}</p>
                  </div>

                  {/* Funding progress — only when actively funding */}
                  {isFunding && (
                    <div className="pcard-funding">
                      <div className="pcard-funding-bar">
                        <div className="pcard-funding-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="pcard-funding-info">
                        <span>{formatCents(a.amount_raised_cents)}</span>
                        <span className="pcard-funding-pct">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="pcard-bottom">
                    <div className="pcard-bottom-left">
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteProject(p.id, a.title, e)}
                          className="porteur-delete-btn"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      {isAnalysis && (
                        <>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="pcard-pdf-btn"
                            title="Télécharger le dossier"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="pcard-pdf-btn"
                            title="Télécharger le récapitulatif"
                          >
                            <FileEdit size={15} />
                          </button>
                        </>
                      )}
                    </div>
                    <button type="button" className="pcard-action-btn">
                      {actionLabel} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* CTA Card */}
            <div className="porteur-cta-card" onClick={() => navigate('/projects/new')}>
              <div className="porteur-cta-content">
                <h3>Un nouveau projet ?</h3>
                <p>Marchand de bien, locatif, exploitation... Les investisseurs X-Fund vous attendent !</p>
                <button type="button" className="porteur-cta-btn">
                  Nouveau projet <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks section */}
        <section className="porteur-section">
          <h2 className="porteur-section-title">Mes tâches</h2>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tâche</th>
                    <th>Projet</th>
                    <th>Priorité</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      Aucune tâche pour le moment
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Discover other projects */}
        <section className="porteur-section">
          <h2 className="porteur-section-title">Projets financés</h2>
          {otherProjects.length === 0 ? (
            <p className="text-muted">Aucun projet financé pour le moment.</p>
          ) : (
            <div className="porteur-discover-grid">
              {otherProjects.map((p) => {
                const a = p.attributes || p;
                const firstImage = (a.images && a.images.length > 0) ? a.images[0] : (a.property_photos && a.property_photos.length > 0) ? a.property_photos[0] : null;
                return (
                  <div key={p.id} className="porteur-discover-card" style={{ cursor: 'default' }}>
                    <div className="porteur-discover-img">
                      {firstImage ? (
                        <img src={getImageUrl(firstImage.url)} alt={a.title} />
                      ) : (
                        <div className="porteur-discover-img-placeholder">
                          <Building size={28} opacity={0.2} />
                        </div>
                      )}
                      <span className={`porteur-discover-badge ${STATUS_BADGE[a.status] || ''}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                    <div className="porteur-discover-body">
                      <h4>{a.title}</h4>
                      <p className="porteur-discover-price">{formatCents(a.total_amount_cents)}</p>
                      <div className="porteur-discover-meta">
                        {a.property_city && <span><MapPin size={12} /> {a.property_city}</span>}
                        <div className="porteur-discover-stats">
                          {a.net_yield_percent != null && (
                            <span><Tag size={12} /> {a.net_yield_percent}%</span>
                          )}
                          {a.project_duration_months != null && (
                            <span><Calendar size={12} /> {a.project_duration_months} mois</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Floating chat button */}
        <button
          className="porteur-chat-fab"
          onClick={() => setShowChat(!showChat)}
          title="Chat"
        >
          {showChat ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {/* Chat box */}
        {showChat && (
          <div className="porteur-chat-box">
            <div className="porteur-chat-header">
              <div className="porteur-chat-agent">
                <div className="porteur-chat-avatar">EP</div>
                <div className="porteur-chat-agent-info">
                  <span className="porteur-chat-agent-name">Expert Porteur</span>
                  <span className="porteur-chat-agent-role">Conseiller X-Fund</span>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="porteur-chat-close">
                <X size={18} />
              </button>
            </div>
            <div className="porteur-chat-messages">
              <div className="porteur-chat-bubble porteur-chat-bubble--agent">
                <div className="porteur-chat-bubble-avatar">EP</div>
                <div className="porteur-chat-bubble-content">
                  <p>Bonjour {user?.first_name} ! Je suis votre expert dédié. N'hésitez pas si vous avez des questions sur vos projets ou le processus de soumission.</p>
                  <span className="porteur-chat-bubble-time">09:30</span>
                </div>
              </div>
            </div>
            <div className="porteur-chat-input">
              <input type="text" placeholder="Votre message..." disabled />
              <button disabled><Send size={18} /></button>
            </div>
          </div>
        )}
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
          <div className="projects-sidebar">
            <h3>Les projets à la une</h3>
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
                        {p.status === 'funding_active' ? 'Collecte en cours' : STATUS_LABELS[p.status] || p.status}
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

          <div className="charts-grid">
            <div className="chart-box">
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

            <div className="chart-box">
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
    </div>
  );
}
