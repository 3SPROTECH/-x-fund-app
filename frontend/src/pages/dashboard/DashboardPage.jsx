import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/investments';
import { walletApi } from '../../api/wallet';
import {
  Wallet, TrendingUp, FileCheck, PieChart,
  ArrowRight, ArrowDownCircle, ArrowUpCircle, Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';

const KYC_LABELS = { pending: 'En attente', submitted: 'Soumis', verified: 'Vérifié', rejected: 'Rejeté' };
const KYC_BADGE = { pending: 'kyc-pending', submitted: 'kyc-submitted', verified: 'kyc-verified', rejected: 'kyc-rejected' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, walletRes, txRes] = await Promise.allSettled([
        dashboardApi.get(),
        walletApi.getWallet(),
        walletApi.getTransactions({ page: 1 }),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.data || dashRes.value.data);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
      if (txRes.status === 'fulfilled') setRecentTx((txRes.value.data.data || []).slice(0, 5));
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (cents) => {
    if (cents == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const roleLabel = { investisseur: 'Investisseur', porteur_de_projet: 'Porteur de projet', administrateur: 'Administrateur' };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.first_name} !</h1>
          <p className="text-muted">Bienvenue sur votre tableau de bord X-Fund</p>
        </div>
        <span className={`badge badge-primary`}>{roleLabel[user?.role] || user?.role}</span>
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
            <span className="stat-value">{fmt(dashboard?.total_invested_cents ?? wallet?.total_deposited_cents)}</span>
            <span className="stat-label">Total investi</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning"><PieChart size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{dashboard?.total_investments ?? 0}</span>
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
          {/* Portfolio Summary */}
          {dashboard && (
            <div className="card">
              <div className="card-header">
                <h3>Résumé du portefeuille</h3>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate('/investments')}>
                  Voir tout <ArrowRight size={14} />
                </button>
              </div>
              <div className="detail-grid">
                {dashboard.total_invested_cents != null && (
                  <div className="detail-row"><span>Total investi</span><span>{fmt(dashboard.total_invested_cents)}</span></div>
                )}
                {dashboard.total_dividends_cents != null && (
                  <div className="detail-row"><span>Dividendes reçus</span><span className="amount-positive">{fmt(dashboard.total_dividends_cents)}</span></div>
                )}
                {dashboard.active_projects != null && (
                  <div className="detail-row"><span>Projets actifs</span><span>{dashboard.active_projects}</span></div>
                )}
                <div className="detail-row"><span>Solde disponible</span><span>{fmt(wallet?.balance_cents)}</span></div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <h3>Transactions récentes</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/wallet')}>
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
          {/* Quick Actions */}
          <div className="card">
            <h3>Actions rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <button className="btn btn-block" onClick={() => navigate('/wallet')} style={{ justifyContent: 'flex-start' }}>
                <ArrowDownCircle size={16} /> Déposer des fonds
              </button>
              <button className="btn btn-block" onClick={() => navigate('/projects')} style={{ justifyContent: 'flex-start' }}>
                <TrendingUp size={16} /> Explorer les projets
              </button>
              <button className="btn btn-block" onClick={() => navigate('/investments')} style={{ justifyContent: 'flex-start' }}>
                <Briefcase size={16} /> Mes investissements
              </button>
              <button className="btn btn-block" onClick={() => navigate('/properties')} style={{ justifyContent: 'flex-start' }}>
                <ArrowUpCircle size={16} /> Biens immobiliers
              </button>
            </div>
          </div>

          {/* KYC Card */}
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
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/kyc')}>
                {user?.kyc_status === 'rejected' ? 'Re-soumettre' : 'Compléter le KYC'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
