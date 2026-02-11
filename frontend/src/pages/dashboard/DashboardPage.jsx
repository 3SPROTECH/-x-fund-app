import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, porteurDashboardApi } from '../../api/investments';
import { walletApi } from '../../api/wallet';
import {
  Wallet, TrendingUp, FileCheck, Building, Briefcase, ArrowRight,
  ArrowDownCircle, ArrowUpCircle, PieChart, Users, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

const KYC_LABELS = { pending: 'En attente', submitted: 'Soumis', verified: 'Vérifié', rejected: 'Rejeté' };
const KYC_BADGE = { pending: 'kyc-pending', submitted: 'kyc-submitted', verified: 'kyc-verified', rejected: 'kyc-rejected' };
const fmt = (c) => (c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100));
const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé' };

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
      }
      const [walletRes, txRes, dashRes] = await Promise.allSettled(promises);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
      if (txRes.status === 'fulfilled') setRecentTx((txRes.value.data.data || []).slice(0, 5));
      if (dashRes.status === 'fulfilled') {
        const data = dashRes.value.data.data || dashRes.value.data;
        if (isPorteur) setPorteurDashboard(data);
        else setInvestorDashboard(data);
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
                          <td>{p.title}</td>
                          <td><span className="badge">{STATUS_LABELS[p.status] || p.status}</span></td>
                          <td>{p.funding_progress_percent?.toFixed(0) ?? 0}%</td>
                          <td>{fmt(p.amount_raised_cents)}</td>
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
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.first_name} !</h1>
          <p className="text-muted">Tableau de bord investisseur</p>
        </div>
        <span className="badge badge-primary">{roleLabel[user?.role] || user?.role}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary"><Wallet size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{fmt(wallet?.balance_cents)}</span>
            <span className="stat-label">Solde portefeuille</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{fmt(investorDashboard?.total_invested_cents ?? wallet?.total_deposited_cents)}</span>
            <span className="stat-label">Total investi</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning"><PieChart size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{investorDashboard?.active_investments_count ?? 0}</span>
            <span className="stat-label">Investissements actifs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info"><FileCheck size={20} /></div>
          <div className="stat-content">
            <span className={`badge ${KYC_BADGE[user?.kyc_status] || 'kyc-pending'}`} style={{ fontSize: '.85rem' }}>
              {KYC_LABELS[user?.kyc_status] || 'En attente'}
            </span>
            <span className="stat-label">Statut KYC</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="two-col-main">
          {investorDashboard && (
            <div className="card">
              <div className="card-header">
                <h3>Résumé du portefeuille</h3>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/investments')}>
                  Voir tout <ArrowRight size={14} />
                </button>
              </div>
              <div className="detail-grid">
                {investorDashboard.total_invested_cents != null && (
                  <div className="detail-row"><span>Total investi</span><span>{fmt(investorDashboard.total_invested_cents)}</span></div>
                )}
                {investorDashboard.total_dividends_received_cents != null && (
                  <div className="detail-row"><span>Dividendes reçus</span><span className="amount-positive">{fmt(investorDashboard.total_dividends_received_cents)}</span></div>
                )}
                {investorDashboard.active_investments_count != null && (
                  <div className="detail-row"><span>Projets actifs</span><span>{investorDashboard.active_investments_count}</span></div>
                )}
                <div className="detail-row"><span>Solde disponible</span><span>{fmt(wallet?.balance_cents)}</span></div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3>Transactions récentes</h3>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/wallet')}>
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>Aucune transaction récente</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Montant</th></tr>
                  </thead>
                  <tbody>
                    {recentTx.map((tx) => {
                      const a = tx.attributes || tx;
                      const isCredit = ['depot', 'dividende', 'remboursement'].includes(a.transaction_type);
                      return (
                        <tr key={tx.id}>
                          <td>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                          <td style={{ textTransform: 'capitalize' }}>{a.transaction_type}</td>
                          <td className={isCredit ? 'amount-positive' : 'amount-negative'}>
                            {isCredit ? '+' : '-'}{fmt(a.amount_cents)}
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

        <div className="two-col-side">
          <div className="card">
            <h3>Actions rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <button type="button" className="btn btn-block" onClick={() => navigate('/wallet')} style={{ justifyContent: 'flex-start' }}>
                <ArrowDownCircle size={16} /> Déposer des fonds
              </button>
              <button type="button" className="btn btn-block" onClick={() => navigate('/projects')} style={{ justifyContent: 'flex-start' }}>
                <TrendingUp size={16} /> Explorer les projets
              </button>
              <button type="button" className="btn btn-block" onClick={() => navigate('/investments')} style={{ justifyContent: 'flex-start' }}>
                <Briefcase size={16} /> Mes investissements
              </button>
            </div>
          </div>

          {user?.kyc_status !== 'verified' && (
            <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <h3>Vérification KYC</h3>
              <p className="text-muted" style={{ marginBottom: '.75rem' }}>
                {user?.kyc_status === 'submitted'
                  ? 'Vos documents sont en cours de vérification.'
                  : user?.kyc_status === 'rejected'
                    ? 'Votre vérification a été rejetée. Veuillez soumettre à nouveau.'
                    : 'Complétez votre vérification KYC pour investir.'}
              </p>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/kyc')}>
                {user?.kyc_status === 'rejected' ? 'Re-soumettre' : 'Compléter le KYC'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
