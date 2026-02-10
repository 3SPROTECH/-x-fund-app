import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  TrendingUp, Eye, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = { en_cours: 'En cours', confirme: 'Confirmé', cloture: 'Clôturé', liquide: 'Liquidé', annule: 'Annulé' };
const STATUS_BADGE = { en_cours: 'badge-info', confirme: 'badge-success', cloture: 'badge', liquide: 'badge-warning', annule: 'badge-danger' };

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
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

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Statut</label>
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : investments.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Search size={48} />
                <p>Aucun investissement trouvé</p>
              </div>
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
                          <td>
                            <div>
                              <span style={{ fontWeight: 550 }}>{a.investor_name}</span>
                              <br />
                              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{a.investor_email}</span>
                            </div>
                          </td>
                          <td>{a.project_title || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(a.amount_cents)}</td>
                          <td>{a.shares_count}</td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td>{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                          <td>
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
          return (
            <div className="card user-detail-panel">
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
