import { useState, useEffect } from 'react';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, TrendingDown, ReceiptText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../../api/wallet';
import useWalletStore from '../../stores/useWalletStore';
import { formatCents as fmt, TX_TYPE_LABELS, TX_CREDIT_TYPES as TX_CREDIT } from '../../utils';
import { LoadingSpinner, EmptyState, Pagination } from '../../components/ui';

export default function UserWalletPage() {
  const { wallet, loading: walletLoading, fetchWallet } = useWalletStore();
  const [transactions, setTransactions] = useState([]);
  const [txMeta, setTxMeta] = useState({});
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchWallet().finally(() => setLoading(false)); }, []);
  useEffect(() => { loadTransactions(); }, [txPage]);

  const loadTransactions = async () => {
    try {
      const res = await walletApi.getTransactions({ page: txPage });
      setTransactions(res.data.data || []);
      setTxMeta(res.data.meta || {});
    } catch { /* no transactions yet */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) { toast.error('Montant invalide'); return; }
    setSubmitting(true);
    try {
      if (action === 'deposit') {
        await walletApi.deposit(cents);
        toast.success('Dépôt effectué avec succès');
      } else {
        await walletApi.withdraw(cents);
        toast.success('Retrait effectué avec succès');
      }
      setAmount('');
      setAction(null);
      fetchWallet();
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Portefeuille</h1>
          <p className="text-muted">Gérez vos fonds et consultez vos transactions</p>
        </div>
      </div>

      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary"><Wallet size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{fmt(wallet?.balance_cents)}</span>
            <span className="stat-label">Solde actuel</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{fmt(wallet?.total_deposited_cents)}</span>
            <span className="stat-label">Total déposé</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger"><TrendingDown size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{fmt(wallet?.total_withdrawn_cents)}</span>
            <span className="stat-label">Total retiré</span>
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="card">
        <h3>Operations</h3>
        {action ? (
          <form onSubmit={handleSubmit}>
            <p style={{ marginBottom: '.75rem', fontWeight: 550 }}>
              {action === 'deposit' ? 'Montant du dépôt' : 'Montant du retrait'} (EUR)
            </p>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="number" step="0.01" min="0.01"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00" required autoFocus
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
              <button type="submit" className={`btn ${action === 'deposit' ? 'btn-success' : 'btn-danger'}`} disabled={submitting}>
                {submitting ? <><div className="spinner spinner-sm" /> En cours...</> : 'Confirmer'}
              </button>
              <button type="button" className="btn" onClick={() => setAction(null)}>Annuler</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="btn btn-success" onClick={() => setAction('deposit')}>
              <ArrowDownCircle size={16} /> Déposer
            </button>
            <button className="btn btn-danger" onClick={() => setAction('withdraw')}>
              <ArrowUpCircle size={16} /> Retirer
            </button>
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div className="card">
        <div className="card-header">
          <h3>Historique des transactions</h3>
          <span className="badge"><ReceiptText size={12} /> {txMeta.total_count ?? transactions.length} transaction(s)</span>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={ReceiptText} iconSize={40} message="Aucune transaction pour le moment" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Montant</th><th>Solde après</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const a = tx.attributes || tx;
                    const isCredit = TX_CREDIT.includes(a.transaction_type);
                    return (
                      <tr key={tx.id}>
                        <td data-label="Date">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                        <td data-label="Type"><span className="badge">{TX_TYPE_LABELS[a.transaction_type] || a.transaction_type}</span></td>
                        <td data-label="Montant" className={isCredit ? 'amount-positive' : 'amount-negative'}>
                          {isCredit ? '+' : '-'}{fmt(a.amount_cents)}
                        </td>
                        <td data-label="Solde après">{fmt(a.balance_after_cents)}</td>
                        <td data-label="Statut"><span className={`badge ${a.status === 'completed' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : ''}`}>{a.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={txPage} totalPages={txMeta.total_pages} onPageChange={setTxPage} />
          </>
        )}
      </div>
    </div>
  );
}
