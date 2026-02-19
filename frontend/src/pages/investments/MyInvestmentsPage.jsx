import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi } from '../../api/investments';
import { Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import { formatCents as fmt, INVESTMENT_STATUS_LABELS as STATUS_LABELS, INVESTMENT_STATUS_BADGES as STATUS_BADGE } from '../../utils';
import { LoadingSpinner, EmptyState, Pagination } from '../../components/ui';

export default function MyInvestmentsPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [page, statusFilter, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
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
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un projet..."
      />

      {!loading && investments.length > 0 && (() => {
        const totalInvested = investments.reduce((sum, inv) => sum + ((inv.attributes || inv).amount_cents || 0), 0);
        const totalDividends = investments.reduce((sum, inv) => sum + ((inv.attributes || inv).dividends_received_cents || 0), 0);
        const totalValue = investments.reduce((sum, inv) => sum + ((inv.attributes || inv).current_value_cents || 0), 0);
        return (
          <div className="stats-grid stats-grid-3" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary"><Briefcase size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(totalInvested)}</span>
                <span className="stat-label">Total investi</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><DollarSign size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(totalDividends)}</span>
                <span className="stat-label">Dividendes reçus</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-info"><TrendingUp size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(totalValue)}</span>
                <span className="stat-label">Valeur actuelle</span>
              </div>
            </div>
          </div>
        );
      })()}

      {loading ? (
        <LoadingSpinner />
      ) : investments.length === 0 ? (
        <div className="card">
          <EmptyState icon={Briefcase} message="Aucun investissement pour le moment">
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>Découvrir les projets</button>
          </EmptyState>
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
                  <th>Dividendes</th>
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
                      <td data-label="Projet" style={{ fontWeight: 550 }}>{a.project_title || '—'}</td>
                      <td data-label="Montant">
                        <div>{fmt(a.amount_cents)}</div>
                        {feePercent && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>incl. {feePercent}% frais plateforme</div>}
                      </td>
                      <td data-label="Parts">{a.shares_count}</td>
                      <td data-label="Dividendes" style={{ color: a.dividends_received_cents > 0 ? 'var(--success)' : 'var(--text-muted)' }}>{a.dividends_received_cents > 0 ? `+${fmt(a.dividends_received_cents)}` : '—'}</td>
                      <td data-label="Valeur actuelle" style={{ fontWeight: 600 }}>{fmt(a.current_value_cents)}</td>
                      <td data-label="Date">{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td data-label="Statut"><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
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
  );
}
