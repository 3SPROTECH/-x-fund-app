import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  CreditCard, Eye, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';

const TYPE_LABELS = {
  depot: 'Dépôt', retrait: 'Retrait', investissement: 'Investissement',
  dividende: 'Dividende', remboursement: 'Remboursement', frais: 'Frais',
};
const TYPE_BADGE = {
  depot: 'badge-success', retrait: 'badge-danger', investissement: 'badge-info',
  dividende: 'badge-success', remboursement: 'badge-warning', frais: 'badge-danger',
};
const STATUS_LABELS = { en_attente: 'En attente', complete: 'Complété', echoue: 'Échoué', annule: 'Annulé' };
const STATUS_BADGE = { en_attente: 'badge-warning', complete: 'badge-success', echoue: 'badge-danger', annule: 'badge' };

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ transaction_type: '', status: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [page, filters, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.transaction_type) params.transaction_type = filters.transaction_type;
      if (filters.status) params.status = filters.status;
      if (search) params.search = search;
      const res = await adminApi.getTransactions(params);
      setTransactions(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await adminApi.getTransaction(id);
      setSelected(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  const isPositive = (type) => ['depot', 'dividende', 'remboursement'].includes(type);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Transactions</h1>
          <p className="text-muted">Visualisez toutes les transactions de la plateforme</p>
        </div>
        <span className="badge"><CreditCard size={12} /> {meta.total_count ?? transactions.length} transaction(s)</span>
      </div>

      <TableFilters
        filters={[
          { key: 'transaction_type', label: 'Type', value: filters.transaction_type, options: [
            { value: '', label: 'Tous les types' },
            ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
          { key: 'status', label: 'Statut', value: filters.status, options: [
            { value: '', label: 'Tous les statuts' },
            ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher une transaction..."
      />

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Search size={48} />
                <p>Aucune transaction trouvée</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Référence</th><th>Utilisateur</th><th>Type</th><th>Montant</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const a = tx.attributes || tx;
                      const positive = isPositive(a.transaction_type);
                      return (
                        <tr key={tx.id} className={selected?.id === tx.id ? 'row-selected' : ''}>
                          <td><span className="font-mono" style={{ fontSize: '.8rem' }}>{a.reference}</span></td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 550 }}>{a.user_name}</span>
                              <br />
                              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{a.user_email}</span>
                            </div>
                          </td>
                          <td><span className={`badge ${TYPE_BADGE[a.transaction_type] || ''}`}>{TYPE_LABELS[a.transaction_type] || a.transaction_type}</span></td>
                          <td>
                            <span className={positive ? 'amount-positive' : 'amount-negative'}>
                              {positive ? '+' : ''}{fmt(a.amount_cents)}
                            </span>
                          </td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => loadDetail(tx.id)}><Eye size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {meta.total_pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm"><ChevronLeft size={16} /></button>
                  <span>Page {page} / {meta.total_pages}</span>
                  <button disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)} className="btn btn-sm"><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>

        {selected && (() => {
          const a = selected.attributes || selected;
          const positive = isPositive(a.transaction_type);
          return (
            <div className="card user-detail-panel">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div className={`stat-icon ${positive ? 'stat-icon-success' : 'stat-icon-danger'}`} style={{ margin: '0 auto .5rem', width: 48, height: 48 }}>
                  <CreditCard size={24} />
                </div>
                <h3 style={{ marginBottom: '.15rem' }}>
                  <span className={positive ? 'amount-positive' : 'amount-negative'}>
                    {positive ? '+' : ''}{fmt(a.amount_cents)}
                  </span>
                </h3>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
                  <span className={`badge ${TYPE_BADGE[a.transaction_type] || ''}`}>{TYPE_LABELS[a.transaction_type] || a.transaction_type}</span>
                  <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                </div>
              </div>
              <div className="divider" />
              <div className="detail-grid">
                <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selected.id}</span></div>
                <div className="detail-row"><span>Référence</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{a.reference}</span></div>
                <div className="detail-row"><span>Utilisateur</span><span>{a.user_name}</span></div>
                <div className="detail-row"><span>Email</span><span>{a.user_email}</span></div>
                <div className="detail-row"><span>Montant</span><span className={positive ? 'amount-positive' : 'amount-negative'}>{positive ? '+' : ''}{fmt(a.amount_cents)}</span></div>
                <div className="detail-row"><span>Solde après</span><span>{fmt(a.balance_after_cents)}</span></div>
                {a.description && <div className="detail-row"><span>Description</span><span>{a.description}</span></div>}
                {a.processed_at && <div className="detail-row"><span>Traité le</span><span>{new Date(a.processed_at).toLocaleDateString('fr-FR')}</span></div>}
                <div className="detail-row"><span>Créé le</span><span>{new Date(a.created_at).toLocaleString('fr-FR')}</span></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
