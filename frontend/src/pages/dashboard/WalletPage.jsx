import { useState, useEffect } from 'react';
import { walletApi } from '../../api/wallet';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, ReceiptText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TX_TYPE_LABELS = {
  depot: 'Dépôt', retrait: 'Retrait', investissement: 'Investissement',
  dividende: 'Dividende', remboursement: 'Remboursement', frais: 'Frais',
};
const TX_CREDIT = ['depot', 'dividende', 'remboursement'];

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txMeta, setTxMeta] = useState({});
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadWallet(); }, []);
  useEffect(() => { loadTransactions(); }, [txPage]);

  const loadWallet = async () => {
    try {
      const res = await walletApi.getWallet();
      setWallet(res.data.data?.attributes || res.data);
    } catch {
      toast.error('Erreur lors du chargement du portefeuille');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await walletApi.getTransactions({ page: txPage });
      setTransactions(res.data.data || []);
      setTxMeta(res.data.meta || {});
    } catch { /* no transactions yet */ }
  };

  const fmt = (cents) => {
    if (cents == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
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
      loadWallet();
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Portefeuille</h1>
          <p className="text-muted">Gérez vos fonds et consultez vos transactions</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
        <h3>Opérations</h3>
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
          <div className="empty-state">
            <ReceiptText size={40} />
            <p>Aucune transaction pour le moment</p>
          </div>
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
                        <td>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                        <td><span className="badge">{TX_TYPE_LABELS[a.transaction_type] || a.transaction_type}</span></td>
                        <td className={isCredit ? 'amount-positive' : 'amount-negative'}>
                          {isCredit ? '+' : '-'}{fmt(a.amount_cents)}
                        </td>
                        <td>{fmt(a.balance_after_cents)}</td>
                        <td><span className={`badge ${a.status === 'completed' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : ''}`}>{a.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {txMeta.total_pages > 1 && (
              <div className="pagination">
                <button disabled={txPage <= 1} onClick={() => setTxPage(txPage - 1)} className="btn btn-sm"><ChevronLeft size={16} /></button>
                <span>Page {txPage} / {txMeta.total_pages}</span>
                <button disabled={txPage >= txMeta.total_pages} onClick={() => setTxPage(txPage + 1)} className="btn btn-sm"><ChevronRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
