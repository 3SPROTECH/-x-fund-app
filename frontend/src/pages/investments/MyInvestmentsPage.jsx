import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi } from '../../api/investments';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';

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

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: statusFilter, options: [
            { value: '', label: 'Tous' },
            { value: 'en_cours', label: 'En cours' },
            { value: 'confirme', label: 'Confirmé' },
            { value: 'cloture', label: 'Clôturé' },
            { value: 'annule', label: 'Annulé' },
          ]},
        ]}
        onFilterChange={(key, value) => { setStatusFilter(value); setPage(1); }}
      />

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
                  const feePercent = a.fee_cents > 0 && a.amount_cents > 0 ? (a.fee_cents / a.amount_cents * 100).toFixed(1).replace(/\.0$/, '') : null;
                  return (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => a.investment_project_id && navigate(`/projects/${a.investment_project_id}`)}>
                      <td style={{ fontWeight: 550 }}>{a.project_title || '—'}</td>
                      <td>
                        <div>{fmt(a.amount_cents)}</div>
                        {feePercent && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>incl. {feePercent}% frais plateforme</div>}
                      </td>
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
