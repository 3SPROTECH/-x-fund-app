import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { porteurDashboardApi } from '../../api/investments';
import {
  Wallet, TrendingUp, Building, ArrowRight,
  Users, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents as fmt, ROLE_LABELS, PROJECT_STATUS_LABELS as STATUS_LABELS } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function PorteurDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [porteurDashboard, setPorteurDashboard] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await porteurDashboardApi.get();
      setPorteurDashboard(res.data.data || res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!porteurDashboard) return null;

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
        <span className="badge badge-primary">{ROLE_LABELS[user?.role] || user?.role}</span>
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
