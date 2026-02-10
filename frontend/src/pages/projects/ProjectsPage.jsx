import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { TrendingUp, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé', annule: 'Annulé' };
const STATUS_BADGE = { brouillon: 'badge-warning', ouvert: 'badge-success', finance: 'badge-info', cloture: '', annule: 'badge-danger' };

const formatCents = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadProjects(); }, [page, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await investmentProjectsApi.list(params);
      setProjects(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Projets d'investissement</h1>
          <p className="text-muted">Découvrez les opportunités d'investissement immobilier</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Statut</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="ouvert">Ouvert</option>
            <option value="finance">Financé</option>
            <option value="cloture">Clôturé</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card"><div className="empty-state"><TrendingUp size={48} /><p>Aucun projet disponible</p></div></div>
      ) : (
        <>
          <div className="project-grid">
            {projects.map(p => {
              const a = p.attributes || p;
              return (
                <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="project-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 650, margin: 0 }}>{a.title}</h3>
                      <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                    </div>
                    {a.property_city && <p className="text-muted"><MapPin size={14} /> {a.property_city}</p>}
                    <div className="progress-bar-container" style={{ marginTop: '.75rem' }}>
                      <div className="progress-bar" style={{ width: `${Math.min(a.funding_progress_percent || 0, 100)}%` }} />
                    </div>
                    <div className="progress-info">
                      <span>{formatCents(a.amount_raised_cents)} levés</span>
                      <span>{Math.round(a.funding_progress_percent || 0)}%</span>
                    </div>
                    <div className="property-card-stats" style={{ marginTop: '.75rem' }}>
                      <div className="property-card-stat">
                        <label>Objectif</label>
                        <span>{formatCents(a.total_amount_cents)}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Prix / part</label>
                        <span>{formatCents(a.share_price_cents)}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Parts dispo.</label>
                        <span>{a.available_shares ?? '—'}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Rendement</label>
                        <span className="yield">{a.net_yield_percent ?? a.gross_yield_percent ?? '—'}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-card-footer">
                    <span>Du {a.funding_start_date ? new Date(a.funding_start_date).toLocaleDateString('fr-FR') : '—'}</span>
                    <span>Au {a.funding_end_date ? new Date(a.funding_end_date).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                </div>
              );
            })}
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
