import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  TrendingUp, Eye, Search, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import { formatBalance as fmt, INVESTMENT_STATUS_LABELS as STATUS_LABELS, INVESTMENT_STATUS_BADGES as STATUS_BADGE } from '../../utils';
import { LoadingSpinner, Pagination, EmptyState } from '../../components/ui';

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [page, filters, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (search) params.search = search;
      const res = await adminApi.getInvestments(params);
      setInvestments(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des investissements');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await adminApi.getInvestment(id);
      setSelected(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Investissements</h1>
          <p className="text-muted">Visualisez tous les investissements de la plateforme</p>
        </div>
        <span className="badge"><TrendingUp size={12} /> {meta.total_count ?? investments.length} investissement(s)</span>
      </div>

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: filters.status, options: [
            { value: '', label: 'Tous les statuts' },
            ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un investissement..."
      />

      <div className="admin-layout">
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : investments.length === 0 ? (
            <div className="card">
              <EmptyState icon={Search} message="Aucun investissement trouvé" />
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Investisseur</th><th>Projet</th><th>Montant</th><th>Parts</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const a = inv.attributes || inv;
                      return (
                        <tr key={inv.id} className={selected?.id === inv.id ? 'row-selected' : ''}>
                          <td data-label="Investisseur">
                            <div>
                              <span style={{ fontWeight: 550 }}>{a.investor_name}</span>
                              <br />
                              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{a.investor_email}</span>
                            </div>
                          </td>
                          <td data-label="Projet">{a.project_title || '—'}</td>
                          <td data-label="Montant" style={{ fontWeight: 600 }}>{fmt(a.amount_cents)}</td>
                          <td data-label="Parts">{a.shares_count}</td>
                          <td data-label="Statut"><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td data-label="Date">{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                          <td data-label="Actions">
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => loadDetail(inv.id)}><Eye size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
            </>
          )}
        </div>

        {selected && (() => {
          const a = selected.attributes || selected;
          return (
            <div className="card user-detail-panel">
              <button className="detail-panel-close" onClick={() => setSelected(null)}><X size={20} /></button>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon stat-icon-success" style={{ margin: '0 auto .5rem', width: 48, height: 48 }}>
                  <TrendingUp size={24} />
                </div>
                <h3 style={{ marginBottom: '.15rem' }}>{fmt(a.amount_cents)}</h3>
                <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
              </div>
              <div className="divider" />
              <div className="detail-grid">
                <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selected.id}</span></div>
                <div className="detail-row"><span>Investisseur</span><span>{a.investor_name}</span></div>
                <div className="detail-row"><span>Email</span><span>{a.investor_email}</span></div>
                <div className="detail-row"><span>Projet</span><span>{a.project_title}</span></div>
                <div className="detail-row"><span>Montant</span><span style={{ fontWeight: 600 }}>{fmt(a.amount_cents)}</span></div>
                <div className="detail-row"><span>Parts</span><span>{a.shares_count}</span></div>
                <div className="detail-row"><span>Prix de la part</span><span>{fmt(a.share_price_cents)}</span></div>
                <div className="detail-row"><span>Valeur actuelle</span><span className="text-success">{fmt(a.current_value_cents)}</span></div>
                <div className="detail-row"><span>Date d'investissement</span><span>{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</span></div>
                {a.confirmed_at && <div className="detail-row"><span>Confirmé le</span><span>{new Date(a.confirmed_at).toLocaleDateString('fr-FR')}</span></div>}
                <div className="detail-row"><span>Créé le</span><span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
