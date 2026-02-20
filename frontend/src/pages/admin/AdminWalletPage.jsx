import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { Landmark, PiggyBank, TrendingUp, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents as fmt, FEE_TYPE_LABELS, INVESTMENT_STATUS_LABELS as STATUS_LABELS } from '../../utils';
import { LoadingSpinner, EmptyState, Pagination } from '../../components/ui';

export default function AdminWalletPage() {
  const [platformWallet, setPlatformWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allInvestments, setAllInvestments] = useState([]);
  const [allInvMeta, setAllInvMeta] = useState({});
  const [allInvPage, setAllInvPage] = useState(1);

  useEffect(() => { loadPlatformWallet(); }, []);
  useEffect(() => { loadAllInvestments(); }, [allInvPage]);

  const loadPlatformWallet = async () => {
    try {
      const res = await adminApi.getPlatformWallet();
      setPlatformWallet(res.data.data);
    } catch {
      toast.error('Erreur lors du chargement du portefeuille plateforme');
    } finally {
      setLoading(false);
    }
  };

  const loadAllInvestments = async () => {
    try {
      const res = await adminApi.getInvestments({ page: allInvPage });
      setAllInvestments(res.data.data || []);
      setAllInvMeta(res.data.meta || {});
    } catch { /* no investments yet */ }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Portefeuille plateforme</h1>
          <p className="text-muted">Revenus, commissions et historique des investissements</p>
        </div>
      </div>

      {platformWallet && (
        <>
          <div className="stats-grid stats-grid-3">
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary"><Landmark size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(platformWallet.balance_cents)}</span>
                <span className="stat-label">Solde plateforme</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><PiggyBank size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(platformWallet.total_collected_cents)}</span>
                <span className="stat-label">Total collecte</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(218, 165, 32, 0.12)', color: '#DAA520' }}><TrendingUp size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(platformWallet.total_invested_cents)}</span>
                <span className="stat-label">Total investi</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          {platformWallet.revenue_by_type && Object.keys(platformWallet.revenue_by_type).length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h3>Repartition des revenus</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Type de commission</th><th style={{ textAlign: 'right' }}>Montant</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(platformWallet.revenue_by_type).map(([type, cents]) => (
                      <tr key={type}>
                        <td data-label="Type">{FEE_TYPE_LABELS[type] || type}</td>
                        <td data-label="Montant" style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Investments History */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <h3>Historique des investissements</h3>
          <span className="badge"><Briefcase size={12} /> {allInvMeta.total_count ?? allInvestments.length} investissement(s)</span>
        </div>
        {allInvestments.length === 0 ? (
          <EmptyState icon={Briefcase} iconSize={40} message="Aucun investissement pour le moment" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Investisseur</th><th>Projet</th><th>Montant</th><th>Parts</th><th>Valeur actuelle</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {allInvestments.map((inv) => {
                    const a = inv.attributes || inv;
                    const feePercent = a.fee_cents > 0 && a.amount_cents > 0 ? (a.fee_cents / a.amount_cents * 100).toFixed(1).replace(/\.0$/, '') : null;
                    return (
                      <tr key={inv.id}>
                        <td data-label="Date">{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                        <td data-label="Investisseur">
                          <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 500 }}>{a.investor_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.investor_email}</div>
                          </div>
                        </td>
                        <td data-label="Projet" style={{ fontWeight: 550 }}>{a.project_title || '—'}</td>
                        <td data-label="Montant">
                          <div>{fmt(a.amount_cents)}</div>
                          {feePercent && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>incl. {feePercent}% frais</div>}
                        </td>
                        <td data-label="Parts">{a.shares_count}</td>
                        <td data-label="Valeur" style={{ fontWeight: 600 }}>{fmt(a.current_value_cents)}</td>
                        <td data-label="Statut"><span className={`badge ${a.status === 'confirme' ? 'badge-success' : a.status === 'en_cours' ? 'badge-warning' : a.status === 'annule' ? 'badge-danger' : a.status === 'cloture' ? 'badge-info' : ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={allInvPage} totalPages={allInvMeta.total_pages} onPageChange={setAllInvPage} />
          </>
        )}
      </div>
    </div>
  );
}
