import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi } from '../../api/investments';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = { en_cours: 'En cours', confirme: 'Confirmé', cloture: 'Clôturé', liquide: 'Liquidé', annule: 'Annulé' };
const STATUS_BADGE = { en_cours: 'badge-warning', confirme: 'badge-success', cloture: 'badge-info', liquide: '', annule: 'badge-danger' };

const fmt = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function MyInvestmentsPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await investmentsApi.list(params);
      setInvestments(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mes Investissements</h1>
          <p className="text-muted">Suivi de votre portefeuille d'investissements</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Statut</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="en_cours">En cours</option>
            <option value="confirme">Confirmé</option>
            <option value="cloture">Clôturé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : investments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Briefcase size={48} />
            <p>Aucun investissement pour le moment</p>
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>Découvrir les projets</button>
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Montant</th>
                  <th>Parts</th>
                  <th>Valeur actuelle</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const a = inv.attributes || inv;
                  return (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => a.investment_project_id && navigate(`/projects/${a.investment_project_id}`)}>
                      <td style={{ fontWeight: 550 }}>{a.project_title || '—'}</td>
                      <td>{fmt(a.amount_cents)}</td>
                      <td>{a.shares_count}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(a.current_value_cents)}</td>
                      <td>{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
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
  );
}
